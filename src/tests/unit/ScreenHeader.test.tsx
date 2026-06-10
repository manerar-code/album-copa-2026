import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ScreenHeader } from '@shared/components/ScreenHeader';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: React.PropsWithChildren<object>) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('@modules/album/store/stickerStore', () => ({
  useStickerStore: jest.fn(),
}));

jest.mock('@modules/auth/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

import { useStickerStore } from '@modules/album/store/stickerStore';
import { useAuthStore } from '@modules/auth/store/authStore';

const BASE_STICKER_STORE = {
  userAlbums: [{ id: 'album-1', name: 'My Album' }],
  activeUserAlbumId: 'album-1',
};

const BASE_AUTH_STORE = {
  setShowAlbumsModal: jest.fn(),
};

function setupMocks(stickerOverrides: Partial<typeof BASE_STICKER_STORE> = {}) {
  (useStickerStore as unknown as jest.Mock).mockReturnValue({
    ...BASE_STICKER_STORE,
    ...stickerOverrides,
  });
  (useAuthStore as unknown as jest.Mock).mockReturnValue(BASE_AUTH_STORE);
}

beforeEach(() => {
  jest.clearAllMocks();
  setupMocks();
});

describe('ScreenHeader - albumChip styles', () => {
  it('albumChip style has maxWidth <= 140', () => {
    const { getByTestId } = render(<ScreenHeader title="Test" />);
    const chip = getByTestId('album-chip');
    expect(chip).toHaveStyle({ maxWidth: 140 });
  });

  it('row2 container has marginRight >= 48', () => {
    const { getByTestId } = render(<ScreenHeader title="Test" />);
    const row2 = getByTestId('screen-header-row2');
    expect(row2).toHaveStyle({ marginRight: 48 });
  });

  it('album chip is tappable and calls setShowAlbumsModal', () => {
    const setShowAlbumsModal = jest.fn();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ setShowAlbumsModal });

    const { getByTestId } = render(<ScreenHeader title="Test" />);
    const chip = getByTestId('album-chip');
    fireEvent.press(chip);
    expect(setShowAlbumsModal).toHaveBeenCalledTimes(1);
    expect(setShowAlbumsModal).toHaveBeenCalledWith(true);
  });

  it('does not render album chip when no active album', () => {
    setupMocks({ activeUserAlbumId: null, userAlbums: [] });
    const { queryByTestId } = render(<ScreenHeader title="Test" />);
    expect(queryByTestId('album-chip')).toBeNull();
  });
});

describe('ScreenHeader - layout at 375px width', () => {
  it('renders album chip without overlap', () => {
    const { getByTestId, getByText } = render(<ScreenHeader title="Test" subtitle="Subtitle" />);
    const chip = getByTestId('album-chip');
    const row2 = getByTestId('screen-header-row2');
    expect(chip).toBeDefined();
    expect(row2).toBeDefined();
    expect(getByText(/Subtitle/)).toBeDefined();
  });
});
