import { act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserSettingsStore, displayType, FIXED_TYPES } from '@shared/store/userSettingsStore';

jest.mock('@react-native-async-storage/async-storage');

describe('displayType', () => {
  it('returns "Brilhante" for "Foil Player"', () => {
    expect(displayType('Foil Player')).toBe('Brilhante');
  });

  it('passes through "Silver" unchanged', () => {
    expect(displayType('Silver')).toBe('Silver');
  });

  it('passes through "Player" unchanged', () => {
    expect(displayType('Player')).toBe('Player');
  });

  it('returns "Brilhante" for lowercase "foil"', () => {
    expect(displayType('foil')).toBe('Brilhante');
  });

  it('returns "Silver" for lowercase "silver"', () => {
    expect(displayType('silver')).toBe('Silver');
  });

  it('returns "Player" for lowercase "player"', () => {
    expect(displayType('player')).toBe('Player');
  });

  it('passes through unmapped types unchanged', () => {
    expect(displayType('McDonald')).toBe('McDonald');
  });

  it('returns empty string for empty input without throwing', () => {
    expect(displayType('')).toBe('');
  });
});

describe('loadSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUserSettingsStore.setState({ trackedTypes: null });
  });

  it('returns trackedTypes that includes all FIXED_TYPES when AsyncStorage is empty', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const allTypes = ['Player', 'Shiny'];
    await act(async () => {
      await useUserSettingsStore.getState().loadSettings(allTypes);
    });

    const { trackedTypes } = useUserSettingsStore.getState();
    expect(trackedTypes).toEqual(expect.arrayContaining(FIXED_TYPES));
    expect(trackedTypes).toEqual(expect.arrayContaining(allTypes));
  });

  it('always merges FIXED_TYPES into result when saved types exist', async () => {
    const saved = JSON.stringify({ trackedTypes: ['Player', 'Shiny'] });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(saved);

    const allTypes = ['Player', 'Shiny'];
    await act(async () => {
      await useUserSettingsStore.getState().loadSettings(allTypes);
    });

    const { trackedTypes } = useUserSettingsStore.getState();
    expect(trackedTypes).toEqual(expect.arrayContaining(FIXED_TYPES));
    expect(trackedTypes).toEqual(expect.arrayContaining(['Player', 'Shiny']));
  });

  it('includes FIXED_TYPES even when saved types do not include them', async () => {
    const saved = JSON.stringify({ trackedTypes: ['Shiny'] });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(saved);

    await act(async () => {
      await useUserSettingsStore.getState().loadSettings(['Shiny']);
    });

    const { trackedTypes } = useUserSettingsStore.getState();
    expect(trackedTypes).toEqual(expect.arrayContaining(FIXED_TYPES));
    expect(trackedTypes).toContain('Shiny');
  });

  it('includes FIXED_TYPES when AsyncStorage throws an error', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('storage error'));

    const allTypes = ['Player'];
    await act(async () => {
      await useUserSettingsStore.getState().loadSettings(allTypes);
    });

    const { trackedTypes } = useUserSettingsStore.getState();
    expect(trackedTypes).toEqual(expect.arrayContaining(FIXED_TYPES));
    expect(trackedTypes).toContain('Player');
  });

  it('deduplicates FIXED_TYPES when saved types already contain them', async () => {
    const saved = JSON.stringify({ trackedTypes: [...FIXED_TYPES, 'Player'] });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(saved);

    await act(async () => {
      await useUserSettingsStore.getState().loadSettings(['Player']);
    });

    const { trackedTypes } = useUserSettingsStore.getState();
    expect(trackedTypes?.length).toBe(FIXED_TYPES.length + 1);
    expect(trackedTypes).toEqual(expect.arrayContaining([...FIXED_TYPES, 'Player']));
  });
});
