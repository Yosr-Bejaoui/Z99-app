import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getErrorMessage } from './api';
import { ENDPOINTS, STORAGE_KEYS } from './config';
import { User, LoginResponse, RegisterResponse, AuthTokens, LoginCredentials, RegisterData } from './types';

const normalizeAuthUser = (user: any, fallbackEmail = ''): User => {
  const safeEmail = user?.email || fallbackEmail || '';
  const safeUsername = user?.username || (safeEmail ? safeEmail.split('@')[0] : 'user');

  return {
    id: user?.id ?? user?.user_id ?? 0,
    email: safeEmail,
    username: safeUsername,
    name: user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || safeUsername,
    profile_picture: user?.profile_picture || user?.avatar,
    subscribed: user?.subscribed ?? false,
    api_limit: user?.api_limit ?? 0,
    total_token_used: user?.total_token_used ?? 0,
    credits: user?.credits ?? user?.credits_balance ?? user?.words ?? 0,
  };
};

const unwrapAuthPayload = (payload: any): any => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  return payload.data || payload.value || payload.result || payload;
};

const extractAccessToken = (raw: any): string | undefined => {
  return raw?.access || raw?.access_token || raw?.token?.access || raw?.tokens?.access;
};

const extractRefreshToken = (raw: any): string | undefined => {
  return raw?.refresh || raw?.refresh_token || raw?.token?.refresh || raw?.tokens?.refresh;
};

const getWrappedAuthError = (payload: any): string | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  // Some backends return HTTP 200 with { success: false, error: {...} }
  if (payload.success === false) {
    const err = payload.error;
    if (typeof err === 'string') {
      return err;
    }
    if (err && typeof err === 'object') {
      return err.message || err.detail || JSON.stringify(err);
    }
    return payload.message || 'Login failed';
  }

  return null;
};

const getPayloadAuthError = (payload: any, raw: any): string | null => {
  const candidates = [raw, payload];

  for (const item of candidates) {
    if (!item || typeof item !== 'object') continue;

    if (typeof item.message === 'string' && item.message.trim()) {
      return item.message;
    }

    if (typeof item.detail === 'string' && item.detail.trim()) {
      return item.detail;
    }

    if (typeof item.error === 'string' && item.error.trim()) {
      return item.error;
    }

    if (item.error && typeof item.error === 'object') {
      if (typeof item.error.message === 'string' && item.error.message.trim()) {
        return item.error.message;
      }
      if (typeof item.error.detail === 'string' && item.error.detail.trim()) {
        return item.error.detail;
      }
    }
  }

  return null;
};

export const authService = {
  // Register new user
  async register(data: RegisterData): Promise<{ message: string }> {
    try {
      // Backend expects: username, email, password, confirm_password, first_name, last_name
      const nameParts = (data.name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await api.post(ENDPOINTS.REGISTER, {
        username: data.email.split('@')[0] + Math.floor(Math.random() * 1000), // Generate username from email
        email: data.email,
        password: data.password,
        confirm_password: data.password2,
        first_name: firstName,
        last_name: lastName,
      });

      // Registration returns a message, not tokens (requires OTP verification)
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Activate account with OTP
  async activateAccount(email: string, code: string): Promise<{ message: string }> {
    try {
      const response = await api.post(ENDPOINTS.ACTIVATE, {
        email,
        code,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Login user
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const normalizedEmail = credentials.email.trim().toLowerCase();
      const normalizedPassword = credentials.password.trim();
      const response = await api.post(ENDPOINTS.LOGIN, {
        email: normalizedEmail,
        password: normalizedPassword,
      });

      const payload = response.data || {};
      const wrappedError = getWrappedAuthError(payload);
      if (wrappedError) {
        throw new Error(wrappedError);
      }
      const raw = unwrapAuthPayload(payload);
      const access = extractAccessToken(raw);
      const refresh = extractRefreshToken(raw);

      if (!access || !refresh) {
        const specificError = getPayloadAuthError(payload, raw);
        if (specificError) {
          throw new Error(specificError);
        }
      }

      // Store tokens and user data only if they exist
      if (access && refresh) {
        // Clear any previous chat state so the new session starts fresh
        await AsyncStorage.removeItem('z99_chat_state');
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.ACCESS_TOKEN, access],
          [STORAGE_KEYS.REFRESH_TOKEN, refresh],
        ]);
      } else {
        throw new Error('Invalid response from server - missing authentication tokens');
      }

      let user = raw?.user || raw?.user_details || payload?.user || payload?.user_details;

      // Some backends return tokens without user payload. Fetch profile as fallback.
      if (!user) {
        try {
          user = await authService.getProfile();
        } catch {
          // handled below
        }
      }

      if (!user) {
        throw new Error('Invalid response from server - missing user profile');
      }

      const normalizedUser = normalizeAuthUser(user, normalizedEmail);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(normalizedUser));

      return {
        ...(typeof raw === 'object' && raw ? raw : {}),
        access,
        refresh,
        user: normalizedUser,
      } as LoginResponse;
    } catch (error) {
      const message = getErrorMessage(error);
      // Use warn to avoid dev red screen for handled API errors.
      console.warn('Login failed:', message);
      throw new Error(message);
    }
  },

  // Google OAuth login
  async googleLogin(token: string): Promise<LoginResponse> {
    try {
      const response = await api.post(ENDPOINTS.GOOGLE_LOGIN, {
        id_token: token,
      });

      const payload = response.data || {};
      const wrappedError = getWrappedAuthError(payload);
      if (wrappedError) {
        throw new Error(wrappedError);
      }
      const raw = unwrapAuthPayload(payload);
      const access = extractAccessToken(raw);
      const refresh = extractRefreshToken(raw);

      if (!access || !refresh) {
        const specificError = getPayloadAuthError(payload, raw);
        if (specificError) {
          throw new Error(specificError);
        }
      }

      if (!access || !refresh) {
        throw new Error('Invalid response from server - missing authentication tokens');
      }

      let user = raw?.user || raw?.user_details || payload?.user || payload?.user_details;

      // Clear any previous chat state so the new session starts fresh
      await AsyncStorage.removeItem('z99_chat_state');
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, access],
        [STORAGE_KEYS.REFRESH_TOKEN, refresh],
      ]);

      if (!user) {
        try {
          user = await authService.getProfile();
        } catch {
          // handled below
        }
      }

      if (!user) {
        throw new Error('Invalid response from server - missing user profile');
      }

      const normalizedUser = normalizeAuthUser(user);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(normalizedUser));

      return {
        ...(typeof raw === 'object' && raw ? raw : {}),
        access,
        refresh,
        user: normalizedUser,
      } as LoginResponse;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (refreshToken) {
        await api.post(ENDPOINTS.LOGOUT, {
          refresh: refreshToken,
        });
      }
    } catch (error) {
      console.warn('Logout API error:', getErrorMessage(error));
    } finally {
      // Always clear local storage (including chat state so old discussions
      // don't persist across sessions)
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
        'z99_chat_state',
      ]);
    }
  },

  // Get current user from storage
  async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      return null;
    }
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      return !!token;
    } catch (error) {
      return false;
    }
  },

  // Get user profile from API
  async getProfile(): Promise<User> {
    try {
      const response = await api.get(ENDPOINTS.PROFILE);

      // Profile endpoint returns a list with nested user_details
      // Normalize it into a flat User object
      let userData = response.data;
      if (Array.isArray(userData)) {
        userData = userData[0];
      } else if (userData?.value && Array.isArray(userData.value)) {
        userData = userData.value[0];
      } else if (userData?.results && Array.isArray(userData.results)) {
        userData = userData.results[0];
      }

      const profile = userData?.user_details || userData;

      // Handle avatar URL - ensure it's a full URL
      let avatarUrl = userData?.avatar || profile?.profile_picture;
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        // Extract base URL from API_BASE_URL (remove /api/v1)
        const baseUrl = api.defaults.baseURL?.replace('/api/v1', '') || '';
        avatarUrl = `${baseUrl}${avatarUrl}`;
      }

      const normalizedUser: User = {
        id: profile?.id || userData?.user,
        email: profile?.email || '',
        username: profile?.username || '',
        name: [userData?.first_name, userData?.last_name].filter(Boolean).join(' ') || profile?.username || '',
        subscribed: profile?.subscribed ?? false,
        api_limit: profile?.api_limit ?? 0,
        total_token_used: profile?.total_token_used ?? 0,
        credits: profile?.words ?? profile?.credits ?? profile?.credits_balance ?? 0,
        profile_picture: avatarUrl,
      };

      // Update stored user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(normalizedUser));

      return normalizedUser;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      // Map frontend fields to backend expected fields
      const payload: Record<string, string> = {};
      if (data.name) {
        const parts = data.name.split(' ');
        payload.first_name = parts[0] || '';
        payload.last_name = parts.slice(1).join(' ') || '';
      }
      if (data.email) {
        payload.email = data.email;
      }
      if (data.username) {
        payload.username = data.username;
      }

      // Backend create() handles update-if-exists; PATCH on list URL is not allowed
      const response = await api.post(ENDPOINTS.PROFILE, payload);

      // Update stored user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data));

      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Forgot password
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await api.post(ENDPOINTS.FORGOT_PASSWORD, { email });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await api.post(ENDPOINTS.RESET_PASSWORD, {
        token,
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Get credit transaction history
  async getTransactions(): Promise<{ results: any[]; count: number }> {
    try {
      const response = await api.get(ENDPOINTS.TRANSACTIONS);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Update profile picture
  async updateProfilePicture(imageUri: string): Promise<User> {
    try {
      // Create form data for image upload
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // Backend serializer field is 'avatar', not 'profile_picture'
      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      // Backend create() handles update-if-exists; PATCH on list URL is not allowed
      const response = await api.post(ENDPOINTS.PROFILE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Change password
  async changePassword(data: { current_password: string; new_password: string }): Promise<{ message: string }> {
    try {
      const response = await api.post('/accounts/change-password/', data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Delete account
  async deleteAccount(password: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/accounts/delete-account/', {
        password,
      });

      // Clear local storage on successful deletion (including chat state)
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
        'z99_chat_state',
      ]);

      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default authService;
