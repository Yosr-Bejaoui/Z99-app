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
    revenue_total?: number;
    revenue_growth: number;
    churn_rate?: number;
  };
  usage: {
    total_sessions: number;
    total_messages: number;
    total_chats?: number;
    total_images?: number;
    total_words?: number;
    sessions_today?: number;
    active_sessions_today?: number;
  };
  models: {
    total: number;
    active: number;
    most_used: string;
  };
}

export interface UsageData {
  date: string;
  sessions: number;
  messages: number;
  chats?: number;
  images?: number;
  words?: number;
}

export interface RevenueData {
  date: string;
  amount: number;
  subscriptions?: number;
}

export interface UserGrowthData {
  date: string;
  total_users: number;
  new_users: number;
}

export const analyticsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/accounts/analytics/dashboard/');
    // Normalize response to handle both old and new field names
    const data = response.data;
    return {
      ...data,
      usage: {
        ...data.usage,
        total_chats: data.usage.total_sessions || data.usage.total_chats || 0,
        total_images: data.usage.total_images || 0,
        total_words: data.usage.total_words || 0,
        total_sessions: data.usage.total_sessions || 0,
        total_messages: data.usage.total_messages || 0,
      }
    };
  },

  async getUsageAnalytics(days: number = 30): Promise<UsageData[]> {
    const response = await api.get<UsageData[]>(`/accounts/analytics/usage/?days=${days}`);
    // Normalize response to ensure consistent field names
    return (response.data || []).map(item => ({
      date: item.date,
      sessions: item.sessions || item.chats || 0,
      messages: item.messages || 0,
      chats: item.sessions || item.chats || 0,
      images: item.images || 0,
      words: item.words || 0,
    }));
  },

  async getRevenueAnalytics(days: number = 30): Promise<RevenueData[]> {
    const response = await api.get<RevenueData[]>(`/accounts/analytics/revenue/?days=${days}`);
    return response.data || [];
  },

  async getUserGrowthAnalytics(days: number = 30): Promise<UserGrowthData[]> {
    const response = await api.get<UserGrowthData[]>(`/accounts/analytics/user-growth/?days=${days}`);
    return response.data || [];
  },

  async getModelUsageStats(): Promise<{
    model_name: string;
    usage_count: number;
    percentage: number;
  }[]> {
    const response = await api.get('/accounts/analytics/model-usage/');
    const data = response.data || [];
    // Normalize response to consistent field names
    return data.map((item: { name?: string; model_name?: string; usage_count?: number; percentage?: number }) => ({
      model_name: item.name || item.model_name || 'Unknown',
      usage_count: item.usage_count || 0,
      percentage: item.percentage || 0,
    }));
  },

  async getTopUsers(limit: number = 10): Promise<{
    id: number;
    email: string;
    name: string;
    total_usage: number;
    subscription_plan: string;
  }[]> {
    const response = await api.get(`/accounts/analytics/top-users/?limit=${limit}`);
    return response.data;
  },
};

export default analyticsService;
