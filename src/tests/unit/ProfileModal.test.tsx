import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProfileModal } from '@modules/auth/components/ProfileModal';

jest.mock('@modules/auth/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@shared/services/supabase', () => ({
  supabase: {
    auth: {
      updateUser: jest.fn(),
    },
  },
}));

jest.mock('@modules/auth/services/authService', () => ({
  authService: {
    signOut: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@modules/auth/services/accountDeletionService', () => ({
  accountDeletionService: {
    requestDeletion: jest.fn().mockRejectedValue(new Error('not mocked')),
    cancelDeletion: jest.fn().mockRejectedValue(new Error('not mocked')),
  },
}));

jest.mock('@modules/auth/components/TypeSettingsModal', () => ({
  TypeSettingsModal: () => null,
}));

jest.mock('@modules/auth/components/AccountDeletionModal', () => ({
  AccountDeletionModal: () => null,
}));

jest.mock('@modules/auth/components/PrivacyPolicyModal', () => ({
  PrivacyPolicyModal: () => null,
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
  mockUseAuthStore = require('@modules/auth/store/authStore').useAuthStore;
  mockUseAuthStore.mockReturnValue({
    user: mockUser,
    setUser: jest.fn(),
    setPendingDeletion: jest.fn(),
  });
});

describe('ProfileModal', () => {
  it('renders the nickname editor when visible={true}', () => {
    const { getByText } = render(<ProfileModal visible={true} onClose={jest.fn()} />);
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('✏️')).toBeTruthy();
  });

  it('renders the "Sair da conta" button when visible={true}', () => {
    const { getByText } = render(<ProfileModal visible={true} onClose={jest.fn()} />);
    expect(getByText('🚪 Sair da conta')).toBeTruthy();
  });

  it('renders the "Política de Privacidade" button when visible={true}', () => {
    const { getByText } = render(<ProfileModal visible={true} onClose={jest.fn()} />);
    expect(getByText('📋 Política de Privacidade')).toBeTruthy();
  });

  it('renders the "Solicitar exclusão de conta" button with testID when visible={true}', () => {
    const { getByTestId } = render(<ProfileModal visible={true} onClose={jest.fn()} />);
    expect(getByTestId('request-deletion-btn')).toBeTruthy();
  });

  it('renders nothing when visible={false}', () => {
    const { queryByTestId, queryByText } = render(
      <ProfileModal visible={false} onClose={jest.fn()} />,
    );
    expect(queryByTestId('request-deletion-btn')).toBeNull();
    expect(queryByText('🚪 Sair da conta')).toBeNull();
  });

  it('onClose is called when the close button is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(<ProfileModal visible={true} onClose={onClose} />);
    fireEvent.press(getByText('Fechar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows nickname TextInput when edit button is pressed', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <ProfileModal visible={true} onClose={jest.fn()} />,
    );

    expect(queryByTestId('nickname-input')).toBeNull();

    fireEvent.press(getByText('✏️'));

    expect(getByTestId('nickname-input')).toBeTruthy();
  });

  it('calls supabase.auth.updateUser when save button is pressed', () => {
    const { supabase } = require('@shared/services/supabase');
    supabase.auth.updateUser.mockResolvedValue({ error: null });

    const { getByText, getByTestId } = render(<ProfileModal visible={true} onClose={jest.fn()} />);

    fireEvent.press(getByText('✏️'));
    fireEvent.press(getByTestId('save-button'));

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      data: { full_name: 'Test User' },
    });
  });
});
