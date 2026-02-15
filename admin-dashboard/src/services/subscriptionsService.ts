import api from './api';

export interface Plan {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration_days: number;
  word_limit: number;
  image_limit: number;
  features: string[];
  is_active: boolean;
  stripe_price_id?: string;
  created_at: string;
}

export interface Subscription {
  id: number;
  user: {
    id: number;
    email: string;
    name: string;
  };
  plan: Plan;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  stripe_subscription_id?: string;
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
    const response = await api.get<Plan[]>('/plan/plans/');
    return response.data;
  },

  async getPlan(id: number): Promise<Plan> {
    const response = await api.get<Plan>(`/plan/plans/${id}/`);
    return response.data;
  },

  async createPlan(data: Partial<Plan>): Promise<Plan> {
    const response = await api.post<Plan>('/plan/admin/plans/', data);
    return response.data;
  },

  async updatePlan(id: number, data: Partial<Plan>): Promise<Plan> {
    const response = await api.patch<Plan>(`/plan/admin/plans/${id}/`, data);
    return response.data;
  },

  async deletePlan(id: number): Promise<void> {
    await api.delete(`/plan/admin/plans/${id}/`);
  },

  // Subscriptions
  async getSubscriptions(page: number = 1, status?: string): Promise<SubscriptionsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (status) params.append('status', status);
    
    const response = await api.get<SubscriptionsResponse>(`/plan/admin/subscriptions/?${params.toString()}`);
    return response.data;
  },

  async getSubscription(id: number): Promise<Subscription> {
    const response = await api.get<Subscription>(`/plan/admin/subscriptions/${id}/`);
    return response.data;
  },

  async cancelSubscription(id: number): Promise<Subscription> {
    const response = await api.post<Subscription>(`/plan/admin/subscriptions/${id}/cancel/`);
    return response.data;
  },

  async getSubscriptionStats(): Promise<{
    total_subscriptions: number;
    active_subscriptions: number;
    cancelled_subscriptions: number;
    revenue_this_month: number;
    by_plan: Record<string, number>;
  }> {
    const response = await api.get('/plan/admin/stats/');
    return response.data;
  },
};

export default subscriptionsService;
