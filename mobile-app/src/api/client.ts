import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

interface TokenData {
  access: string;
  refresh: string;
}

interface UserData {
  user_id: number;
  email: string;
  username: string;
  is_active: boolean;
  subscribed: boolean;
  credits_balance: number;
  total_token_used: number;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async init() {
    this.accessToken = await AsyncStorage.getItem(TOKEN_KEY);
    this.refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  async setTokens(tokens: TokenData) {
    this.accessToken = tokens.access;
    this.refreshToken = tokens.refresh;
    await AsyncStorage.setItem(TOKEN_KEY, tokens.access);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }

  async setUser(user: UserData) {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  async getUser(): Promise<UserData | null> {
    const userData = await AsyncStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  async clearAuth() {
    this.accessToken = null;
    this.refreshToken = null;
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    
    return headers;
  }

  async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: any;
      includeAuth?: boolean;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, includeAuth = true } = options;
    
    const url = `${API_URL}${endpoint}`;
    
    const config: RequestInit = {
      method,
      headers: this.getHeaders(includeAuth),
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      
      // Handle 401 - try to refresh token
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the original request
          config.headers = this.getHeaders(includeAuth);
          const retryResponse = await fetch(url, config);
          if (!retryResponse.ok) {
            throw await this.handleError(retryResponse);
          }
          return await retryResponse.json();
        }
      }

      if (!response.ok) {
        throw await this.handleError(response);
      }

      // Handle empty responses
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as T);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_URL}/accounts/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access;
        await AsyncStorage.setItem(TOKEN_KEY, data.access);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    // Clear auth if refresh failed
    await this.clearAuth();
    return false;
  }

  private async handleError(response: Response): Promise<Error> {
    let message = 'An error occurred';
    try {
      const data = await response.json();
      message = data.detail || data.message || data.error || JSON.stringify(data);
    } catch {
      message = response.statusText || message;
    }
    return new Error(message);
  }

  // Multipart form data for file uploads (profile avatar, etc.)
  async uploadFile<T>(
    endpoint: string,
    formData: FormData
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    const headers: HeadersInit = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw await this.handleError(response);
    }

    return await response.json();
  }
}

export const apiClient = new ApiClient();
export default apiClient;
