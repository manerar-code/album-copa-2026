import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend';
import { handleCron, type DeletionDataAccess, type DeletionRow, type UserInfo } from './handler.ts';

function createDeletionDataAccess(supabase: ReturnType<typeof createClient>): DeletionDataAccess {
  return {
    async getPendingDeletions(now: string): Promise<DeletionRow[]> {
      const { data, error } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .lte('scheduled_delete_at', now)
        .is('completed_at', null)
        .is('cancelled_at', null);

      if (error) throw error;
      return data ?? [];
    },

    async getReminderEligibleRows(threeDaysFromNow: string): Promise<DeletionRow[]> {
      const { data, error } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .lte('scheduled_delete_at', threeDaysFromNow)
        .is('completed_at', null)
        .is('cancelled_at', null)
        .is('reminder_sent_at', null);

      if (error) throw error;
      return data ?? [];
    },

    async deleteUserCollections(userId: string): Promise<void> {
      const { error } = await supabase
        .from('user_collections')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },

    async deleteUserAlbums(userId: string): Promise<void> {
      const { error } = await supabase
        .from('user_albums')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },

    async deleteAuthUser(userId: string): Promise<void> {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
    },

    async markCompleted(id: string, completedAt: string): Promise<void> {
      const { error } = await supabase
        .from('account_deletion_requests')
        .update({ completed_at: completedAt })
        .eq('id', id);

      if (error) throw error;
    },

    async markReminderSent(id: string, sentAt: string): Promise<void> {
      const { error } = await supabase
        .from('account_deletion_requests')
        .update({ reminder_sent_at: sentAt })
        .eq('id', id);

      if (error) throw error;
    },

    async getUserInfo(userId: string): Promise<UserInfo> {
      const { data, error } = await supabase.auth.admin.getUserById(userId);

      if (error || !data?.user) {
        throw error ?? new Error(`User not found: ${userId}`);
      }

      const metadata = data.user.user_metadata ?? {};
      return {
        email: data.user.email ?? '',
        userName: (metadata.full_name as string) ?? (metadata.name as string) ?? '',
      };
    },
  };
}

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const dataAccess = createDeletionDataAccess(supabase);

  let sendEmail;
  if (resendApiKey) {
    const resend = new Resend(resendApiKey);
    sendEmail = (opts: { from: string; to: string; subject: string; html: string }) =>
      resend.emails.send(opts) as Promise<{ error?: { message: string } }>;
  } else {
    sendEmail = async () => {
      console.warn('RESEND_API_KEY not configured — skipping reminder emails');
      return { error: undefined };
    };
  }

  const result = await handleCron(dataAccess, sendEmail);

  return new Response(JSON.stringify({ ok: true, ...result }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
