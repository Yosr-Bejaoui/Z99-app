const mockApi = {
  post: jest.fn(),
  get: jest.fn(),
  defaults: { baseURL: 'https://api.example.com/api/v1' },
};

const mockGetErrorMessage = jest.fn((error: unknown) =>
  error instanceof Error ? error.message : 'Unknown API error'
);

const mockAsyncStorage = {
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
};

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    post: (...args: unknown[]) => mockApi.post(...args),
    get: (...args: unknown[]) => mockApi.get(...args),
    defaults: { baseURL: 'https://api.example.com/api/v1' },
  },
  post: (...args: unknown[]) => mockApi.post(...args),
  get: (...args: unknown[]) => mockApi.get(...args),
  defaults: { baseURL: 'https://api.example.com/api/v1' },
  getErrorMessage: (...args: unknown[]) => mockGetErrorMessage(...args),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    multiSet: (...args: unknown[]) => mockAsyncStorage.multiSet(...args),
    multiRemove: (...args: unknown[]) => mockAsyncStorage.multiRemove(...args),
    getItem: (...args: unknown[]) => mockAsyncStorage.getItem(...args),
    setItem: (...args: unknown[]) => mockAsyncStorage.setItem(...args),
  },
  multiSet: (...args: unknown[]) => mockAsyncStorage.multiSet(...args),
  multiRemove: (...args: unknown[]) => mockAsyncStorage.multiRemove(...args),
  getItem: (...args: unknown[]) => mockAsyncStorage.getItem(...args),
  setItem: (...args: unknown[]) => mockAsyncStorage.setItem(...args),
}));

import { authService } from '../services/authService';
import { ENDPOINTS, STORAGE_KEYS } from '../services/config';

describe('authService', () => {
  const originalWarn = console.warn;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetErrorMessage.mockImplementation((error: unknown) =>
      error instanceof Error ? error.message : 'Unknown API error'
    );
    console.warn = jest.fn();
  });

  afterAll(() => {
    console.warn = originalWarn;
  });

  describe('register', () => {
    it('maps frontend registration data into the backend payload and returns the API message', async () => {
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.123);
      mockApi.post.mockResolvedValueOnce({ data: { message: 'Verification code sent' } });

      await expect(
        authService.register({
          email: 'ada@example.com',
          password: 'Secret123',
          password2: 'Secret123',
          name: 'Ada Lovelace',
        })
      ).resolves.toEqual({ message: 'Verification code sent' });

      expect(mockApi.post).toHaveBeenCalledWith(ENDPOINTS.REGISTER, {
        username: 'ada123',
        email: 'ada@example.com',
        password: 'Secret123',
        confirm_password: 'Secret123',
        first_name: 'Ada',
        last_name: 'Lovelace',
      });
      randomSpy.mockRestore();
    });

    it('handles missing display names without sending undefined name fields', async () => {
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
      mockApi.post.mockResolvedValueOnce({ data: { message: 'Verification code sent' } });

      await authService.register({
        email: 'grace@example.com',
        password: 'Secret123',
        password2: 'Secret123',
      });

      expect(mockApi.post).toHaveBeenCalledWith(ENDPOINTS.REGISTER, expect.objectContaining({
        first_name: '',
        last_name: '',
      }));
      randomSpy.mockRestore();
    });

    it('rethrows a readable backend error when registration fails', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Email already exists'));

      await expect(
        authService.register({
          email: 'ada@example.com',
          password: 'Secret123',
          password2: 'Secret123',
          name: 'Ada',
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  it('activates an account by posting the email and OTP code', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { message: 'Activated' } });

    await expect(authService.activateAccount('ada@example.com', '123456')).resolves.toEqual({ message: 'Activated' });
    expect(mockApi.post).toHaveBeenCalledWith(ENDPOINTS.ACTIVATE, {
      email: 'ada@example.com',
      code: '123456',
    });
  });

  describe('login', () => {
    it('normalizes credentials, stores tokens, and normalizes credits from the backend user payload', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: {
          access: 'access-token',
          refresh: 'refresh-token',
          user: {
            id: 1,
            email: 'ada@example.com',
            username: 'ada',
            subscribed: false,
            api_limit: 0,
            total_token_used: 0,
            credits_balance: 77,
          },
        },
      });

      const response = await authService.login({
        email: '  ADA@EXAMPLE.COM ',
        password: ' Secret123 ',
      });

      expect(mockApi.post).toHaveBeenCalledWith(ENDPOINTS.LOGIN, {
        email: 'ada@example.com',
        password: 'Secret123',
      });
      expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith([
        [STORAGE_KEYS.ACCESS_TOKEN, 'access-token'],
        [STORAGE_KEYS.REFRESH_TOKEN, 'refresh-token'],
        [STORAGE_KEYS.USER, expect.any(String)],
      ]);
      expect(response.user.credits).toBe(77);

      const storedUser = JSON.parse(mockAsyncStorage.multiSet.mock.calls[0][0][2][1]);
      expect(storedUser).toEqual(expect.objectContaining({
        id: 1,
        email: 'ada@example.com',
        username: 'ada',
        credits: 77,
      }));
    });

    it('rejects login responses that omit authentication tokens', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: {
          access: '',
          refresh: '',
          user: { id: 1 },
        },
      });

      await expect(authService.login({ email: 'ada@example.com', password: 'Secret123' })).rejects.toThrow(
        'Invalid response from server - missing authentication tokens'
      );
      expect(console.warn).toHaveBeenCalledWith('Login failed:', 'Invalid response from server - missing authentication tokens');
    });

    it('rethrows a readable login failure message', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(authService.login({ email: 'ada@example.com', password: 'bad' })).rejects.toThrow('Invalid credentials');
      expect(console.warn).toHaveBeenCalledWith('Login failed:', 'Invalid credentials');
    });
  });

  it('stores Google OAuth tokens and returns the original response payload', async () => {
    const responseData = {
      access: 'google-access',
      refresh: 'google-refresh',
      user: { id: 2, username: 'google-user' },
    };
    mockApi.post.mockResolvedValueOnce({ data: responseData });

    await expect(authService.googleLogin('google-id-token')).resolves.toEqual(responseData);
    expect(mockApi.post).toHaveBeenCalledWith(ENDPOINTS.GOOGLE_LOGIN, { id_token: 'google-id-token' });
    expect(mockAsyncStorage.multiSet).toHaveBeenCalled();
  });

  describe('logout', () => {
    it('posts the refresh token when present and always clears local storage', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('refresh-token');
      mockApi.post.mockResolvedValueOnce({ data: {} });

      await authService.logout();

      expect(mockApi.post).toHaveBeenCalledWith(ENDPOINTS.LOGOUT, { refresh: 'refresh-token' });
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
      ]);
    });

    it('still clears local storage when logout API calls fail', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('refresh-token');
      mockApi.post.mockRejectedValueOnce(new Error('Logout endpoint unavailable'));

      await authService.logout();

      expect(console.warn).toHaveBeenCalledWith('Logout API error:', 'Logout endpoint unavailable');
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalled();
    });
  });

  describe('local auth helpers', () => {
    it('returns the current user from storage when valid JSON exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ id: 99, username: 'saved-user' }));

      await expect(authService.getCurrentUser()).resolves.toEqual({ id: 99, username: 'saved-user' });
    });

    it('returns null when current-user storage is invalid JSON', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('{bad json');

      await expect(authService.getCurrentUser()).resolves.toBeNull();
    });

    it('returns true when an access token exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('token');
      await expect(authService.isAuthenticated()).resolves.toBe(true);
    });

    it('returns false when reading the access token throws', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('storage offline'));
      await expect(authService.isAuthenticated()).resolves.toBe(false);
    });
  });

  describe('getProfile', () => {
    it('normalizes array-based profile responses and expands relative avatar URLs', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: [
          {
            user: 7,
            first_name: 'Ada',
            last_name: 'Lovelace',
            avatar: '/media/ada.png',
            user_details: {
              id: 7,
              email: 'ada@example.com',
              username: 'ada',
              subscribed: true,
              api_limit: 1000,
              total_token_used: 15,
              words: 80,
            },
          },
        ],
      });

      await expect(authService.getProfile()).resolves.toEqual({
        id: 7,
        email: 'ada@example.com',
        username: 'ada',
        name: 'Ada Lovelace',
        subscribed: true,
        api_limit: 1000,
        total_token_used: 15,
        credits: 80,
        profile_picture: 'https://api.example.com/media/ada.png',
      });
      const storedProfile = JSON.parse(mockAsyncStorage.setItem.mock.calls[0][1]);
      expect(storedProfile).toEqual(expect.objectContaining({ id: 7, credits: 80 }));
    });

    it('supports value/results wrappers and falls back to username when no full name is available', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          value: [
            {
              user_details: {
                id: 8,
                email: 'grace@example.com',
                username: 'grace',
                subscribed: false,
                api_limit: 5,
                total_token_used: 2,
                credits_balance: 13,
                profile_picture: 'https://cdn.example.com/avatar.png',
              },
            },
          ],
        },
      });

      await expect(authService.getProfile()).resolves.toEqual({
        id: 8,
        email: 'grace@example.com',
        username: 'grace',
        name: 'grace',
        subscribed: false,
        api_limit: 5,
        total_token_used: 2,
        credits: 13,
        profile_picture: 'https://cdn.example.com/avatar.png',
      });
    });

    it('rethrows formatted profile-load failures', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Profile unavailable'));

      await expect(authService.getProfile()).rejects.toThrow('Profile unavailable');
    });
  });

  it('maps editable profile fields to the backend payload and stores the updated profile', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { id: 1, name: 'Ada Lovelace' } });

    await expect(
      authService.updateProfile({ name: 'Ada Lovelace', email: 'ada@example.com', username: 'ada' })
    ).resolves.toEqual({ id: 1, name: 'Ada Lovelace' });

    expect(mockApi.post).toHaveBeenCalledWith(ENDPOINTS.PROFILE, {
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: 'ada@example.com',
      username: 'ada',
    });
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.USER, JSON.stringify({ id: 1, name: 'Ada Lovelace' }));
  });

  it('delegates forgot-password requests to the backend', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { message: 'Reset email sent' } });

    await expect(authService.forgotPassword('ada@example.com')).resolves.toEqual({ message: 'Reset email sent' });
    expect(mockApi.post).toHaveBeenCalledWith(ENDPOINTS.FORGOT_PASSWORD, { email: 'ada@example.com' });
  });

  it('delegates reset-password requests to the backend', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { message: 'Password reset' } });

    await expect(authService.resetPassword('reset-token', 'NewSecret123')).resolves.toEqual({ message: 'Password reset' });
    expect(mockApi.post).toHaveBeenCalledWith(ENDPOINTS.RESET_PASSWORD, {
      token: 'reset-token',
      new_password: 'NewSecret123',
    });
  });

  it('loads transaction history from the transactions endpoint', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { results: [{ id: 1 }], count: 1 } });

    await expect(authService.getTransactions()).resolves.toEqual({ results: [{ id: 1 }], count: 1 });
    expect(mockApi.get).toHaveBeenCalledWith(ENDPOINTS.TRANSACTIONS);
  });

  it('uploads profile pictures as multipart form data and stores the updated profile', async () => {
    const append = jest.fn();
    const originalFormData = global.FormData;
    Object.defineProperty(global, 'FormData', {
      configurable: true,
      writable: true,
      value: jest.fn(() => ({ append })),
    });
    mockApi.post.mockResolvedValueOnce({ data: { id: 1, profile_picture: 'https://cdn.example.com/avatar.jpg' } });

    await expect(authService.updateProfilePicture('/tmp/avatar.png')).resolves.toEqual({
      id: 1,
      profile_picture: 'https://cdn.example.com/avatar.jpg',
    });

    expect(append).toHaveBeenCalledWith('avatar', {
      uri: '/tmp/avatar.png',
      name: 'avatar.png',
      type: 'image/png',
    });
    expect(mockApi.post).toHaveBeenCalledWith(
      ENDPOINTS.PROFILE,
      expect.any(Object),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    Object.defineProperty(global, 'FormData', {
      configurable: true,
      writable: true,
      value: originalFormData,
    });
  });

  it('changes a password by posting the old and new password pair', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { message: 'Password changed' } });

    await expect(
      authService.changePassword({ current_password: 'OldSecret123', new_password: 'NewSecret123' })
    ).resolves.toEqual({ message: 'Password changed' });
    expect(mockApi.post).toHaveBeenCalledWith('/accounts/change-password/', {
      current_password: 'OldSecret123',
      new_password: 'NewSecret123',
    });
  });

  describe('deleteAccount', () => {
    it('posts the password and clears local tokens on success', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { message: 'Account deleted' } });

      await expect(authService.deleteAccount('Secret123')).resolves.toEqual({ message: 'Account deleted' });
      expect(mockApi.post).toHaveBeenCalledWith('/accounts/delete-account/', { password: 'Secret123' });
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
      ]);
    });

    it('does not clear local tokens when account deletion fails', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Password incorrect'));

      await expect(authService.deleteAccount('bad')).rejects.toThrow('Password incorrect');
      expect(mockAsyncStorage.multiRemove).not.toHaveBeenCalled();
    });
  });
});