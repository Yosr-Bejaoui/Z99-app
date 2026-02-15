import apiClient from './client';
import { ENDPOINTS } from './config';

export interface UserProfile {
  id: number;
  user: number;
  user_details: {
    id: number;
    username: string;
    email: string;
    total_token_used: number;
    words: number;
  };
  first_name: string;
  last_name: string;
  avatar: string | null;
}

export interface CreditAccount {
  credits_balance: number;
  total_token_used: number;
  subscribed: boolean;
}

export interface Transaction {
  id: number;
  amount: number;
  transaction_type: string;
  message: string;
  created_at: string;
}

export interface Plan {
  id: number;
  name: string;
  plan_code: string;
  description: string;
  words_or_credits: number;
  amount: number;
}

export interface Reward {
  id: number;
  reward: number;
  created_at: string;
}

export interface Invoice {
  id: number;
  amount: number;
  status: string;
  created_at: string;
  plan?: Plan;
}

export const profileService = {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile[]> {
    return apiClient.request(ENDPOINTS.profile);
  },

  /**
   * Update user profile
   */
  async updateProfile(
    profileId: number,
    data: { first_name?: string; last_name?: string }
  ): Promise<UserProfile> {
    return apiClient.request(`${ENDPOINTS.profile}${profileId}/`, {
      method: 'PATCH',
      body: data,
    });
  },

  /**
   * Update profile avatar
   */
  async updateAvatar(profileId: number, avatarUri: string): Promise<UserProfile> {
    const formData = new FormData();
    const filename = avatarUri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('avatar', {
      uri: avatarUri,
      name: filename,
      type,
    } as any);

    return apiClient.uploadFile(`${ENDPOINTS.profile}${profileId}/`, formData);
  },

  /**
   * Get credit account info
   */
  async getCreditAccount(): Promise<CreditAccount> {
    return apiClient.request(ENDPOINTS.creditAccount);
  },

  /**
   * Get transaction history
   */
  async getTransactions(): Promise<Transaction[]> {
    return apiClient.request(ENDPOINTS.transactions);
  },

  /**
   * Get available plans
   */
  async getPlans(): Promise<Plan[]> {
    return apiClient.request(ENDPOINTS.plans);
  },

  /**
   * Verify Google Play purchase
   */
  async verifyGooglePurchase(
    planId: number,
    purchaseToken: string
  ): Promise<{ status: string; credits_added: number }> {
    return apiClient.request(ENDPOINTS.googlePurchase, {
      method: 'POST',
      body: {
        plan: planId,
        purchase_token: purchaseToken,
      },
    });
  },

  /**
   * Get rewards history
   */
  async getRewards(): Promise<Reward[]> {
    return apiClient.request(ENDPOINTS.rewards);
  },

  /**
   * Add reward (from watching ads, etc.)
   */
  async addReward(amount: number): Promise<Reward> {
    return apiClient.request(ENDPOINTS.rewards, {
      method: 'POST',
      body: { reward: amount },
    });
  },

  /**
   * Get invoices
   */
  async getInvoices(): Promise<Invoice[]> {
    return apiClient.request(ENDPOINTS.invoices);
  },
};

export default profileService;
