import React from 'react';
import { render } from '@testing-library/react-native';
import { SyncStatusBar } from '@shared/components/SyncStatusBar';
import { useSyncStore } from '@shared/store/syncStore';

beforeEach(() => {
  useSyncStore.setState({ status: 'synced', pendingCount: 0 });
});

describe('SyncStatusBar', () => {
  it('com status=synced — não renderiza nada', () => {
    useSyncStore.setState({ status: 'synced', pendingCount: 0 });
    const { toJSON } = render(<SyncStatusBar />);
    expect(toJSON()).toBeNull();
  });

  it('com status=offline — renderiza indicador de offline', () => {
    useSyncStore.setState({ status: 'offline', pendingCount: 0 });
    const { getByText } = render(<SyncStatusBar />);
    expect(getByText('Sem conexão')).toBeTruthy();
  });

  it('com status=pending — renderiza indicador com contagem', () => {
    useSyncStore.setState({ status: 'pending', pendingCount: 3 });
    const { getByText } = render(<SyncStatusBar />);
    expect(getByText('3 pendentes')).toBeTruthy();
  });

  it('com status=pending e 1 item — renderiza singular', () => {
    useSyncStore.setState({ status: 'pending', pendingCount: 1 });
    const { getByText } = render(<SyncStatusBar />);
    expect(getByText('1 pendente')).toBeTruthy();
  });

  it('com status=syncing — renderiza indicador com contagem', () => {
    useSyncStore.setState({ status: 'syncing', pendingCount: 2 });
    const { getByText } = render(<SyncStatusBar />);
    expect(getByText('2 pendentes')).toBeTruthy();
  });
});
