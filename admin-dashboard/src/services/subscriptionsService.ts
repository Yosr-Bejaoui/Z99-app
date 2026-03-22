import api from './api';

export interface Plan {
  id: number;
  name: string;
  plan_code: string;
  description?: string;
  words_or_credits: number;
  amount: number;
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface Subscription {
  id: number;
  user_details?: {
    id: number;
    email: string;
    username: string;
  };
  plan_details?: Plan;
  status: 'active' | 'cancelled' | 'expired' | 'inactive';
  start_date: string;
  expire_date: string;
  price: number;
  credits_words: number;
  used_words: number;
  duration_type: string;
  created_at: string;
}

export interface PlansResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Plan[];
}

export interface SubscriptionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Subscription[];
}

export const subscriptionsService = {
  // Plans
  async getPlans(): Promise<Plan[]> {
    const response = await api.get<Plan[] | PlansResponse>('/plan/list/');
    // Handle both array and paginated response
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  },

  async getPlan(id: number): Promise<Plan> {
    const response = await api.get<Plan>(`/plan/list/${id}/`);
    return response.data;
  },

  async createPlan(data: Partial<Plan>): Promise<Plan> {
    const response = await api.post<Plan>('/plan/list/', data);
    return response.data;
  },

  async updatePlan(id: number, data: Partial<Plan>): Promise<Plan> {
    const response = await api.patch<Plan>(`/plan/list/${id}/`, data);
    return response.data;
  },

  async deletePlan(id: number): Promise<void> {
    await api.delete(`/plan/list/${id}/`);
  },

  // Revenue
  async getRevenue(): Promise<{ revenue: number }> {
    const response = await api.get<{ revenue: number }>('/plan/revenue/');
    return response.data;
  },

  // Admin Revenue Analytics
  async getAdminRevenue(): Promise<{
    total_revenue: number;
    today_revenue: number;
    week_revenue: number;
    month_revenue: number;
  }> {
    const response = await api.get('/plan/admin/revenue/');
    return response.data.data || response.data;
  },

  // Subscriptions - Using admin subscriptions endpoint
  async getSubscriptions(page: number = 1, status?: string): Promise<SubscriptionsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (status && status !== 'all') params.append('status', status);

    const response = await api.get<{ results?: Subscription[]; count?: number } | Subscription[]>(
      `/plan/admin/subscriptions/?${params.toString()}`
    );

    // Handle both paginated and non-paginated responses
    if (Array.isArray(response.data)) {
      return {
        count: response.data.length,
        next: null,
        previous: null,
        results: response.data,
      };
    }
    return {
      count: response.data.count || 0,
      next: null,
      previous: null,
      results: response.data.results || [],
    };
  },

  async cancelSubscription(id: number): Promise<Subscription> {
    const response = await api.post<{ data: Subscription }>(`/plan/admin/subscriptions/${id}/cancel/`);
    return response.data.data || response.data;
  },

  async extendSubscription(id: number, days: number): Promise<Subscription> {
    const response = await api.post<{ data: Subscription }>(
      `/plan/admin/subscriptions/${id}/extend/`,
      { days }
    );
    return response.data.data || response.data;
  },

  async getSubscriptionStats(): Promise<{
    total_subscriptions: number;
    active_subscriptions: number;
    cancelled_subscriptions: number;
    revenue_this_month: number;
    by_plan: Record<string, number>;
  }> {
    const response = await api.get('/plan/admin/subscriptions/stats/');
    const data = response.data.data || response.data;
    return {
      total_subscriptions: data.total_subscriptions || 0,
      active_subscriptions: data.active_subscriptions || 0,
      cancelled_subscriptions: data.cancelled_subscriptions || 0,
      revenue_this_month: data.total_revenue || 0,
      by_plan: data.by_plan || {},
    };
  },

  async getExpiringSubscriptions(days: number = 7): Promise<Subscription[]> {
    const response = await api.get(`/plan/admin/subscriptions/expiring/?days=${days}`);
    return response.data.data || response.data;
  },
};

export default subscriptionsService;
