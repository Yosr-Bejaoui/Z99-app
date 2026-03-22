import React from 'react';
import { Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';

const mockAsyncStorage = {
  getItem: jest.fn(),
  multiRemove: jest.fn(),
};

const mockAuthService = {
  getProfile: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
  activateAccount: jest.fn(),
  googleLogin: jest.fn(),
  logout: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: (...args: unknown[]) => mockAsyncStorage.getItem(...args),
    multiRemove: (...args: unknown[]) => mockAsyncStorage.multiRemove(...args),
  },
  getItem: (...args: unknown[]) => mockAsyncStorage.getItem(...args),
  multiRemove: (...args: unknown[]) => mockAsyncStorage.multiRemove(...args),
}));

jest.mock('../services', () => ({
  authService: {
    getProfile: (...args: unknown[]) => mockAuthService.getProfile(...args),
    login: (...args: unknown[]) => mockAuthService.login(...args),
    register: (...args: unknown[]) => mockAuthService.register(...args),
    activateAccount: (...args: unknown[]) => mockAuthService.activateAccount(...args),
    googleLogin: (...args: unknown[]) => mockAuthService.googleLogin(...args),
    logout: (...args: unknown[]) => mockAuthService.logout(...args),
  },
  STORAGE_KEYS: {
    ACCESS_TOKEN: '@auth_access_token',
    REFRESH_TOKEN: '@auth_refresh_token',
    USER: '@auth_user',
  },
}));

import { AuthProvider, useAuth } from '../context/AuthContext';

describe('AuthContext', () => {
  let capturedContext: ReturnType<typeof useAuth> | undefined;

  const sampleUser = {
    id: 1,
    email: 'ada@example.com',
    username: 'ada',
    subscribed: false,
    api_limit: 0,
    total_token_used: 0,
  };

  const Capture = () => {
    capturedContext = useAuth();
    return <Text>{capturedContext.isLoading ? 'loading' : capturedContext.user?.username || 'anonymous'}</Text>;
  };

  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    capturedContext = undefined;
  });

  it('throws when useAuth is called outside AuthProvider', () => {
    expect(() => render(<Capture />)).toThrow('useAuth must be used within an AuthProvider');
  });

  it('starts unauthenticated when no stored token exists', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce(null);

    const screen = render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('anonymous')).toBeTruthy());
    expect(mockAuthService.getProfile).not.toHaveBeenCalled();
    expect(capturedContext?.isAuthenticated).toBe(false);
  });

  it('hydrates the authenticated user when a stored token exists', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce('access-token');
    mockAuthService.getProfile.mockResolvedValueOnce(sampleUser);

    const screen = render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('ada')).toBeTruthy());
    expect(capturedContext?.user).toEqual(sampleUser);
    expect(capturedContext?.isAuthenticated).toBe(true);
  });

  it('clears invalid persisted auth state when profile hydration fails', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce('access-token');
    mockAuthService.getProfile.mockRejectedValueOnce(new Error('Unauthorized'));

    const screen = render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('anonymous')).toBeTruthy());
    expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
      '@auth_access_token',
      '@auth_refresh_token',
      '@auth_user',
    ]);
  });

  it('updates the user after a successful login', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce(null);
    mockAuthService.login.mockResolvedValueOnce({ user: sampleUser });

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );

    await waitFor(() => expect(capturedContext?.isLoading).toBe(false));
    await act(async () => {
      await capturedContext?.login({ email: 'ada@example.com', password: 'Secret123' });
    });

    expect(capturedContext?.user).toEqual(sampleUser);
    expect(capturedContext?.isAuthenticated).toBe(true);
  });

  it('returns the registration response from the auth service', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce(null);
    mockAuthService.register.mockResolvedValueOnce({ message: 'Verification code sent' });

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );

    await waitFor(() => expect(capturedContext?.isLoading).toBe(false));
    await expect(
      capturedContext?.register({
        email: 'ada@example.com',
        password: 'Secret123',
        password2: 'Secret123',
        name: 'Ada Lovelace',
      })
    ).resolves.toEqual({ message: 'Verification code sent' });
  });

  it('returns the activation response from the auth service', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce(null);
    mockAuthService.activateAccount.mockResolvedValueOnce({ message: 'Activated' });

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );

    await waitFor(() => expect(capturedContext?.isLoading).toBe(false));
    await expect(capturedContext?.activateAccount('ada@example.com', '123456')).resolves.toEqual({ message: 'Activated' });
  });

  it('updates the user after Google login succeeds', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce(null);
    mockAuthService.googleLogin.mockResolvedValueOnce({ user: sampleUser });

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );

    await waitFor(() => expect(capturedContext?.isLoading).toBe(false));
    await act(async () => {
      await capturedContext?.googleLogin('google-token');
    });

    expect(capturedContext?.user).toEqual(sampleUser);
  });

  it('logs out the current user and clears authenticated state', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce('access-token');
    mockAuthService.getProfile.mockResolvedValueOnce(sampleUser);
    mockAuthService.logout.mockResolvedValueOnce(undefined);

    const screen = render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('ada')).toBeTruthy());
    await act(async () => {
      await capturedContext?.logout();
    });

    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(capturedContext?.user).toBeNull();
    expect(capturedContext?.isAuthenticated).toBe(false);
  });

  it('refreshes the current user profile in place', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce('access-token');
    mockAuthService.getProfile
      .mockResolvedValueOnce(sampleUser)
      .mockResolvedValueOnce({ ...sampleUser, username: 'updated-user' });

    const screen = render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('ada')).toBeTruthy());
    await act(async () => {
      await capturedContext?.refreshUser();
    });

    expect(capturedContext?.user?.username).toBe('updated-user');
  });

  it('falls back to logout when refreshUser fails', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce('access-token');
    mockAuthService.getProfile
      .mockResolvedValueOnce(sampleUser)
      .mockRejectedValueOnce(new Error('Unauthorized'));
    mockAuthService.logout.mockResolvedValueOnce(undefined);

    const screen = render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('ada')).toBeTruthy());
    await act(async () => {
      await capturedContext?.refreshUser();
    });

    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(capturedContext?.user).toBeNull();
  });
});