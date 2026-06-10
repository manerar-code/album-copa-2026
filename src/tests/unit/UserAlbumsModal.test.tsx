import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { UserAlbumsModal } from '@modules/auth/components/UserAlbumsModal';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { userAlbumService } from '@shared/services/userAlbumService';
import { Alert } from 'react-native';

jest.mock('@shared/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  },
}));

jest.mock('@shared/services/collectionService', () => ({
  collectionService: {
    load: jest.fn().mockResolvedValue({}),
    save: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@shared/services/cloudCollectionService', () => ({
  cloudCollectionService: {
    load: jest.fn().mockResolvedValue({}),
    upsertOne: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@shared/services/offlineQueueService', () => ({
  offlineQueueService: {
    init: jest.fn().mockResolvedValue(undefined),
    enqueue: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@shared/services/userAlbumService', () => ({
  userAlbumService: {
    create: jest.fn().mockResolvedValue({ id: 'new-1', name: 'New', user_id: 'u1' }),
    rename: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockAlbum = { id: 'a1', name: 'Minha Coleção', user_id: 'u1', created_at: '2024-01-01' };

beforeEach(() => {
  jest.clearAllMocks();
  useStickerStore.setState({
    album: null,
    figurinhas: [],
    selecoes: [],
    collection: {},
    isLoading: false,
    isInitialized: true,
    syncUserId: 'u1',
    userAlbums: [mockAlbum],
    activeUserAlbumId: 'a1',
    allCollections: { a1: {} },
  });
});

describe('UserAlbumsModal', () => {
  it('renders without crashing when visible', () => {
    const { getByText } = render(
      <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
    );
    expect(getByText('Minhas Coleções')).toBeTruthy();
    expect(getByText('Minha Coleção')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <UserAlbumsModal visible={false} onClose={jest.fn()} userId="u1" />,
    );
    expect(queryByText('Minhas Coleções')).toBeNull();
  });

  it('shows rename TextInput with correct color style when edit button is pressed', () => {
    const { getByText, getByTestId } = render(
      <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
    );

    fireEvent.press(getByText('✏️'));

    const input = getByTestId('rename-input');
    expect(input).toBeTruthy();
    expect(input).toHaveStyle({ color: '#0C1322' });
  });

  it('rename TextInput has placeholderTextColor prop set', () => {
    const { getByText, getByTestId } = render(
      <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
    );

    fireEvent.press(getByText('✏️'));

    const input = getByTestId('rename-input');
    expect(input.props.placeholderTextColor).toBe('#646F88');
  });

  it('rename TextInput shows placeholder text', () => {
    const { getByText, getByTestId } = render(
      <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
    );

    fireEvent.press(getByText('✏️'));

    const input = getByTestId('rename-input');
    expect(input.props.placeholder).toBe('Nome da coleção');
  });

  it('new collection TextInput has color style and placeholderTextColor', () => {
    const { getByPlaceholderText } = render(
      <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
    );

    const newInput = getByPlaceholderText('Nome da nova coleção...');
    expect(newInput).toBeTruthy();
    expect(newInput).toHaveStyle({ color: '#0C1322' });
    expect(newInput.props.placeholderTextColor).toBe('#646F88');
  });

  it('calls onClose when overlay is pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <UserAlbumsModal visible={true} onClose={onClose} userId="u1" />,
    );

    fireEvent.press(getByTestId('albums-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('album name fallback (BUG-01)', () => {
    it('renders "Coleção sem nome" when album name is empty string', () => {
      useStickerStore.setState({
        userAlbums: [{ id: 'a1', name: '', user_id: 'u1', created_at: '2024-01-01' }],
        activeUserAlbumId: 'a1',
        allCollections: { a1: {} },
      });

      const { getByText } = render(
        <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
      );
      expect(getByText('Coleção sem nome')).toBeTruthy();
    });

    it('renders "Coleção sem nome" when album name is null', () => {
      useStickerStore.setState({
        userAlbums: [
          { id: 'a1', name: null as unknown as string, user_id: 'u1', created_at: '2024-01-01' },
        ],
        activeUserAlbumId: 'a1',
        allCollections: { a1: {} },
      });

      const { getByText } = render(
        <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
      );
      expect(getByText('Coleção sem nome')).toBeTruthy();
    });

    it('renders the actual album name when present', () => {
      useStickerStore.setState({
        userAlbums: [{ id: 'a1', name: 'Copa 2026', user_id: 'u1', created_at: '2024-01-01' }],
        activeUserAlbumId: 'a1',
        allCollections: { a1: {} },
      });

      const { getByText } = render(
        <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
      );
      expect(getByText('Copa 2026')).toBeTruthy();
      expect(() => getByText('Coleção sem nome')).toThrow();
    });

    it('renders both named and unnamed albums in list', () => {
      useStickerStore.setState({
        userAlbums: [
          { id: 'a1', name: 'Copa 2026', user_id: 'u1', created_at: '2024-01-01' },
          { id: 'a2', name: '', user_id: 'u1', created_at: '2024-02-01' },
        ],
        activeUserAlbumId: 'a1',
        allCollections: { a1: {}, a2: {} },
      });

      const { getByText } = render(
        <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
      );
      expect(getByText('Copa 2026')).toBeTruthy();
      expect(getByText('Coleção sem nome')).toBeTruthy();
    });

    it('rename edit pre-fill still uses original empty name, not fallback', () => {
      useStickerStore.setState({
        userAlbums: [{ id: 'a1', name: '', user_id: 'u1', created_at: '2024-01-01' }],
        activeUserAlbumId: 'a1',
        allCollections: { a1: {} },
      });

      const { getByText, getByTestId } = render(
        <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
      );

      fireEvent.press(getByText('✏️'));

      const input = getByTestId('rename-input');
      expect(input.props.value).toBe('');
    });
  });

  describe('album name pre-fill on edit (BUG-05)', () => {
    const secondAlbum = { id: 'a2', name: 'Copa 2026', user_id: 'u1', created_at: '2024-02-01' };

    beforeEach(() => {
      useStickerStore.setState({
        userAlbums: [mockAlbum, secondAlbum],
        activeUserAlbumId: 'a1',
        allCollections: { a1: {}, a2: {} },
      });
    });

    it('pre-fills editingName with album name when edit icon is tapped', () => {
      const { getAllByText, getByTestId } = render(
        <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
      );

      fireEvent.press(getAllByText('✏️')[0]);

      const input = getByTestId('rename-input');
      expect(input.props.value).toBe('Minha Coleção');
    });

    it('TextInput value is empty for albums not in edit mode', () => {
      const { getAllByText, queryAllByTestId } = render(
        <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
      );

      fireEvent.press(getAllByText('✏️')[0]);

      const renameInputs = queryAllByTestId('rename-input');
      expect(renameInputs.length).toBe(1);
      expect(renameInputs[0].props.value).toBe('Minha Coleção');
    });

    it('editingName is reset when cancel is pressed after edit', () => {
      const { getAllByText, getByText, getByTestId, queryByTestId } = render(
        <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
      );

      fireEvent.press(getAllByText('✏️')[0]);

      let input = getByTestId('rename-input');
      expect(input.props.value).toBe('Minha Coleção');

      fireEvent.press(getByText('✕'));

      expect(queryByTestId('rename-input')).toBeNull();
    });

    it('re-opening edit mode after cancel re-pre-fills album name', () => {
      const { getAllByText, getByText, getByTestId } = render(
        <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
      );

      fireEvent.press(getAllByText('✏️')[0]);

      let input = getByTestId('rename-input');
      expect(input.props.value).toBe('Minha Coleção');

      fireEvent.press(getByText('✕'));

      fireEvent.press(getAllByText('✏️')[0]);

      input = getByTestId('rename-input');
      expect(input.props.value).toBe('Minha Coleção');
    });

    it('editing one album does not contaminate other albums', () => {
      const { getAllByText, queryAllByTestId } = render(
        <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
      );

      expect(queryAllByTestId('rename-input').length).toBe(0);

      fireEvent.press(getAllByText('✏️')[0]);

      const renameInputs = queryAllByTestId('rename-input');
      expect(renameInputs.length).toBe(1);
    });
  });

  describe('album delete (BUG-04)', () => {
    const secondAlbum = {
      id: 'a2',
      name: 'Segunda Coleção',
      user_id: 'u1',
      created_at: '2024-02-01',
    };

    let alertCalls: {
      title: string;
      message?: string;
      buttons?: { text: string; style?: string; onPress?: () => void }[];
    }[];

    beforeEach(() => {
      alertCalls = [];
      jest
        .spyOn(Alert, 'alert')
        .mockImplementation(
          (
            title: string,
            message?: string,
            buttons?: Array<{ text: string; style?: string; onPress?: () => void }>,
          ) => {
            alertCalls.push({ title, message, buttons });
          },
        );

      useStickerStore.setState({
        userAlbums: [mockAlbum, secondAlbum],
        activeUserAlbumId: 'a1',
        allCollections: { a1: {}, a2: {} },
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    function getDestructiveOnPress(): (() => Promise<void>) | null {
      const call = alertCalls.find(c => c.title === 'Excluir coleção');
      if (!call?.buttons) return null;
      const btn = call.buttons.find(b => b.style === 'destructive');
      return (btn?.onPress as (() => Promise<void>) | undefined) ?? null;
    }

    it('renders delete buttons when there are 2+ albums', () => {
      const { getAllByText } = render(
        <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
      );

      expect(getAllByText('🗑️').length).toBeGreaterThanOrEqual(1);
    });

    it('calls Alert.alert with "Excluir coleção" and cancel/destructive buttons', () => {
      const { getAllByText } = render(
        <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
      );

      fireEvent.press(getAllByText('🗑️')[0]);

      const deleteAlert = alertCalls.find(c => c.title === 'Excluir coleção');
      expect(deleteAlert).toBeDefined();
      expect(deleteAlert!.buttons).toBeDefined();

      const cancelBtn = deleteAlert!.buttons!.find(b => b.style === 'cancel');
      expect(cancelBtn).toBeDefined();
      expect(cancelBtn!.text).toBe('Cancelar');

      const destructiveBtn = deleteAlert!.buttons!.find(b => b.style === 'destructive');
      expect(destructiveBtn).toBeDefined();
      expect(destructiveBtn!.text).toBe('Excluir');
    });

    it('confirming delete calls userAlbumService.remove', async () => {
      const { getAllByText } = render(
        <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
      );

      fireEvent.press(getAllByText('🗑️')[0]);

      const onPress = getDestructiveOnPress();
      expect(onPress).not.toBeNull();

      await onPress!();

      expect(userAlbumService.remove).toHaveBeenCalledWith('a1');
    });

    it('deleting a non-active album removes it without switching active album', async () => {
      const { getAllByText } = render(
        <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
      );

      fireEvent.press(getAllByText('🗑️')[1]);

      const onPress = getDestructiveOnPress();
      await onPress!();

      const state = useStickerStore.getState();
      expect(state.userAlbums).toEqual([mockAlbum]);
      expect(state.activeUserAlbumId).toBe('a1');
    });

    it('deleting the active album switches to remaining[0]', async () => {
      const { getAllByText } = render(
        <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
      );

      fireEvent.press(getAllByText('🗑️')[0]);

      const onPress = getDestructiveOnPress();
      await onPress!();

      const state = useStickerStore.getState();
      expect(state.userAlbums).toEqual([secondAlbum]);
      expect(state.activeUserAlbumId).toBe('a2');
    });

    it('shows error Alert when userAlbumService.remove throws', async () => {
      (userAlbumService.remove as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { getAllByText } = render(
        <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
      );

      fireEvent.press(getAllByText('🗑️')[0]);

      const onPress = getDestructiveOnPress();
      await onPress!();

      await waitFor(() => {
        const errorAlert = alertCalls.find(c => c.title === 'Erro');
        expect(errorAlert).toBeDefined();
        expect(errorAlert!.message).toBe('Network error');
      });
    });

    it('shows generic error when remove throws non-Error type', async () => {
      (userAlbumService.remove as jest.Mock).mockRejectedValueOnce('string error');

      const { getAllByText } = render(
        <UserAlbumsModal visible={true} onClose={jest.fn()} userId="u1" />,
      );

      fireEvent.press(getAllByText('🗑️')[0]);

      const onPress = getDestructiveOnPress();
      await onPress!();

      await waitFor(() => {
        const errorAlert = alertCalls.find(c => c.title === 'Erro');
        expect(errorAlert).toBeDefined();
        expect(errorAlert!.message).toBe('Não foi possível excluir a coleção.');
      });
    });
  });
});
