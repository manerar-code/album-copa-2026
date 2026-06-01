import { offlineQueueService } from '@shared/services/offlineQueueService';
import { cloudCollectionService } from '@shared/services/cloudCollectionService';
import { logger } from '@shared/utils/logger';
import type { StickerStatus } from '@shared/types';

const mockExecAsync = jest.fn();
const mockRunAsync = jest.fn();
const mockGetFirstAsync = jest.fn();
const mockGetAllAsync = jest.fn();

const mockDb = {
  execAsync: mockExecAsync,
  runAsync: mockRunAsync,
  getFirstAsync: mockGetFirstAsync,
  getAllAsync: mockGetAllAsync,
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('@shared/services/cloudCollectionService', () => ({
  cloudCollectionService: {
    upsertOne: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SQLite = require('expo-sqlite');
const mockOpenDatabaseAsync = SQLite.openDatabaseAsync as jest.Mock;
const mockUpsertOne = cloudCollectionService.upsertOne as jest.Mock;

function queueEntry(
  overrides: Partial<{ userAlbumId: string; figurinhaId: string; status: StickerStatus; createdAt: number }> = {},
) {
  return {
    userAlbumId: 'album-1',
    figurinhaId: 'fig-001',
    status: 'owned' as StickerStatus,
    createdAt: 1000,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockOpenDatabaseAsync.mockResolvedValue(mockDb);
  mockExecAsync.mockResolvedValue(undefined);
  mockRunAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
  mockGetFirstAsync.mockReset();
  mockGetAllAsync.mockReset();
  mockUpsertOne.mockResolvedValue(undefined);
});

describe('offlineQueueService', () => {
  describe('init()', () => {
    it('cria tabela offline_queue e schema_version se não existirem', async () => {
      await offlineQueueService.init();

      expect(mockOpenDatabaseAsync).toHaveBeenCalledWith('appalbum.db');
      expect(mockExecAsync).toHaveBeenCalledTimes(1);
      const sql = mockExecAsync.mock.calls[0][0] as string;
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS offline_queue');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_offline_queue_album');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS schema_version');
    });

    it('é idempotente — não falha se tabelas já existem', async () => {
      mockOpenDatabaseAsync.mockResolvedValue(mockDb);
      await offlineQueueService.init();
      await offlineQueueService.init();

      expect(mockOpenDatabaseAsync).toHaveBeenCalledTimes(2);
      expect(mockExecAsync).toHaveBeenCalledTimes(2);
    });

    it('falha de SQLite loga erro e não lança exceção', async () => {
      const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
      mockOpenDatabaseAsync.mockRejectedValue(new Error('DB error'));

      await expect(offlineQueueService.init()).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('offlineQueueService.init failed'),
        expect.any(Error),
      );

      warnSpy.mockRestore();
    });
  });

  describe('enqueue()', () => {
    it('com status=owned insere row e count() retorna 1', async () => {
      await offlineQueueService.init();
      mockGetFirstAsync.mockResolvedValue({ count: 1 });

      await offlineQueueService.enqueue(queueEntry());

      expect(mockRunAsync).toHaveBeenCalledTimes(1);
      expect(mockRunAsync).toHaveBeenCalledWith(
        'INSERT INTO offline_queue (user_album_id, figurinha_id, status, created_at) VALUES (?, ?, ?, ?)',
        'album-1',
        'fig-001',
        'owned',
        1000,
      );
      const count = await offlineQueueService.count();
      expect(count).toBe(1);
    });

    it('com status=missing não insere row', async () => {
      await offlineQueueService.init();

      await offlineQueueService.enqueue(queueEntry({ status: 'missing' }));

      expect(mockRunAsync).not.toHaveBeenCalled();
    });

    it('quando db é null (init falhou), não faz nada', async () => {
      mockOpenDatabaseAsync.mockRejectedValue(new Error('DB error'));
      await offlineQueueService.init();

      await offlineQueueService.enqueue(queueEntry());

      expect(mockRunAsync).not.toHaveBeenCalled();
    });

    it('quando runAsync falha, propaga erro', async () => {
      await offlineQueueService.init();
      mockRunAsync.mockRejectedValue(new Error('DB error'));

      await expect(offlineQueueService.enqueue(queueEntry())).rejects.toThrow();
    });
  });

  describe('flush()', () => {
    it('com 3 itens processa em ordem, chama upsertOne 3x, count() retorna 0', async () => {
      await offlineQueueService.init();
      const rows = [
        { id: 1, user_album_id: 'album-1', figurinha_id: 'fig-001', status: 'owned', created_at: 1000 },
        { id: 2, user_album_id: 'album-1', figurinha_id: 'fig-002', status: 'duplicate', created_at: 2000 },
        { id: 3, user_album_id: 'album-1', figurinha_id: 'fig-003', status: 'owned', created_at: 3000 },
      ];
      mockGetAllAsync.mockResolvedValue(rows);
      mockGetFirstAsync.mockResolvedValue({ count: 0 });

      const result = await offlineQueueService.flush('user-1');

      expect(result).toEqual({ synced: 3, failed: 0 });
      expect(mockUpsertOne).toHaveBeenCalledTimes(3);
      expect(mockUpsertOne).toHaveBeenNthCalledWith(1, 'album-1', 'fig-001', 'owned', 'user-1');
      expect(mockUpsertOne).toHaveBeenNthCalledWith(2, 'album-1', 'fig-002', 'duplicate', 'user-1');
      expect(mockUpsertOne).toHaveBeenNthCalledWith(3, 'album-1', 'fig-003', 'owned', 'user-1');
      expect(mockRunAsync).toHaveBeenCalledTimes(3);
      expect(mockRunAsync).toHaveBeenCalledWith('DELETE FROM offline_queue WHERE id = ?', 1);
      expect(mockRunAsync).toHaveBeenCalledWith('DELETE FROM offline_queue WHERE id = ?', 3);
      const count = await offlineQueueService.count();
      expect(count).toBe(0);
    });

    it('quando upsertOne falha no item 2, item 2 permanece, itens 1 e 3 deletados', async () => {
      await offlineQueueService.init();
      const rows = [
        { id: 1, user_album_id: 'album-1', figurinha_id: 'fig-001', status: 'owned', created_at: 1000 },
        { id: 2, user_album_id: 'album-1', figurinha_id: 'fig-002', status: 'duplicate', created_at: 2000 },
        { id: 3, user_album_id: 'album-1', figurinha_id: 'fig-003', status: 'owned', created_at: 3000 },
      ];
      mockGetAllAsync.mockResolvedValue(rows);
      mockUpsertOne
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);
      mockGetFirstAsync.mockResolvedValue({ count: 0 });

      const result = await offlineQueueService.flush('user-1');

      expect(result).toEqual({ synced: 2, failed: 1 });
      expect(mockUpsertOne).toHaveBeenCalledTimes(3);
      expect(mockRunAsync).toHaveBeenCalledTimes(2);
      expect(mockRunAsync).toHaveBeenCalledWith('DELETE FROM offline_queue WHERE id = ?', 1);
      expect(mockRunAsync).toHaveBeenCalledWith('DELETE FROM offline_queue WHERE id = ?', 3);
    });

    it('quando getAllAsync falha, propaga erro', async () => {
      await offlineQueueService.init();
      mockGetAllAsync.mockRejectedValue(new Error('DB error'));

      await expect(offlineQueueService.flush('user-1')).rejects.toThrow();
    });

    it('quando db é null, retorna synced:0 failed:0', async () => {
      mockOpenDatabaseAsync.mockRejectedValue(new Error('DB error'));
      await offlineQueueService.init();

      const result = await offlineQueueService.flush('user-1');
      expect(result).toEqual({ synced: 0, failed: 0 });
    });
  });

  describe('count()', () => {
    it('retorna 0 quando fila vazia', async () => {
      await offlineQueueService.init();
      mockGetFirstAsync.mockResolvedValue({ count: 0 });

      const result = await offlineQueueService.count();
      expect(result).toBe(0);
    });

    it('retorna 0 quando getFirstAsync retorna null', async () => {
      await offlineQueueService.init();
      mockGetFirstAsync.mockResolvedValue(null);

      const result = await offlineQueueService.count();
      expect(result).toBe(0);
    });

    it('quando db é null, retorna 0', async () => {
      mockOpenDatabaseAsync.mockRejectedValue(new Error('DB error'));
      await offlineQueueService.init();

      const result = await offlineQueueService.count();
      expect(result).toBe(0);
    });

    it('quando getFirstAsync falha, propaga erro', async () => {
      await offlineQueueService.init();
      mockGetFirstAsync.mockRejectedValue(new Error('DB error'));

      await expect(offlineQueueService.count()).rejects.toThrow();
    });
  });

  describe('clear()', () => {
    it('remove todos os registros', async () => {
      await offlineQueueService.init();

      await offlineQueueService.clear();

      expect(mockRunAsync).toHaveBeenCalledWith('DELETE FROM offline_queue');
    });

    it('quando db é null, não faz nada', async () => {
      mockOpenDatabaseAsync.mockRejectedValue(new Error('DB error'));
      await offlineQueueService.init();

      await offlineQueueService.clear();

      expect(mockRunAsync).not.toHaveBeenCalled();
    });

    it('quando runAsync falha, propaga erro', async () => {
      await offlineQueueService.init();
      mockRunAsync.mockRejectedValue(new Error('DB error'));

      await expect(offlineQueueService.clear()).rejects.toThrow();
    });
  });
});
