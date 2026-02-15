import apiClient from './client';
import { ENDPOINTS } from './config';

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    user_id: number;
    email: string;
    username: string;
    is_active: boolean;
    subscribed: boolean;
    credits_balance: number;
    total_token_used: number;
  };
  refresh: string;
  access: string;
}

export interface ActivateInput {
  email: string;
  code: string;
}

export interface ResetPasswordInput {
  email: string;
  code: string;
  password: string;
}

export const authService = {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<{ message: string }> {
    return apiClient.request(ENDPOINTS.register, {
      method: 'POST',
      body: input,
      includeAuth: false,
    });
  },

  /**
   * Login with email and password
   */
  async login(input: LoginInput): Promise<LoginResponse> {
    const response = await apiClient.request<LoginResponse>(ENDPOINTS.login, {
      method: 'POST',
      body: input,
      includeAuth: false,
    });

    // Store tokens and user data
    await apiClient.setTokens({
      access: response.access,
      refresh: response.refresh,
    });
    await apiClient.setUser(response.user);

    return response;
  },

  /**
   * Login with Google ID token
   */
  async googleLogin(idToken: string): Promise<LoginResponse> {
    const response = await apiClient.request<LoginResponse>(ENDPOINTS.googleLogin, {
      method: 'POST',
      body: { id_token: idToken },
      includeAuth: false,
    });

    // Store tokens and user data
    await apiClient.setTokens({
      access: response.access,
      refresh: response.refresh,
    });
    await apiClient.setUser(response.user);

    return response;
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    const refreshToken = apiClient.getRefreshToken();
    if (refreshToken) {
      try {
        await apiClient.request(ENDPOINTS.logout, {
          method: 'POST',
          body: { refresh: refreshToken },
        });
      } catch (error) {
        // Continue with local logout even if API fails
        console.warn('Logout API failed:', error);
      }
    }
    await apiClient.clearAuth();
  },

  /**
   * Activate account with code
   */
  async activate(input: ActivateInput): Promise<{ message: string }> {
    return apiClient.request(ENDPOINTS.activate, {
      method: 'POST',
      body: input,
      includeAuth: false,
    });
  },

  /**
   * Request password reset code
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.request(ENDPOINTS.forgotPassword, {
      method: 'POST',
      body: { email },
      includeAuth: false,
    });
  },

  /**
   * Reset password with code
   */
  async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    return apiClient.request(ENDPOINTS.resetPassword, {
      method: 'POST',
      body: input,
      includeAuth: false,
    });
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  },

  /**
   * Get current user from storage
   */
  async getCurrentUser() {
    return apiClient.getUser();
  },

  /**
   * Initialize auth state (call on app start)
   */
  async init() {
    await apiClient.init();
  },
};

export default authService;
