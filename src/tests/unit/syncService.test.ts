import { syncService } from '@shared/services/syncService';
import { useSyncStore } from '@shared/store/syncStore';
import { offlineQueueService } from '@shared/services/offlineQueueService';

type NetInfoListener = (state: { isConnected: boolean }) => void;

const mockAddEventListener = jest.fn();
const mockFetch = jest.fn();
let capturedListener: NetInfoListener | null = null;

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(),
    fetch: jest.fn(),
  },
}));

jest.mock('@shared/services/offlineQueueService', () => ({
  offlineQueueService: {
    flush: jest.fn(),
    count: jest.fn(),
  },
}));

const mockFlush = offlineQueueService.flush as jest.Mock;
const mockCount = offlineQueueService.count as jest.Mock;

function resetStore(): void {
  useSyncStore.setState({ status: 'synced', pendingCount: 0 });
}

function setupNetInfoMock(): void {
  capturedListener = null;
  mockAddEventListener.mockImplementation(
    (listener: NetInfoListener): { remove: () => void } => {
      capturedListener = listener;
      return { remove: jest.fn() };
    },
  );
  mockFetch.mockResolvedValue({ isConnected: true });
}

function setupNetInfo() {
  const NetInfo = require('@react-native-community/netinfo').default;
  NetInfo.addEventListener = mockAddEventListener;
  NetInfo.fetch = mockFetch;
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
  setupNetInfoMock();
  setupNetInfo();
  mockFlush.mockResolvedValue({ synced: 0, failed: 0 });
  mockCount.mockResolvedValue(0);
});

afterEach(() => {
  syncService.stop();
});

describe('syncService', () => {
  describe('start()', () => {
    it('registra um listener no NetInfo', () => {
      syncService.start('user-1');
      expect(mockAddEventListener).toHaveBeenCalledTimes(1);
    });

    it('com isConnected:true inicial, chama flush() imediatamente', async () => {
      mockFlush.mockResolvedValue({ synced: 2, failed: 0 });
      mockCount.mockResolvedValue(0);

      syncService.start('user-1');

      await new Promise(process.nextTick);

      expect(mockFlush).toHaveBeenCalledWith('user-1');
      expect(mockCount).toHaveBeenCalled();
    });

    it('com isConnected:true inicial, store.status muda para synced após flush', async () => {
      mockFlush.mockResolvedValue({ synced: 2, failed: 0 });
      mockCount.mockResolvedValue(0);

      syncService.start('user-1');

      await new Promise(process.nextTick);

      const store = useSyncStore.getState();
      expect(store.status).toBe('synced');
    });

    it('com isConnected:false inicial, store.status muda para offline', async () => {
      mockFetch.mockResolvedValue({ isConnected: false });

      syncService.start('user-1');

      await new Promise(process.nextTick);

      const store = useSyncStore.getState();
      expect(store.status).toBe('offline');
    });

    it('não registra segundo listener se start() for chamado duas vezes', () => {
      syncService.start('user-1');
      syncService.start('user-2');

      expect(mockAddEventListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('eventos de conectividade', () => {
    it('evento isConnected:false muda store.status para offline', () => {
      syncService.start('user-1');

      if (capturedListener) {
        capturedListener({ isConnected: false });
      }

      expect(useSyncStore.getState().status).toBe('offline');
    });

    it('evento isConnected:true após offline — chama flush() e muda para synced', async () => {
      mockFlush.mockResolvedValue({ synced: 1, failed: 0 });
      mockCount.mockResolvedValue(0);

      syncService.start('user-1');

      if (capturedListener) {
        capturedListener({ isConnected: false });
      }
      expect(useSyncStore.getState().status).toBe('offline');

      if (capturedListener) {
        capturedListener({ isConnected: true });
      }
      expect(useSyncStore.getState().status).toBe('syncing');

      await new Promise(process.nextTick);

      expect(mockFlush).toHaveBeenCalled();
      expect(useSyncStore.getState().status).toBe('synced');
    });

    it('flush com sucesso parcial — pendingCount atualizado com itens restantes', async () => {
      mockFlush.mockResolvedValue({ synced: 1, failed: 1 });
      mockCount.mockResolvedValue(1);

      syncService.start('user-1');

      await new Promise(process.nextTick);

      const store = useSyncStore.getState();
      expect(store.status).toBe('pending');
      expect(store.pendingCount).toBe(1);
    });

    it('flush falha — store.status fica como pending', async () => {
      mockFlush.mockRejectedValue(new Error('Network error'));

      syncService.start('user-1');

      await new Promise(process.nextTick);

      expect(useSyncStore.getState().status).toBe('pending');
    });
  });

  describe('stop()', () => {
    it('remove o listener — eventos posteriores não acionam flush', () => {
      const removeMock = jest.fn();
      mockAddEventListener.mockImplementation(() => ({ remove: removeMock }));

      syncService.start('user-1');
      syncService.stop();

      expect(removeMock).toHaveBeenCalled();

      if (capturedListener) {
        capturedListener({ isConnected: true });
      }

      expect(mockFlush).not.toHaveBeenCalled();
    });
  });

  describe('fallback de polling', () => {
    it('quando addEventListener lança exceção, registra polling com setInterval', () => {
      const setIntervalSpy = jest.spyOn(globalThis, 'setInterval');
      mockAddEventListener.mockImplementation(() => {
        throw new Error('NetInfo not available');
      });

      syncService.start('user-1');

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30_000);
      setIntervalSpy.mockRestore();
    });
  });
});
