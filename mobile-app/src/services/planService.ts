import api, { getErrorMessage } from './api';
import { ENDPOINTS } from './config';

// Backend plan shape (different from the UI Plan type in types.ts)
export interface BackendPlan {
  id: number;
  name: string;
  plan_code: string;
  description: string;
  words_or_credits: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

// Alias for convenience
export type Plan = BackendPlan;

export interface BackendSubscription {
  id: number;
  plan: BackendPlan;
  price: number;
  credits_words: number;
  used_words: number;
  duration_type: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  expire_date: string;
  status: 'active' | 'inactive' | 'expired';
}

export const planService = {
  // Get all available plans
  async getPlans(): Promise<BackendPlan[]> {
    try {
      const response = await api.get(ENDPOINTS.PLANS);
      return response.data.results || response.data || [];
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Get user's current subscription
  async getCurrentSubscription(): Promise<BackendSubscription | null> {
    try {
      const response = await api.get('/plan/subscription/current/');
      return response.data;
    } catch (error) {
      console.warn('No active subscription:', getErrorMessage(error));
      return null;
    }
  },

  // Initiate Google Pay purchase
  async verifyGooglePurchase(planId: number, purchaseToken: string, productId: string): Promise<any> {
    try {
      const response = await api.post('/plan/checkout/google-pay/', {
        plan: planId,
        purchase_token: purchaseToken,
        product_id: productId,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
