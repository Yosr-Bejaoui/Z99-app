import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: AdminUser;
}

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  name: string;
  is_staff: boolean;
  is_superuser: boolean;
  profile_picture?: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/accounts/login/', credentials);
    
    // Store tokens and user info
    localStorage.setItem('admin_token', response.data.access);
    localStorage.setItem('admin_refresh_token', response.data.refresh);
    localStorage.setItem('admin_user', JSON.stringify(response.data.user));
    
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('admin_refresh_token');
      if (refreshToken) {
        await api.post('/accounts/logout/', { refresh: refreshToken });
      }
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');
    }
  },

  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('admin_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    
    const response = await api.post<{ access: string }>('/accounts/token/refresh/', {
      refresh: refreshToken,
    });
    
    localStorage.setItem('admin_token', response.data.access);
    return response.data.access;
  },

  getCurrentUser(): AdminUser | null {
    const userStr = localStorage.getItem('admin_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('admin_token');
  },
};

export default authService;
