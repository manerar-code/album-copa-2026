import { act, renderHook } from '@testing-library/react-native';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { collectionService } from '@shared/services/collectionService';

jest.mock('@shared/services/collectionService');
const mockSave = collectionService.save as jest.Mock;
const mockLoad = collectionService.load as jest.Mock;
const mockReset = collectionService.reset as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockLoad.mockResolvedValue({});
  mockSave.mockResolvedValue(undefined);
  mockReset.mockResolvedValue(undefined);
  // Reset store state
  useStickerStore.setState({
    collection: {},
    figurinhas: [],
    selecoes: [],
    album: null,
  });
});

describe('stickerStore', () => {
  it('initial status of any sticker is missing', () => {
    const { result } = renderHook(() => useStickerStore());
    expect(result.current.getStatus('any-id')).toBe('missing');
  });

  it('toggleSticker cycles missing → owned → duplicate → missing', async () => {
    const { result } = renderHook(() => useStickerStore());
    const id = 'sticker-001';

    await act(async () => { await result.current.toggleSticker(id); });
    expect(result.current.getStatus(id)).toBe('owned');

    await act(async () => { await result.current.toggleSticker(id); });
    expect(result.current.getStatus(id)).toBe('duplicate');

    await act(async () => { await result.current.toggleSticker(id); });
    expect(result.current.getStatus(id)).toBe('missing');
  });

  it('persists to storage on every toggle', async () => {
    const { result } = renderHook(() => useStickerStore());
    await act(async () => { await result.current.toggleSticker('001'); });
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith({ '001': 'owned' });
  });

  it('loadCollection reads from storage', async () => {
    mockLoad.mockResolvedValue({ '002': 'owned', '003': 'duplicate' });
    const { result } = renderHook(() => useStickerStore());
    await act(async () => { await result.current.loadCollection(); });
    expect(result.current.getStatus('002')).toBe('owned');
    expect(result.current.getStatus('003')).toBe('duplicate');
  });

  it('getStats returns correct counts', () => {
    useStickerStore.setState({
      figurinhas: [
        { id: '1', album_id: 'a', selecao_id: 's', numero: '001', descricao: '', ordem: 1 },
        { id: '2', album_id: 'a', selecao_id: 's', numero: '002', descricao: '', ordem: 2 },
        { id: '3', album_id: 'a', selecao_id: 's', numero: '003', descricao: '', ordem: 3 },
      ],
      collection: { '1': 'owned', '2': 'duplicate' },
    });
    const { result } = renderHook(() => useStickerStore());
    const stats = result.current.getStats();
    expect(stats.total).toBe(3);
    expect(stats.owned).toBe(1);
    expect(stats.duplicate).toBe(1);
    expect(stats.missing).toBe(1);
  });

  it('resetCollection clears collection and storage', async () => {
    useStickerStore.setState({ collection: { '1': 'owned' } });
    const { result } = renderHook(() => useStickerStore());
    await act(async () => { await result.current.resetCollection(); });
    expect(result.current.collection).toEqual({});
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
