import React from 'react';
import { render, fireEvent, within } from '@testing-library/react-native';
import { TypeSettingsModal } from '@modules/auth/components/TypeSettingsModal';
import { useStickerStore } from '@modules/album/store/stickerStore';
import { useUserSettingsStore, FIXED_TYPES, displayType } from '@shared/store/userSettingsStore';

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

function buildFigurinha(type: string) {
  return {
    id: type,
    album_id: 'a1',
    selecao_id: 's1',
    numero: '1',
    nome: type,
    type,
    descricao: '',
    ordem: 1,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useStickerStore.setState({
    album: null,
    figurinhas: [],
    selecoes: [],
    collection: {},
    isLoading: false,
    isInitialized: true,
    syncUserId: null,
    userAlbums: [],
    activeUserAlbumId: null,
    allCollections: {},
  });
  useUserSettingsStore.setState({ trackedTypes: null });
});

describe('TypeSettingsModal', () => {
  it('renders without crashing when visible', () => {
    useStickerStore.setState({
      figurinhas: [buildFigurinha('Player'), buildFigurinha('Shiny')],
    });
    const { getByText } = render(<TypeSettingsModal visible={true} onClose={jest.fn()} />);
    expect(getByText('⚙️ Tipos Controlados')).toBeTruthy();
  });

  it('renders a text label for each configurable type using displayType()', () => {
    useStickerStore.setState({
      figurinhas: [buildFigurinha('Player'), buildFigurinha('Shiny')],
    });
    const { getByText } = render(<TypeSettingsModal visible={true} onClose={jest.fn()} />);
    expect(getByText(displayType('Player'))).toBeTruthy();
    expect(getByText(displayType('Shiny'))).toBeTruthy();
  });

  it('does not render FIXED_TYPES as configurable rows (they appear as locked rows instead)', () => {
    useStickerStore.setState({
      figurinhas: [
        buildFigurinha('Player'),
        buildFigurinha('Foil Player'),
        buildFigurinha('Silver'),
      ],
    });
    const { queryByTestId } = render(<TypeSettingsModal visible={true} onClose={jest.fn()} />);
    expect(queryByTestId('checkbox-Foil Player')).toBeNull();
    expect(queryByTestId('checkbox-Silver')).toBeNull();
  });

  it('excludes lowercase "foil" from configurable types (case-insensitive dedup)', () => {
    useStickerStore.setState({
      figurinhas: [buildFigurinha('Player'), buildFigurinha('foil')],
    });
    const { queryByTestId } = render(<TypeSettingsModal visible={true} onClose={jest.fn()} />);
    expect(queryByTestId('checkbox-foil')).toBeNull();
    expect(queryByTestId('checkbox-Player')).toBeTruthy();
  });

  it('excludes lowercase "silver" from configurable types (case-insensitive dedup)', () => {
    useStickerStore.setState({
      figurinhas: [buildFigurinha('Player'), buildFigurinha('silver')],
    });
    const { queryByTestId } = render(<TypeSettingsModal visible={true} onClose={jest.fn()} />);
    expect(queryByTestId('checkbox-silver')).toBeNull();
    expect(queryByTestId('checkbox-Player')).toBeTruthy();
  });

  it('shows no duplicate entries when figurinhas contain both "Foil Player" and "foil"', () => {
    useStickerStore.setState({
      figurinhas: [buildFigurinha('Foil Player'), buildFigurinha('foil'), buildFigurinha('Player')],
    });
    const { getByTestId, queryByTestId } = render(
      <TypeSettingsModal visible={true} onClose={jest.fn()} />,
    );
    expect(getByTestId('locked-Foil Player')).toBeTruthy();
    expect(queryByTestId('checkbox-foil')).toBeNull();
    expect(queryByTestId('checkbox-Foil Player')).toBeNull();
    const lockedRendered = getByTestId('locked-Foil Player');
    expect(within(lockedRendered).getByText('Brilhante')).toBeTruthy();
  });

  it('renders checked checkbox with checkmark and unchecked without checkmark', () => {
    useStickerStore.setState({
      figurinhas: [buildFigurinha('Player'), buildFigurinha('Shiny')],
    });
    useUserSettingsStore.setState({ trackedTypes: ['Player'] });
    const { getByTestId } = render(<TypeSettingsModal visible={true} onClose={jest.fn()} />);

    const playerCheckbox = within(getByTestId('checkbox-Player'));
    expect(playerCheckbox.queryByText('✓')).toBeTruthy();

    const shinyCheckbox = within(getByTestId('checkbox-Shiny'));
    expect(shinyCheckbox.queryByText('✓')).toBeNull();
  });

  it('toggles a configurable type when pressed', () => {
    useStickerStore.setState({
      figurinhas: [buildFigurinha('Player')],
    });
    useUserSettingsStore.setState({ trackedTypes: ['Player'] });
    const { getByTestId, getByText } = render(
      <TypeSettingsModal visible={true} onClose={jest.fn()} />,
    );

    const playerCheckbox = within(getByTestId('checkbox-Player'));
    expect(playerCheckbox.queryByText('✓')).toBeTruthy();

    fireEvent.press(getByText(displayType('Player')));

    expect(playerCheckbox.queryByText('✓')).toBeNull();
  });

  it('renders without crashing when configurableTypes is empty', () => {
    useStickerStore.setState({
      figurinhas: [buildFigurinha('Foil Player'), buildFigurinha('Silver')],
    });
    const { getByText } = render(<TypeSettingsModal visible={true} onClose={jest.fn()} />);
    expect(getByText('⚙️ Tipos Controlados')).toBeTruthy();
  });

  it('renders nothing when not visible', () => {
    useStickerStore.setState({
      figurinhas: [buildFigurinha('Player')],
    });
    const { queryByText } = render(<TypeSettingsModal visible={false} onClose={jest.fn()} />);
    expect(queryByText('⚙️ Tipos Controlados')).toBeNull();
  });

  it('shows checkmark for types when trackedTypes is null (defaults to all tracked)', () => {
    useStickerStore.setState({
      figurinhas: [buildFigurinha('Player')],
    });
    useUserSettingsStore.setState({ trackedTypes: null });
    const { getByTestId } = render(<TypeSettingsModal visible={true} onClose={jest.fn()} />);

    const playerCheckbox = within(getByTestId('checkbox-Player'));
    expect(playerCheckbox.queryByText('✓')).toBeTruthy();
  });

  it('unchecked checkbox has borderWidth: 1.5 applied', () => {
    useStickerStore.setState({
      figurinhas: [buildFigurinha('Player'), buildFigurinha('Shiny')],
    });
    useUserSettingsStore.setState({ trackedTypes: ['Player'] });
    const { getByTestId } = render(<TypeSettingsModal visible={true} onClose={jest.fn()} />);

    const uncheckedBox = getByTestId('checkbox-Shiny');
    expect(uncheckedBox).toHaveStyle({ borderWidth: 1.5 });

    const checkedBox = getByTestId('checkbox-Player');
    expect(checkedBox).not.toHaveStyle({ borderWidth: 1.5 });
  });

  it('calls onClose when "Fechar" button is pressed', () => {
    useStickerStore.setState({
      figurinhas: [buildFigurinha('Player')],
    });
    const onClose = jest.fn();
    const { getByText } = render(<TypeSettingsModal visible={true} onClose={onClose} />);
    fireEvent.press(getByText('Fechar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('locked FIXED_TYPES section', () => {
    it('renders locked rows for each FIXED_TYPE at the top', () => {
      useStickerStore.setState({
        figurinhas: [
          buildFigurinha('Player'),
          buildFigurinha('Foil Player'),
          buildFigurinha('Silver'),
        ],
      });
      const { getByTestId } = render(<TypeSettingsModal visible={true} onClose={jest.fn()} />);

      expect(getByTestId('locked-Foil Player')).toBeTruthy();
      expect(getByTestId('locked-Silver')).toBeTruthy();
      expect(FIXED_TYPES.length).toBe(2);
    });

    it('displays correct labels and lock icon for each locked type via displayType()', () => {
      useStickerStore.setState({
        figurinhas: [buildFigurinha('Foil Player'), buildFigurinha('Silver')],
      });
      const { getByText } = render(<TypeSettingsModal visible={true} onClose={jest.fn()} />);

      expect(getByText(displayType('Foil Player'))).toBeTruthy();
      expect(getByText(displayType('Silver'))).toBeTruthy();
    });

    it('each locked row contains a lock icon', () => {
      useStickerStore.setState({
        figurinhas: [buildFigurinha('Foil Player'), buildFigurinha('Silver')],
      });
      const { getAllByText } = render(<TypeSettingsModal visible={true} onClose={jest.fn()} />);

      expect(getAllByText('🔒').length).toBe(2);
    });

    it('locked rows do not respond to press events (no toggle)', () => {
      useStickerStore.setState({
        figurinhas: [
          buildFigurinha('Foil Player'),
          buildFigurinha('Silver'),
          buildFigurinha('Shiny'),
        ],
      });
      useUserSettingsStore.setState({ trackedTypes: ['Foil Player', 'Silver', 'Shiny'] });
      const { getByText, getByTestId } = render(
        <TypeSettingsModal visible={true} onClose={jest.fn()} />,
      );

      const shinyCheckbox = within(getByTestId('checkbox-Shiny'));
      expect(shinyCheckbox.queryByText('✓')).toBeTruthy();

      const lockedLabel = getByText(displayType('Foil Player'));
      fireEvent.press(lockedLabel);

      expect(shinyCheckbox.queryByText('✓')).toBeTruthy();
    });

    it('configurable types still render below locked section', () => {
      useStickerStore.setState({
        figurinhas: [
          buildFigurinha('Foil Player'),
          buildFigurinha('Silver'),
          buildFigurinha('Shiny'),
        ],
      });
      const { getByText } = render(<TypeSettingsModal visible={true} onClose={jest.fn()} />);

      expect(getByText(displayType('Shiny'))).toBeTruthy();
    });

    it('toggling a configurable type does not affect locked type state', () => {
      useStickerStore.setState({
        figurinhas: [
          buildFigurinha('Foil Player'),
          buildFigurinha('Silver'),
          buildFigurinha('Shiny'),
        ],
      });
      useUserSettingsStore.setState({ trackedTypes: ['Foil Player', 'Silver', 'Shiny'] });
      const { getByText, getAllByText } = render(
        <TypeSettingsModal visible={true} onClose={jest.fn()} />,
      );

      expect(getAllByText('🔒').length).toBe(2);

      const shinyLabel = getByText(displayType('Shiny'));
      fireEvent.press(shinyLabel);

      expect(getAllByText('🔒').length).toBe(2);
    });

    it('modal renders without crashing when only FIXED_TYPES exist (no configurable types)', () => {
      useStickerStore.setState({
        figurinhas: [buildFigurinha('Foil Player'), buildFigurinha('Silver')],
      });
      const { getAllByText, getByText } = render(
        <TypeSettingsModal visible={true} onClose={jest.fn()} />,
      );
      expect(getAllByText('🔒').length).toBe(2);
      expect(getByText('⚙️ Tipos Controlados')).toBeTruthy();
    });
  });
});
