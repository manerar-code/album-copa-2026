import * as SQLite from 'expo-sqlite';
import { handleError } from './errorHandler';
import { cloudCollectionService } from './cloudCollectionService';
import { logger } from '@shared/utils/logger';
import type { StickerStatus } from '@shared/types';

export interface QueueEntry {
  id: number;
  userAlbumId: string;
  figurinhaId: string;
  status: StickerStatus;
  createdAt: number;
}

export interface OfflineQueueService {
  init(): Promise<void>;
  enqueue(entry: Omit<QueueEntry, 'id'>): Promise<void>;
  flush(userId: string): Promise<{ synced: number; failed: number }>;
  count(): Promise<number>;
  clear(): Promise<void>;
}

const DB_NAME = 'appalbum.db';

function createService(): OfflineQueueService {
  let db: SQLite.SQLiteDatabase | null = null;

  return {
    async init(): Promise<void> {
      try {
        db = await SQLite.openDatabaseAsync(DB_NAME);
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS offline_queue (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            user_album_id  TEXT    NOT NULL,
            figurinha_id   TEXT    NOT NULL,
            status         TEXT    NOT NULL CHECK(status IN ('owned', 'duplicate')),
            created_at     INTEGER NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_offline_queue_album
            ON offline_queue(user_album_id, created_at);
          CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER NOT NULL
          );
        `);
      } catch (error) {
        logger.warn('offlineQueueService.init failed — running in online-only mode', error);
        db = null;
      }
    },

    async enqueue(entry: Omit<QueueEntry, 'id'>): Promise<void> {
      if (entry.status === 'missing') return;
      if (!db) return;
      try {
        await db.runAsync(
          'INSERT INTO offline_queue (user_album_id, figurinha_id, status, created_at) VALUES (?, ?, ?, ?)',
          entry.userAlbumId,
          entry.figurinhaId,
          entry.status,
          entry.createdAt,
        );
      } catch (error) {
        throw handleError(error, 'offlineQueueService.enqueue');
      }
    },

    async flush(userId: string): Promise<{ synced: number; failed: number }> {
      if (!db) return { synced: 0, failed: 0 };
      let synced = 0;
      let failed = 0;

      try {
        interface Row {
          id: number;
          user_album_id: string;
          figurinha_id: string;
          status: string;
          created_at: number;
        }
        const rows = await db.getAllAsync<Row>(
          'SELECT * FROM offline_queue ORDER BY id ASC',
        );

        for (const row of rows) {
          try {
            await cloudCollectionService.upsertOne(
              row.user_album_id,
              row.figurinha_id,
              row.status as StickerStatus,
              userId,
            );
            await db.runAsync('DELETE FROM offline_queue WHERE id = ?', row.id);
            synced++;
          } catch {
            failed++;
            logger.warn('queue:flush:item:failed', row.figurinha_id);
          }
        }
      } catch (error) {
        throw handleError(error, 'offlineQueueService.flush');
      }

      return { synced, failed };
    },

    async count(): Promise<number> {
      if (!db) return 0;
      try {
        const row = await db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM offline_queue',
        );
        return row?.count ?? 0;
      } catch (error) {
        throw handleError(error, 'offlineQueueService.count');
      }
    },

    async clear(): Promise<void> {
      if (!db) return;
      try {
        await db.runAsync('DELETE FROM offline_queue');
      } catch (error) {
        throw handleError(error, 'offlineQueueService.clear');
      }
    },
  };
}

export const offlineQueueService: OfflineQueueService = createService();
