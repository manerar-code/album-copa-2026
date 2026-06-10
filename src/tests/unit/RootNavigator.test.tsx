import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { KeyboardAvoidingView } from 'react-native';
import { RootNavigator, tabIcons } from '@core/navigation/RootNavigator';

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Screen: () => null,
  }),
}));

jest.mock('@core/navigation/AlbumStack', () => ({
  AlbumStack: () => null,
}));

jest.mock('@modules/dashboard/screens/HomeScreen', () => ({
  HomeScreen: () => null,
}));

jest.mock('@modules/missing/screens/MissingScreen', () => ({
  MissingScreen: () => null,
}));

jest.mock('@modules/duplicates/screens/DuplicatesScreen', () => ({
  DuplicatesScreen: () => null,
}));

jest.mock('@modules/dashboard/screens/StatsScreen', () => ({
  StatsScreen: () => null,
}));

jest.mock('@modules/auth/screens/LoginScreen', () => ({
  LoginScreen: () => null,
}));

jest.mock('@modules/auth/components/UserAlbumsModal', () => ({
  UserAlbumsModal: () => null,
}));

jest.mock('@modules/auth/components/TypeSettingsModal', () => ({
  TypeSettingsModal: () => null,
}));

jest.mock('@modules/onboarding/components/OnboardingModal', () => ({
  OnboardingModal: () => null,
}));

jest.mock('@modules/auth/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@core/providers/OnboardingContext', () => {
  const React = require('react');
  const ctx = React.createContext({
    showOnboarding: false,
    completeOnboarding: jest.fn(),
  });
  return { OnboardingContext: ctx };
});

jest.mock('@shared/services/supabase', () => ({
  supabase: {
    auth: {
      updateUser: jest.fn().mockResolvedValue({ error: null }),
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

jest.mock('@modules/album/store/stickerStore', () => ({
  useStickerStore: Object.assign(jest.fn(), { setState: jest.fn(), getState: jest.fn() }),
}));

jest.mock('@modules/auth/services/authService', () => ({
  authService: {
    signOut: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockUser = {
  id: 'u1',
  email: 'test@test.com',
  name: 'Test User',
  avatar_url: null,
};

let mockUseAuthStore: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  const { supabase } = require('@shared/services/supabase');
  supabase.auth.updateUser.mockResolvedValue({ error: null });
  mockUseAuthStore = require('@modules/auth/store/authStore').useAuthStore;
  mockUseAuthStore.mockReturnValue({
    user: mockUser,
    setUser: jest.fn(),
    showAlbumsModal: false,
    setShowAlbumsModal: jest.fn(),
  });
});

describe('RootNavigator', () => {
  it('renders without crashing when user is logged in', () => {
    const { getByText } = render(<RootNavigator />);
    expect(getByText('T')).toBeTruthy();
  });

  it('renders modal and shows nickname TextInput with correct color style', () => {
    const { getByText, getByTestId, queryByTestId } = render(<RootNavigator />);

    expect(queryByTestId('nickname-input')).toBeNull();

    fireEvent.press(getByText('T'));
    fireEvent.press(getByText('✏️'));

    const input = getByTestId('nickname-input');
    expect(input).toBeTruthy();
    expect(input).toHaveStyle({ color: '#0C1322' });
  });

  it('nickname TextInput has placeholderTextColor prop set', () => {
    const { getByText, getByTestId } = render(<RootNavigator />);

    fireEvent.press(getByText('T'));
    fireEvent.press(getByText('✏️'));

    const input = getByTestId('nickname-input');
    expect(input.props.placeholderTextColor).toBe('#646F88');
  });

  it('nickname TextInput shows correct placeholder text', () => {
    const { getByText, getByTestId } = render(<RootNavigator />);

    fireEvent.press(getByText('T'));
    fireEvent.press(getByText('✏️'));

    const input = getByTestId('nickname-input');
    expect(input.props.placeholder).toBe('Seu apelido');
  });

  describe('task_07 - save button visibility and functionality', () => {
    it('renders KeyboardAvoidingView as modal wrapper with correct behavior', () => {
      const { getByText, UNSAFE_getByType } = render(<RootNavigator />);
      fireEvent.press(getByText('T'));

      const kv = UNSAFE_getByType(KeyboardAvoidingView);
      expect(kv).toBeTruthy();
      expect(kv.props.behavior).toBe('padding');
    });

    it('save button triggers handleSaveNickname on press', () => {
      const { getByText, getByTestId } = render(<RootNavigator />);

      fireEvent.press(getByText('T'));
      fireEvent.press(getByText('✏️'));

      fireEvent.press(getByTestId('save-button'));

      const { supabase } = require('@shared/services/supabase');
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: { full_name: 'Test User' },
      });
    });

    it('save button press is ignored while saving (disabled)', async () => {
      let resolvePromise: (value: unknown) => void;
      const { supabase } = require('@shared/services/supabase');
      supabase.auth.updateUser.mockImplementation(
        () =>
          new Promise(resolve => {
            resolvePromise = resolve;
          }),
      );

      const { getByText, getByTestId } = render(<RootNavigator />);

      fireEvent.press(getByText('T'));
      fireEvent.press(getByText('✏️'));

      fireEvent.press(getByTestId('save-button'));
      fireEvent.press(getByTestId('save-button'));

      expect(supabase.auth.updateUser).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolvePromise({ error: null });
      });
    });

    it('shows ActivityIndicator while saving and hides button text', async () => {
      let resolvePromise: (value: unknown) => void;
      const { supabase } = require('@shared/services/supabase');
      supabase.auth.updateUser.mockImplementation(
        () =>
          new Promise(resolve => {
            resolvePromise = resolve;
          }),
      );

      const { getByText, queryByText, getByTestId } = render(<RootNavigator />);

      fireEvent.press(getByText('T'));
      fireEvent.press(getByText('✏️'));

      expect(getByText('Salvar')).toBeTruthy();

      fireEvent.press(getByTestId('save-button'));

      expect(queryByText('Salvar')).toBeNull();

      await act(async () => {
        resolvePromise({ error: null });
      });
    });

    it('save button works again after save completes', async () => {
      let resolvePromise: (value: unknown) => void;
      const { supabase } = require('@shared/services/supabase');
      supabase.auth.updateUser.mockImplementation(
        () =>
          new Promise(resolve => {
            resolvePromise = resolve;
          }),
      );

      const { getByText, getByTestId } = render(<RootNavigator />);

      fireEvent.press(getByText('T'));
      fireEvent.press(getByText('✏️'));

      fireEvent.press(getByTestId('save-button'));

      await act(async () => {
        resolvePromise({ error: null });
      });

      // After save completes, editing exits — re-enter editing mode
      fireEvent.press(getByText('✏️'));

      supabase.auth.updateUser.mockClear();
      fireEvent.press(getByTestId('save-button'));

      expect(supabase.auth.updateUser).toHaveBeenCalledTimes(1);
    });

    it('editRow has flexShrink style to prevent overflow', () => {
      const { getByText, getByTestId } = render(<RootNavigator />);

      fireEvent.press(getByText('T'));
      fireEvent.press(getByText('✏️'));

      const editRow = getByTestId('edit-row');
      expect(editRow).toHaveStyle({ flexShrink: 1 });
    });

    it('save button is accessible when rendered at 375px width', () => {
      const { getByText, getByTestId } = render(<RootNavigator />);

      fireEvent.press(getByText('T'));
      fireEvent.press(getByText('✏️'));

      const saveButton = getByTestId('save-button');
      const editRow = getByTestId('edit-row');

      expect(saveButton).toBeTruthy();
      expect(editRow).toHaveStyle({ width: '100%' });
    });
  });

  describe('tabIcons', () => {
    it('Missing tab uses magnifying glass', () => {
      expect(tabIcons['Missing']).toBe('🔍');
    });

    it('Home tab uses house emoji (unchanged)', () => {
      expect(tabIcons['Home']).toBe('🏠');
    });

    it('Album tab uses book emoji (unchanged)', () => {
      expect(tabIcons['Album']).toBe('📖');
    });

    it('Duplicates tab uses cycle emoji (unchanged)', () => {
      expect(tabIcons['Duplicates']).toBe('🔄');
    });

    it('Stats tab uses chart emoji (unchanged)', () => {
      expect(tabIcons['Stats']).toBe('📊');
    });
  });
});
