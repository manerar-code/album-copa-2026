import { accountDeletionService } from '@modules/auth/services/accountDeletionService';
import { useAuthStore } from '@modules/auth/store/authStore';

jest.mock('@shared/services/supabase', () => {
  const mockFrom = jest.fn();
  const mockInvoke = jest.fn();
  return {
    __esModule: true,
    supabase: {
      from: mockFrom,
      functions: { invoke: mockInvoke },
    },
  };
});

function getSupabase() {
  const mod = require('@shared/services/supabase') as {
    supabase: { from: jest.Mock; functions: { invoke: jest.Mock } };
  };
  return mod.supabase;
}

function createSelectChain(overrides?: { maybeSingleResult?: { data: unknown; error: null } }) {
  const maybeSingle = jest
    .fn()
    .mockResolvedValue(overrides?.maybeSingleResult ?? { data: null, error: null });
  const limit = jest.fn().mockReturnValue({ maybeSingle });
  const order = jest.fn().mockReturnValue({ limit });
  const is = jest.fn();
  const self = { is, order };
  is.mockReturnValue(self);
  const eq = jest.fn().mockReturnValue(self);
  const select = jest.fn().mockReturnValue({ eq });
  return { select, eq, is, order, limit, maybeSingle };
}

function createInsertChain(overrides?: { singleResult?: { data: unknown; error: null } }) {
  const single = jest
    .fn()
    .mockResolvedValue(overrides?.singleResult ?? { data: null, error: { message: 'no row' } });
  const select = jest.fn().mockReturnValue({ single });
  const insert = jest.fn().mockReturnValue({ select });
  return { insert, select, single };
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ pendingDeletion: null });
});

describe('accountDeletionService', () => {
  describe('requestDeletion', () => {
    it('inserts row with scheduled_delete_at ~30 days from now', async () => {
      const supabase = getSupabase();
      const { insert } = createInsertChain({
        singleResult: {
          data: {
            id: 'req-1',
            user_id: 'user-1',
            requested_at: '2026-06-10T10:00:00.000Z',
            scheduled_delete_at: '2026-07-10T10:00:00.000Z',
            cancelled_at: null,
            completed_at: null,
          },
          error: null,
        },
      });
      supabase.from.mockReturnValue({ insert });
      supabase.functions.invoke.mockResolvedValue({ data: null, error: null });

      const result = await accountDeletionService.requestDeletion(
        'user-1',
        'test@test.com',
        'Test',
      );

      expect(supabase.from).toHaveBeenCalledWith('account_deletion_requests');
      expect(insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        scheduled_delete_at: expect.any(String),
      });
      const insertedArg = insert.mock.calls[0][0];
      const scheduledDate = new Date(insertedArg.scheduled_delete_at).getTime();
      const now = Date.now();
      expect(scheduledDate).toBeGreaterThan(now + 29 * 24 * 60 * 60 * 1000);
      expect(scheduledDate).toBeLessThan(now + 31 * 24 * 60 * 60 * 1000);
      expect(result.userId).toBe('user-1');
      expect(result.id).toBe('req-1');
      expect(result.cancelledAt).toBeNull();
      expect(result.completedAt).toBeNull();
    });

    it('calls supabase.functions.invoke with email, userName, scheduledDeleteAt', async () => {
      const supabase = getSupabase();
      const { insert } = createInsertChain({
        singleResult: {
          data: {
            id: 'req-1',
            user_id: 'user-1',
            requested_at: '2026-06-10T10:00:00.000Z',
            scheduled_delete_at: '2026-07-10T10:00:00.000Z',
            cancelled_at: null,
            completed_at: null,
          },
          error: null,
        },
      });
      supabase.from.mockReturnValue({ insert });
      supabase.functions.invoke.mockResolvedValue({ data: null, error: null });

      await accountDeletionService.requestDeletion('user-1', 'test@test.com', 'Test');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-deletion-confirmation', {
        body: {
          email: 'test@test.com',
          userName: 'Test',
          scheduledDeleteAt: expect.any(String),
        },
      });
    });

    it('does NOT throw when functions.invoke rejects (non-blocking)', async () => {
      const supabase = getSupabase();
      const { insert } = createInsertChain({
        singleResult: {
          data: {
            id: 'req-1',
            user_id: 'user-1',
            requested_at: '2026-06-10T10:00:00.000Z',
            scheduled_delete_at: '2026-07-10T10:00:00.000Z',
            cancelled_at: null,
            completed_at: null,
          },
          error: null,
        },
      });
      supabase.from.mockReturnValue({ insert });
      supabase.functions.invoke.mockRejectedValue(new Error('Network error'));

      const result = await accountDeletionService.requestDeletion(
        'user-1',
        'test@test.com',
        'Test',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('req-1');
    });

    it('does NOT throw when functions.invoke returns error in response', async () => {
      const supabase = getSupabase();
      const { insert } = createInsertChain({
        singleResult: {
          data: {
            id: 'req-1',
            user_id: 'user-1',
            requested_at: '2026-06-10T10:00:00.000Z',
            scheduled_delete_at: '2026-07-10T10:00:00.000Z',
            cancelled_at: null,
            completed_at: null,
          },
          error: null,
        },
      });
      supabase.from.mockReturnValue({ insert });
      supabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Function error' },
      });

      const result = await accountDeletionService.requestDeletion(
        'user-1',
        'test@test.com',
        'Test',
      );

      expect(result).toBeDefined();
      expect(supabase.functions.invoke).toHaveBeenCalled();
    });

    it('throws when supabase insert fails', async () => {
      const supabase = getSupabase();
      supabase.from.mockImplementation(() => ({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Insert failed' },
            }),
          }),
        }),
      }));
      supabase.functions.invoke.mockResolvedValue({ data: null, error: null });

      await expect(
        accountDeletionService.requestDeletion('user-1', 'test@test.com', 'Test'),
      ).rejects.toMatchObject({ message: 'Insert failed' });
    });
  });

  describe('cancelDeletion', () => {
    it('updates the pending request with cancelled_at set', async () => {
      const supabase = getSupabase();
      const pendingRow = {
        id: 'req-1',
        user_id: 'user-1',
        requested_at: '2026-06-10T10:00:00.000Z',
        scheduled_delete_at: '2026-07-10T10:00:00.000Z',
        cancelled_at: null,
        completed_at: null,
      };

      const chain = createSelectChain({
        maybeSingleResult: { data: pendingRow, error: null },
      });
      const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      supabase.from.mockReturnValue({ ...chain, update: mockUpdate });

      await accountDeletionService.cancelDeletion('user-1');

      expect(mockUpdate).toHaveBeenCalledWith({
        cancelled_at: expect.any(String),
      });
      expect(mockEq).toHaveBeenCalledWith('id', 'req-1');
    });

    it('does nothing when no pending request exists', async () => {
      const supabase = getSupabase();
      const chain = createSelectChain({
        maybeSingleResult: { data: null, error: null },
      });
      supabase.from.mockReturnValue(chain);

      await accountDeletionService.cancelDeletion('user-1');

      expect(supabase.from).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPendingRequest', () => {
    it('returns null when no matching row exists', async () => {
      const supabase = getSupabase();
      const chain = createSelectChain({
        maybeSingleResult: { data: null, error: null },
      });
      supabase.from.mockReturnValue(chain);

      const result = await accountDeletionService.getPendingRequest('user-1');

      expect(result).toBeNull();
    });

    it('returns DeletionRequest when an active pending row exists', async () => {
      const supabase = getSupabase();
      const chain = createSelectChain({
        maybeSingleResult: {
          data: {
            id: 'req-1',
            user_id: 'user-1',
            requested_at: '2026-06-10T10:00:00.000Z',
            scheduled_delete_at: '2026-07-10T10:00:00.000Z',
            cancelled_at: null,
            completed_at: null,
          },
          error: null,
        },
      });
      supabase.from.mockReturnValue(chain);

      const result = await accountDeletionService.getPendingRequest('user-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('req-1');
      expect(result!.userId).toBe('user-1');
      expect(result!.cancelledAt).toBeNull();
      expect(result!.completedAt).toBeNull();
    });

    it('queries with correct filters', async () => {
      const supabase = getSupabase();
      const chain = createSelectChain({
        maybeSingleResult: { data: null, error: null },
      });
      supabase.from.mockReturnValue(chain);

      await accountDeletionService.getPendingRequest('user-1');

      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(chain.is).toHaveBeenCalledWith('cancelled_at', null);
      expect(chain.is).toHaveBeenCalledWith('completed_at', null);
    });

    it('throws when supabase query fails', async () => {
      const supabase = getSupabase();
      const { select, eq, is, order, limit, maybeSingle } = createSelectChain();
      maybeSingle.mockResolvedValue({
        data: null,
        error: new Error('DB error'),
      });
      supabase.from.mockReturnValue({ select, eq, is, order, limit, maybeSingle });

      await expect(accountDeletionService.getPendingRequest('user-1')).rejects.toThrow();
    });

    it('orders by requested_at descending and limits to 1', async () => {
      const supabase = getSupabase();
      const chain = createSelectChain({
        maybeSingleResult: { data: null, error: null },
      });
      supabase.from.mockReturnValue(chain);

      await accountDeletionService.getPendingRequest('user-1');

      expect(chain.order).toHaveBeenCalledWith('requested_at', {
        ascending: false,
      });
      expect(chain.limit).toHaveBeenCalledWith(1);
    });
  });

  describe('authStore.pendingDeletion', () => {
    it('setPendingDeletion updates pendingDeletion in the store', () => {
      const req = {
        id: 'req-1',
        userId: 'user-1',
        requestedAt: '2026-06-10T10:00:00.000Z',
        scheduledDeleteAt: '2026-07-10T10:00:00.000Z',
        cancelledAt: null,
        completedAt: null,
      };

      useAuthStore.getState().setPendingDeletion(req);

      expect(useAuthStore.getState().pendingDeletion).toEqual(req);
    });

    it('setPendingDeletion with null clears pendingDeletion', () => {
      useAuthStore.getState().setPendingDeletion({
        id: 'req-1',
        userId: 'user-1',
        requestedAt: '2026-06-10T10:00:00.000Z',
        scheduledDeleteAt: '2026-07-10T10:00:00.000Z',
        cancelledAt: null,
        completedAt: null,
      });
      useAuthStore.getState().setPendingDeletion(null);

      expect(useAuthStore.getState().pendingDeletion).toBeNull();
    });
  });
});
