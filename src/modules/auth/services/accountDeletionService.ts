import { supabase } from '@shared/services/supabase';
import { logger } from '@shared/utils/logger';

export interface DeletionRequest {
  id: string;
  userId: string;
  requestedAt: string;
  scheduledDeleteAt: string;
  cancelledAt: string | null;
  completedAt: string | null;
}

interface DeletionRow {
  id: string;
  user_id: string;
  requested_at: string;
  scheduled_delete_at: string;
  cancelled_at: string | null;
  completed_at: string | null;
}

function mapRow(row: DeletionRow): DeletionRequest {
  return {
    id: row.id,
    userId: row.user_id,
    requestedAt: row.requested_at,
    scheduledDeleteAt: row.scheduled_delete_at,
    cancelledAt: row.cancelled_at,
    completedAt: row.completed_at,
  };
}

export const accountDeletionService = {
  async requestDeletion(
    userId: string,
    userEmail: string,
    userName: string,
  ): Promise<DeletionRequest> {
    const scheduledDeleteAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('account_deletion_requests')
      .insert({ user_id: userId, scheduled_delete_at: scheduledDeleteAt })
      .select()
      .single();

    if (error) throw error;

    try {
      const { error: fnError } = await supabase.functions.invoke('send-deletion-confirmation', {
        body: { email: userEmail, userName, scheduledDeleteAt },
      });
      if (fnError) {
        logger.warn('deletion:email_failed', {
          userId,
          error: fnError.message,
        });
      }
    } catch (e) {
      logger.warn('deletion:email_failed', {
        userId,
        error: e instanceof Error ? e.message : String(e),
      });
    }

    logger.log('deletion:requested', { userId, scheduledDeleteAt });

    return mapRow(data);
  },

  async cancelDeletion(userId: string): Promise<void> {
    const pending = await this.getPendingRequest(userId);
    if (!pending) return;

    const cancelledAt = new Date().toISOString();

    const { error } = await supabase
      .from('account_deletion_requests')
      .update({ cancelled_at: cancelledAt })
      .eq('id', pending.id);

    if (error) throw error;

    logger.log('deletion:cancelled', { userId });
  },

  async getPendingRequest(userId: string): Promise<DeletionRequest | null> {
    const { data, error } = await supabase
      .from('account_deletion_requests')
      .select('*')
      .eq('user_id', userId)
      .is('cancelled_at', null)
      .is('completed_at', null)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapRow(data);
  },
};
