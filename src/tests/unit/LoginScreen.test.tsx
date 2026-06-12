import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { LoginScreen } from '@modules/auth/screens/LoginScreen';

jest.mock('@modules/auth/services/authService', () => ({
  authService: {
    signInWithGoogle: jest.fn(),
  },
}));

jest.mock('@modules/auth/components/PrivacyPolicyModal', () => ({
  PrivacyPolicyModal: ({ visible }: { visible: boolean }) => (visible ? <></> : null),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function getMockedSignIn() {
  const mod = require('@modules/auth/services/authService') as {
    authService: { signInWithGoogle: jest.Mock };
  };
  return mod.authService.signInWithGoogle;
}

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without error element in the initial state', () => {
    const { queryByTestId } = render(<LoginScreen />);
    expect(queryByTestId('login-error')).toBeNull();
  });

  it('shows network error message when signInWithGoogle throws network error', async () => {
    getMockedSignIn().mockRejectedValue(new Error('NetworkError'));

    const { getByText, getByTestId } = render(<LoginScreen />);

    await act(async () => {
      fireEvent.press(getByText('Entrar com Google'));
    });

    expect(getByTestId('login-error')).toBeTruthy();
    expect(getByTestId('login-error').props.children).toBe(
      'Sem conexão. Verifique sua internet e tente novamente.',
    );
  });

  it('shows network error message when error message contains fetch', async () => {
    getMockedSignIn().mockRejectedValue(new Error('fetch error'));

    const { getByText, getByTestId } = render(<LoginScreen />);

    await act(async () => {
      fireEvent.press(getByText('Entrar com Google'));
    });

    expect(getByTestId('login-error')).toBeTruthy();
    expect(getByTestId('login-error').props.children).toBe(
      'Sem conexão. Verifique sua internet e tente novamente.',
    );
  });

  it('does not render error when user cancels login', async () => {
    getMockedSignIn().mockRejectedValue(new Error('user_cancelled_login'));

    const { getByText, queryByTestId } = render(<LoginScreen />);

    await act(async () => {
      fireEvent.press(getByText('Entrar com Google'));
    });

    expect(queryByTestId('login-error')).toBeNull();
  });

  it('shows generic error message on unknown error', async () => {
    getMockedSignIn().mockRejectedValue(new Error('Something went wrong'));

    const { getByText, getByTestId } = render(<LoginScreen />);

    await act(async () => {
      fireEvent.press(getByText('Entrar com Google'));
    });

    expect(getByTestId('login-error')).toBeTruthy();
    expect(getByTestId('login-error').props.children).toBe(
      'Não foi possível fazer login. Tente novamente.',
    );
  });

  it('clears error when handleGoogleLogin is called again before auto-dismiss', async () => {
    const mock = getMockedSignIn();
    mock.mockRejectedValueOnce(new Error('NetworkError')).mockResolvedValueOnce(undefined);

    const { getByText, queryByTestId } = render(<LoginScreen />);

    await act(async () => {
      fireEvent.press(getByText('Entrar com Google'));
    });
    expect(queryByTestId('login-error')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Entrar com Google'));
    });
    expect(queryByTestId('login-error')).toBeNull();
  });

  it('auto-dismisses error after 6 seconds', async () => {
    getMockedSignIn().mockRejectedValue(new Error('NetworkError'));

    const { getByText, queryByTestId } = render(<LoginScreen />);

    await act(async () => {
      fireEvent.press(getByText('Entrar com Google'));
    });
    expect(queryByTestId('login-error')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(6000);
    });

    expect(queryByTestId('login-error')).toBeNull();
  });

  it('returns null for login-error after successful login', async () => {
    getMockedSignIn().mockResolvedValue(undefined);

    const { getByText, queryByTestId } = render(<LoginScreen />);

    await act(async () => {
      fireEvent.press(getByText('Entrar com Google'));
    });

    expect(queryByTestId('login-error')).toBeNull();
  });

  it('renders the privacy policy footer link', () => {
    const { getByTestId } = render(<LoginScreen />);
    expect(getByTestId('privacy-policy-link')).toBeTruthy();
  });

  it('privacy policy link has the text "Política de Privacidade"', () => {
    const { getByTestId } = render(<LoginScreen />);
    const link = getByTestId('privacy-policy-link');
    expect(link).toHaveTextContent('Política de Privacidade');
  });
});
