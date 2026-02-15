import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getErrorMessage } from './api';
import { ENDPOINTS, STORAGE_KEYS } from './config';
import { User, LoginResponse, RegisterResponse, AuthTokens, LoginCredentials, RegisterData } from './types';

export const authService = {
  // Register new user
  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      const response = await api.post(ENDPOINTS.REGISTER, {
        email: data.email,
        password: data.password,
        password2: data.password2,
        name: data.name,
      });

      const { access, refresh, user } = response.data;

      // Store tokens and user data
      if (access && refresh) {
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.ACCESS_TOKEN, access],
          [STORAGE_KEYS.REFRESH_TOKEN, refresh],
          [STORAGE_KEYS.USER, JSON.stringify(user)],
        ]);
      }

      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Login user
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await api.post(ENDPOINTS.LOGIN, {
        email: credentials.email,
        password: credentials.password,
      });

      const { access, refresh, user } = response.data;

      // Store tokens and user data only if they exist
      if (access && refresh) {
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.ACCESS_TOKEN, access],
          [STORAGE_KEYS.REFRESH_TOKEN, refresh],
          [STORAGE_KEYS.USER, JSON.stringify(user)],
        ]);
      } else {
        throw new Error('Invalid response from server');
      }

      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Google OAuth login
  async googleLogin(token: string): Promise<LoginResponse> {
    try {
      const response = await api.post(ENDPOINTS.GOOGLE_LOGIN, {
        token,
      });

      const { access, refresh, user } = response.data;

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, access],
        [STORAGE_KEYS.REFRESH_TOKEN, refresh],
        [STORAGE_KEYS.USER, JSON.stringify(user)],
      ]);

      return response.data;
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
      // Always clear local storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
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
      
      // Update stored user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await api.patch(ENDPOINTS.PROFILE, data);
      
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
};

export default authService;
