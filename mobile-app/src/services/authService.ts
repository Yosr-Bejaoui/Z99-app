import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getErrorMessage } from './api';
import { ENDPOINTS, STORAGE_KEYS } from './config';
import { User, LoginResponse, RegisterResponse, AuthTokens, LoginCredentials, RegisterData } from './types';

export const authService = {
  // Register new user
  async register(data: RegisterData): Promise<{ message: string }> {
    try {
      // Backend expects: username, email, password, confirm_password, first_name, last_name
      const nameParts = data.name.trim().split(' ');
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
      console.log('Attempting login for:', credentials.email);
      const response = await api.post(ENDPOINTS.LOGIN, {
        email: credentials.email,
        password: credentials.password,
      });

      console.log('Login response received:', JSON.stringify(response.data));
      const { access, refresh, user } = response.data;

      // Store tokens and user data only if they exist
      if (access && refresh) {
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.ACCESS_TOKEN, access],
          [STORAGE_KEYS.REFRESH_TOKEN, refresh],
          [STORAGE_KEYS.USER, JSON.stringify(user)],
        ]);
        console.log('Tokens stored successfully');
      } else {
        console.error('Missing tokens in response:', { access: !!access, refresh: !!refresh });
        throw new Error('Invalid response from server - missing authentication tokens');
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
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

  // Update profile picture
  async updateProfilePicture(imageUri: string): Promise<User> {
    try {
      // Create form data for image upload
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('profile_picture', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await api.patch(ENDPOINTS.PROFILE, formData, {
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
};

export default authService;
