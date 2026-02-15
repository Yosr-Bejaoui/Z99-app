import api from './api';

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    new_today: number;
    new_this_week: number;
    growth_percentage: number;
  };
  subscriptions: {
    total_active: number;
    revenue_this_month: number;
    revenue_growth: number;
    churn_rate: number;
  };
  usage: {
    total_chats: number;
    total_images: number;
    total_words: number;
    active_sessions_today: number;
  };
  models: {
    total: number;
    active: number;
    most_used: string;
  };
}

export interface UsageData {
  date: string;
  chats: number;
  images: number;
  words: number;
}

export interface RevenueData {
  date: string;
  amount: number;
  subscriptions: number;
}

export interface UserGrowthData {
  date: string;
  total_users: number;
  new_users: number;
}

export const analyticsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/analytics/dashboard/');
    return response.data;
  },

  async getUsageAnalytics(days: number = 30): Promise<UsageData[]> {
    const response = await api.get<UsageData[]>(`/analytics/usage/?days=${days}`);
    return response.data;
  },

  async getRevenueAnalytics(days: number = 30): Promise<RevenueData[]> {
    const response = await api.get<RevenueData[]>(`/analytics/revenue/?days=${days}`);
    return response.data;
  },

  async getUserGrowthAnalytics(days: number = 30): Promise<UserGrowthData[]> {
    const response = await api.get<UserGrowthData[]>(`/analytics/user-growth/?days=${days}`);
    return response.data;
  },

  async getModelUsageStats(): Promise<{
    model_name: string;
    usage_count: number;
    percentage: number;
  }[]> {
    const response = await api.get('/analytics/model-usage/');
    return response.data;
  },

  async getTopUsers(limit: number = 10): Promise<{
    id: number;
    email: string;
    name: string;
    total_usage: number;
    subscription_plan: string;
  }[]> {
    const response = await api.get(`/analytics/top-users/?limit=${limit}`);
    return response.data;
  },
};

export default analyticsService;
