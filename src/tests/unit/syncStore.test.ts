import { act, renderHook } from '@testing-library/react-native';
import { useSyncStore } from '@shared/store/syncStore';

beforeEach(() => {
  useSyncStore.setState({
    status: 'synced',
    pendingCount: 0,
  });
});

describe('syncStore', () => {
  it('initial state is synced with 0 pending', () => {
    const { result } = renderHook(() => useSyncStore());
    expect(result.current.status).toBe('synced');
    expect(result.current.pendingCount).toBe(0);
  });

  it('setStatus updates status to offline', () => {
    const { result } = renderHook(() => useSyncStore());
    act(() => { result.current.setStatus('offline'); });
    expect(result.current.status).toBe('offline');
  });

  it('transitions from syncing to synced correctly', () => {
    const { result } = renderHook(() => useSyncStore());
    act(() => { result.current.setStatus('syncing'); });
    expect(result.current.status).toBe('syncing');
    act(() => { result.current.setStatus('synced'); });
    expect(result.current.status).toBe('synced');
  });

  it('setPendingCount updates pendingCount to 5', () => {
    const { result } = renderHook(() => useSyncStore());
    act(() => { result.current.setPendingCount(5); });
    expect(result.current.pendingCount).toBe(5);
  });

  it('setPendingCount resets to 0 after being 5', () => {
    const { result } = renderHook(() => useSyncStore());
    act(() => { result.current.setPendingCount(5); });
    expect(result.current.pendingCount).toBe(5);
    act(() => { result.current.setPendingCount(0); });
    expect(result.current.pendingCount).toBe(0);
  });
});
