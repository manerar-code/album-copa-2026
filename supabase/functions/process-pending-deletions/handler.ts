export interface SendEmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

interface SendEmailResult {
  error?: { message: string };
}

type SendEmailFn = (opts: SendEmailOptions) => Promise<SendEmailResult>;

export interface DeletionRow {
  id: string;
  user_id: string;
  requested_at: string;
  scheduled_delete_at: string;
  cancelled_at: string | null;
  completed_at: string | null;
  reminder_sent_at: string | null;
}

export interface UserInfo {
  email: string;
  userName: string;
}

export interface DeletionDataAccess {
  getPendingDeletions(now: string): Promise<DeletionRow[]>;
  getReminderEligibleRows(threeDaysFromNow: string): Promise<DeletionRow[]>;
  deleteUserCollections(userId: string): Promise<void>;
  deleteUserAlbums(userId: string): Promise<void>;
  deleteAuthUser(userId: string): Promise<void>;
  markCompleted(id: string, completedAt: string): Promise<void>;
  markReminderSent(id: string, sentAt: string): Promise<void>;
  getUserInfo(userId: string): Promise<UserInfo>;
}

const FROM_ADDRESS = 'noreply@album-copa-2026.app';

const REMINDER_SUBJECT = 'Sua conta será excluída em breve — Álbum Copa 2026';

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function buildReminderEmailHtml(userName: string, scheduledDeleteAt: string): string {
  const formattedDate = formatDate(scheduledDeleteAt);
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #0A2342;">Sua conta ser\u00e1 exclu\u00edda em breve</h1>
  <p>Ol\u00e1, <strong>${userName}</strong>!</p>
  <p>Este \u00e9 um lembrete de que sua conta no <strong>\u00c1lbum Copa 2026</strong> ser\u00e1 exclu\u00edda permanentemente em <strong>${formattedDate}</strong>.</p>
  <p>Ap\u00f3s a exclus\u00e3o, todos os seus dados \u2014 incluindo sua cole\u00e7\u00e3o de figurinhas \u2014 ser\u00e3o perdidos.</p>
  <p>Se voc\u00ea deseja manter sua conta, cancele a exclus\u00e3o acessando o aplicativo.</p>
  <p>Atenciosamente,<br/>Equipe \u00c1lbum Copa 2026</p>
  <hr/>
  <p style="font-size: 12px; color: #888;">Este \u00e9 um e-mail autom\u00e1tico. N\u00e3o responda a esta mensagem.</p>
</body>
</html>`;
}

export interface CronResult {
  deletionsProcessed: number;
  remindersSent: number;
  errors: string[];
}

export async function handleCron(
  dataAccess: DeletionDataAccess,
  sendEmail: SendEmailFn,
): Promise<CronResult> {
  const result: CronResult = { deletionsProcessed: 0, remindersSent: 0, errors: [] };
  const now = new Date().toISOString();

  await processPendingDeletions(dataAccess, now, result);
  await processReminders(dataAccess, sendEmail, now, result);

  return result;
}

async function processPendingDeletions(
  dataAccess: DeletionDataAccess,
  now: string,
  result: CronResult,
): Promise<void> {
  let pendingDeletions: DeletionRow[];
  try {
    pendingDeletions = await dataAccess.getPendingDeletions(now);
  } catch (err) {
    result.errors.push(`Query pending deletions failed: ${String(err)}`);
    return;
  }

  for (const row of pendingDeletions) {
    try {
      await dataAccess.deleteUserCollections(row.user_id);
      await dataAccess.deleteUserAlbums(row.user_id);
      await dataAccess.deleteAuthUser(row.user_id);
      await dataAccess.markCompleted(row.id, now);
      result.deletionsProcessed++;
    } catch (err) {
      result.errors.push(`Error processing deletion ${row.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

async function processReminders(
  dataAccess: DeletionDataAccess,
  sendEmail: SendEmailFn,
  now: string,
  result: CronResult,
): Promise<void> {
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  let reminderRows: DeletionRow[];
  try {
    reminderRows = await dataAccess.getReminderEligibleRows(threeDaysFromNow);
  } catch (err) {
    result.errors.push(`Query reminders failed: ${String(err)}`);
    return;
  }

  for (const row of reminderRows) {
    try {
      let userInfo: UserInfo;
      try {
        userInfo = await dataAccess.getUserInfo(row.user_id);
      } catch {
        result.errors.push(`Failed to get user info for ${row.user_id}`);
        continue;
      }

      const emailResult = await sendEmail({
        from: FROM_ADDRESS,
        to: userInfo.email,
        subject: REMINDER_SUBJECT,
        html: buildReminderEmailHtml(userInfo.userName, row.scheduled_delete_at),
      });

      if (emailResult.error) {
        result.errors.push(`Reminder email failed for ${row.id}: ${emailResult.error.message}`);
      }

      await dataAccess.markReminderSent(row.id, now);
      result.remindersSent++;
    } catch (err) {
      result.errors.push(`Error processing reminder ${row.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
