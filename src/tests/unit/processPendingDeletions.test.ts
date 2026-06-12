import {
  handleCron,
  type DeletionDataAccess,
  type DeletionRow,
} from '../../../supabase/functions/process-pending-deletions/handler';

function createMockDataAccess(): jest.Mocked<DeletionDataAccess> {
  return {
    getPendingDeletions: jest.fn(),
    getReminderEligibleRows: jest.fn(),
    deleteUserCollections: jest.fn(),
    deleteUserAlbums: jest.fn(),
    deleteAuthUser: jest.fn(),
    markCompleted: jest.fn(),
    markReminderSent: jest.fn(),
    getUserInfo: jest.fn(),
  };
}

const defaultUserInfo = { email: 'user@test.com', userName: 'Test User' };

function makeRow(overrides: Partial<DeletionRow> = {}): DeletionRow {
  return {
    id: 'row-1',
    user_id: 'user-1',
    requested_at: '2026-06-10T10:00:00.000Z',
    scheduled_delete_at: '2026-05-01T10:00:00.000Z',
    cancelled_at: null,
    completed_at: null,
    reminder_sent_at: null,
    ...overrides,
  };
}

describe('process-pending-deletions', () => {
  describe('deletion processing', () => {
    it('deletes user data and marks completed when row is due', async () => {
      const dataAccess = createMockDataAccess();
      const sendEmail = jest.fn();
      dataAccess.getPendingDeletions.mockResolvedValue([makeRow()]);
      dataAccess.getReminderEligibleRows.mockResolvedValue([]);

      const result = await handleCron(dataAccess, sendEmail);

      expect(result.deletionsProcessed).toBe(1);
      expect(dataAccess.deleteUserCollections).toHaveBeenCalledWith('user-1');
      expect(dataAccess.deleteUserAlbums).toHaveBeenCalledWith('user-1');
      expect(dataAccess.deleteAuthUser).toHaveBeenCalledWith('user-1');
      expect(dataAccess.markCompleted).toHaveBeenCalledWith('row-1', expect.any(String));
    });

    it('does NOT trigger deletion when no rows are due', async () => {
      const dataAccess = createMockDataAccess();
      const sendEmail = jest.fn();
      dataAccess.getPendingDeletions.mockResolvedValue([]);
      dataAccess.getReminderEligibleRows.mockResolvedValue([]);

      const result = await handleCron(dataAccess, sendEmail);

      expect(result.deletionsProcessed).toBe(0);
      expect(dataAccess.deleteUserCollections).not.toHaveBeenCalled();
      expect(dataAccess.deleteUserAlbums).not.toHaveBeenCalled();
      expect(dataAccess.deleteAuthUser).not.toHaveBeenCalled();
      expect(dataAccess.markCompleted).not.toHaveBeenCalled();
    });

    it('does NOT trigger deletion when query fails', async () => {
      const dataAccess = createMockDataAccess();
      const sendEmail = jest.fn();
      dataAccess.getPendingDeletions.mockRejectedValue(new Error('DB error'));
      dataAccess.getReminderEligibleRows.mockResolvedValue([]);

      const result = await handleCron(dataAccess, sendEmail);

      expect(result.deletionsProcessed).toBe(0);
      expect(result.errors).toContain('Query pending deletions failed: Error: DB error');
      expect(dataAccess.deleteUserCollections).not.toHaveBeenCalled();
    });

    it('logs error when deleteUserCollections fails and continues', async () => {
      const dataAccess = createMockDataAccess();
      const sendEmail = jest.fn();
      dataAccess.getPendingDeletions.mockResolvedValue([makeRow()]);
      dataAccess.deleteUserCollections.mockRejectedValue(new Error('FK constraint'));
      dataAccess.getReminderEligibleRows.mockResolvedValue([]);

      const result = await handleCron(dataAccess, sendEmail);

      expect(result.deletionsProcessed).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Error processing deletion row-1');
    });

    it('logs error when deleteAuthUser fails and continues', async () => {
      const dataAccess = createMockDataAccess();
      const sendEmail = jest.fn();
      dataAccess.getPendingDeletions.mockResolvedValue([makeRow()]);
      dataAccess.deleteAuthUser.mockRejectedValue(new Error('Auth error'));
      dataAccess.getReminderEligibleRows.mockResolvedValue([]);

      const result = await handleCron(dataAccess, sendEmail);

      expect(result.deletionsProcessed).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('reminder processing', () => {
    it('sends reminder email and marks reminder_sent_at for eligible rows', async () => {
      const dataAccess = createMockDataAccess();
      const sendEmail = jest.fn().mockResolvedValue({ error: undefined });
      dataAccess.getPendingDeletions.mockResolvedValue([]);
      dataAccess.getReminderEligibleRows.mockResolvedValue([
        makeRow({
          id: 'row-1',
          user_id: 'user-1',
          scheduled_delete_at: '2026-06-13T10:00:00.000Z',
        }),
      ]);
      dataAccess.getUserInfo.mockResolvedValue(defaultUserInfo);

      const result = await handleCron(dataAccess, sendEmail);

      expect(result.remindersSent).toBe(1);
      expect(sendEmail).toHaveBeenCalledTimes(1);

      const callArg = sendEmail.mock.calls[0][0];
      expect(callArg.to).toBe('user@test.com');
      expect(callArg.subject).toBe('Sua conta será excluída em breve — Álbum Copa 2026');
      expect(callArg.html).toContain('Test User');
      expect(callArg.html).toContain('exclu\u00edda permanentemente');

      expect(dataAccess.markReminderSent).toHaveBeenCalledWith('row-1', expect.any(String));
    });

    it('does NOT send reminder when no rows are eligible', async () => {
      const dataAccess = createMockDataAccess();
      const sendEmail = jest.fn();
      dataAccess.getPendingDeletions.mockResolvedValue([]);
      dataAccess.getReminderEligibleRows.mockResolvedValue([]);

      const result = await handleCron(dataAccess, sendEmail);

      expect(result.remindersSent).toBe(0);
      expect(sendEmail).not.toHaveBeenCalled();
      expect(dataAccess.markReminderSent).not.toHaveBeenCalled();
    });

    it('does NOT send reminder when query fails', async () => {
      const dataAccess = createMockDataAccess();
      const sendEmail = jest.fn();
      dataAccess.getPendingDeletions.mockResolvedValue([]);
      dataAccess.getReminderEligibleRows.mockRejectedValue(new Error('DB error'));

      const result = await handleCron(dataAccess, sendEmail);

      expect(result.remindersSent).toBe(0);
      expect(result.errors).toContain('Query reminders failed: Error: DB error');
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('skips reminder when getUserInfo fails', async () => {
      const dataAccess = createMockDataAccess();
      const sendEmail = jest.fn();
      dataAccess.getPendingDeletions.mockResolvedValue([]);
      dataAccess.getReminderEligibleRows.mockResolvedValue([
        makeRow({
          id: 'row-1',
          user_id: 'user-1',
          scheduled_delete_at: '2026-06-13T10:00:00.000Z',
        }),
      ]);
      dataAccess.getUserInfo.mockRejectedValue(new Error('User not found'));

      const result = await handleCron(dataAccess, sendEmail);

      expect(result.remindersSent).toBe(0);
      expect(sendEmail).not.toHaveBeenCalled();
      expect(dataAccess.markReminderSent).not.toHaveBeenCalled();
      expect(result.errors).toContain('Failed to get user info for user-1');
    });

    it('sends reminder even when previous sendEmail returned error (non-blocking)', async () => {
      const dataAccess = createMockDataAccess();
      const sendEmail = jest.fn().mockResolvedValue({ error: { message: 'Send failed' } });
      dataAccess.getPendingDeletions.mockResolvedValue([]);
      dataAccess.getReminderEligibleRows.mockResolvedValue([
        makeRow({
          id: 'row-1',
          user_id: 'user-1',
          scheduled_delete_at: '2026-06-13T10:00:00.000Z',
        }),
      ]);
      dataAccess.getUserInfo.mockResolvedValue(defaultUserInfo);

      const result = await handleCron(dataAccess, sendEmail);

      expect(result.remindersSent).toBe(1);
      expect(dataAccess.markReminderSent).toHaveBeenCalledWith('row-1', expect.any(String));
      expect(result.errors).toContain('Reminder email failed for row-1: Send failed');
    });
  });

  describe('combined processing', () => {
    it('handles both deletions and reminders in one run', async () => {
      const dataAccess = createMockDataAccess();
      const sendEmail = jest.fn().mockResolvedValue({ error: undefined });
      dataAccess.getPendingDeletions.mockResolvedValue([
        makeRow({ id: 'del-1', user_id: 'user-a' }),
        makeRow({ id: 'del-2', user_id: 'user-b' }),
      ]);
      dataAccess.getReminderEligibleRows.mockResolvedValue([
        makeRow({
          id: 'rem-1',
          user_id: 'user-1',
          scheduled_delete_at: '2026-06-13T10:00:00.000Z',
        }),
      ]);
      dataAccess.getUserInfo.mockResolvedValue(defaultUserInfo);

      const result = await handleCron(dataAccess, sendEmail);

      expect(result.deletionsProcessed).toBe(2);
      expect(result.remindersSent).toBe(1);
      expect(dataAccess.deleteUserCollections).toHaveBeenCalledWith('user-a');
      expect(dataAccess.deleteUserCollections).toHaveBeenCalledWith('user-b');
      expect(sendEmail).toHaveBeenCalledTimes(1);
    });
  });
});
