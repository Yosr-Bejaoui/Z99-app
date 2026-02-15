import api from './api';

export interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  profile_picture?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  subscribed: boolean;
  total_words_used: number;
  total_images_generated: number;
  created_at: string;
  last_login?: string;
  subscription?: {
    id: number;
    plan: {
      id: number;
      name: string;
      price: number;
    };
    status: string;
    end_date: string;
  };
}

export interface UsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

export interface UserFilters {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  is_staff?: boolean;
  subscribed?: boolean;
  ordering?: string;
}

export const usersService = {
  async getUsers(filters: UserFilters = {}): Promise<UsersResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters.is_staff !== undefined) params.append('is_staff', filters.is_staff.toString());
    if (filters.subscribed !== undefined) params.append('subscribed', filters.subscribed.toString());
    if (filters.ordering) params.append('ordering', filters.ordering);
    
    const response = await api.get<UsersResponse>(`/accounts/admin/users/?${params.toString()}`);
    return response.data;
  },

  async getUser(id: number): Promise<User> {
    const response = await api.get<User>(`/accounts/admin/users/${id}/`);
    return response.data;
  },

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await api.patch<User>(`/accounts/admin/users/${id}/`, data);
    return response.data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/accounts/admin/users/${id}/`);
  },

  async toggleUserStatus(id: number, isActive: boolean): Promise<User> {
    const response = await api.patch<User>(`/accounts/admin/users/${id}/`, {
      is_active: isActive,
    });
    return response.data;
  },

  async getUserStats(): Promise<{
    total_users: number;
    active_users: number;
    subscribed_users: number;
    new_users_today: number;
    new_users_this_week: number;
    new_users_this_month: number;
  }> {
    const response = await api.get('/accounts/admin/stats/');
    return response.data;
  },
};

export default usersService;
