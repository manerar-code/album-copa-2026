import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, TouchableOpacity } from 'react-native';
import { StickerCard } from '@modules/album/components/StickerCard';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { collectionService } from '@shared/services/collectionService';
import { cloudCollectionService } from '@shared/services/cloudCollectionService';

jest.mock('@shared/services/collectionService');
jest.mock('@shared/services/cloudCollectionService', () => ({
  cloudCollectionService: { upsertOne: jest.fn() },
}));
jest.mock('@shared/services/offlineQueueService', () => ({
  offlineQueueService: { enqueue: jest.fn() },
}));

const mockSave = collectionService.save as jest.Mock;
const mockUpsertOne = cloudCollectionService.upsertOne as jest.Mock;

const mockUserAlbums = [
  { id: 'album-active', name: 'Meu Álbum', user_id: 'u1', created_at: '' },
  { id: 'album-a', name: 'Álbum A', user_id: 'u1', created_at: '' },
  { id: 'album-b', name: 'Álbum B', user_id: 'u1', created_at: '' },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockSave.mockResolvedValue(undefined);
  mockUpsertOne.mockResolvedValue(undefined);
  useStickerStore.setState({
    collection: {},
    allCollections: {},
    figurinhas: [],
    selecoes: [],
    album: null,
    activeUserAlbumId: 'album-active',
    syncUserId: 'user-1',
    userAlbums: mockUserAlbums,
  });
});

describe('StickerCard highlight rendering', () => {
  it('applies red border when cross-album duplicate exists and sticker is missing', () => {
    useStickerStore.setState({
      collection: { 'fig-001': 'missing' },
      allCollections: {
        'album-active': { 'fig-001': 'missing' },
        'album-a': { 'fig-001': 'duplicate' },
      },
    });
    const { getByTestId } = render(<StickerCard figurinhaId="fig-001" numero="001" />);
    expect(getByTestId('cross-album-highlight')).toBeTruthy();
  });

  it('does NOT apply red border when selector returns empty array', () => {
    useStickerStore.setState({
      collection: { 'fig-001': 'missing' },
      allCollections: {
        'album-active': { 'fig-001': 'missing' },
        'album-a': { 'fig-001': 'owned' },
      },
    });
    const { queryByTestId } = render(<StickerCard figurinhaId="fig-001" numero="001" />);
    expect(queryByTestId('cross-album-highlight')).toBeNull();
  });

  it('does NOT apply red border when sticker is owned in active album', () => {
    useStickerStore.setState({
      collection: { 'fig-001': 'owned' },
      allCollections: {
        'album-active': { 'fig-001': 'owned' },
        'album-a': { 'fig-001': 'duplicate' },
      },
    });
    const { queryByTestId } = render(<StickerCard figurinhaId="fig-001" numero="001" />);
    expect(queryByTestId('cross-album-highlight')).toBeNull();
  });

  it('does NOT apply red border when sticker is duplicate in active album', () => {
    useStickerStore.setState({
      collection: { 'fig-001': 'duplicate' },
      allCollections: {
        'album-active': { 'fig-001': 'duplicate' },
        'album-a': { 'fig-001': 'duplicate' },
      },
    });
    const { queryByTestId } = render(<StickerCard figurinhaId="fig-001" numero="001" />);
    expect(queryByTestId('cross-album-highlight')).toBeNull();
  });
});

describe('StickerCard tap and Alert flow', () => {
  beforeEach(() => {
    useStickerStore.setState({
      collection: { 'fig-001': 'missing' },
      allCollections: {
        'album-active': { 'fig-001': 'missing' },
        'album-a': { 'fig-001': 'duplicate' },
      },
    });
  });

  it('tapping highlighted sticker sets active album status to owned', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { UNSAFE_getByType } = render(<StickerCard figurinhaId="fig-001" numero="001" />);
    const touchable = UNSAFE_getByType(TouchableOpacity);

    fireEvent.press(touchable);

    await waitFor(() => {
      expect(useStickerStore.getState().collection['fig-001']).toBe('owned');
    });
    alertSpy.mockRestore();
  });

  it('tapping highlighted sticker shows Alert with album name', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { UNSAFE_getByType } = render(<StickerCard figurinhaId="fig-001" numero="001" />);
    const touchable = UNSAFE_getByType(TouchableOpacity);

    fireEvent.press(touchable);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Atualizar coleção',
        expect.stringContaining('Álbum A'),
        expect.any(Array),
      );
    });
    alertSpy.mockRestore();
  });

  it('confirming Alert sets source album sticker from duplicate to owned', async () => {
    let alertButtons: { text: string; onPress?: () => void }[] = [];
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      alertButtons = buttons as typeof alertButtons;
    });
    const { UNSAFE_getByType } = render(<StickerCard figurinhaId="fig-001" numero="001" />);
    const touchable = UNSAFE_getByType(TouchableOpacity);

    fireEvent.press(touchable);

    await waitFor(() => {
      expect(alertButtons.length).toBeGreaterThan(0);
    });

    const simButton = alertButtons.find(b => b.text === 'Sim');
    expect(simButton).toBeDefined();
    await simButton!.onPress!();

    expect(useStickerStore.getState().allCollections['album-a']['fig-001']).toBe('owned');
    alertSpy.mockRestore();
  });

  it('cancelling Alert leaves source album sticker as duplicate', async () => {
    let alertButtons: { text: string; style?: string; onPress?: () => void }[] = [];
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      alertButtons = buttons as typeof alertButtons;
    });
    const { UNSAFE_getByType } = render(<StickerCard figurinhaId="fig-001" numero="001" />);
    const touchable = UNSAFE_getByType(TouchableOpacity);

    fireEvent.press(touchable);

    await waitFor(() => {
      expect(alertButtons.length).toBeGreaterThan(0);
    });

    const naoButton = alertButtons.find(b => b.text === 'Não');
    expect(naoButton).toBeDefined();
    if (naoButton?.onPress) {
      await naoButton.onPress();
    }

    expect(useStickerStore.getState().allCollections['album-a']['fig-001']).toBe('duplicate');
    alertSpy.mockRestore();
  });

  it('tapping non-highlighted sticker calls toggleSticker instead', async () => {
    useStickerStore.setState({
      collection: { 'fig-002': 'missing' },
      allCollections: {
        'album-active': { 'fig-002': 'missing' },
        'album-a': { 'fig-002': 'owned' },
      },
    });
    const { UNSAFE_getByType } = render(<StickerCard figurinhaId="fig-002" numero="002" />);
    const touchable = UNSAFE_getByType(TouchableOpacity);

    fireEvent.press(touchable);

    await waitFor(() => {
      expect(useStickerStore.getState().collection['fig-002']).toBe('owned');
    });
  });
});
