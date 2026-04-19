import api, { getErrorMessage } from './api';
import type { CreditAccount, CreditPackage, Transaction } from './types';

export type { CreditAccount, CreditPackage, Transaction };

export interface TransactionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Transaction[];
}

export interface PurchaseResult {
  success: boolean;
  transaction_id: string;
  new_balance: number;
  message?: string;
}

export const creditsService = {
  /**
   * Get user's credit account balance
   */
  async getCreditBalance(): Promise<CreditAccount> {
    try {
      const response = await api.get('/accounts/credit-account/');
      const raw = response.data;
      const data = Array.isArray(raw)
        ? raw[0] || {}
        : (raw?.results && Array.isArray(raw.results) ? raw.results[0] || {} : raw || {});
      const parsedCredits = Number(
        data.credits ?? data.credit_balance ?? data.balance ?? data.words ?? 0
      );
      
      return {
        credits: Number.isFinite(parsedCredits) ? parsedCredits : 0,
        total_credits: (Number.isFinite(parsedCredits) ? parsedCredits : 0) + (data.bonus_credits || 0),
        bonus_credits: data.bonus_credits || 0,
        usedWords: data.used_words || data.words_used || 0,
        isPro: data.is_pro || data.subscription_active || false,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get transaction history
   */
  async getTransactions(page: number = 1, pageSize: number = 20): Promise<TransactionsResponse> {
    try {
      const response = await api.get('/accounts/transactions/', {
        params: { page, page_size: pageSize },
      });
      
      const data = response.data;
      
      if (Array.isArray(data)) {
        return {
          count: data.length,
          next: null,
          previous: null,
          results: data.map(transformTransaction),
        };
      }
      
      return {
        count: data.count || 0,
        next: data.next,
        previous: data.previous,
        results: (data.results || []).map(transformTransaction),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get available credit packages (derived from plans)
   */
  async getCreditPackages(): Promise<CreditPackage[]> {
    try {
      const response = await api.get('/plan/list/');
      const data = response.data;
      
      const packages = Array.isArray(data) ? data : data.results || [];
      return packages.map((pkg: any) => ({
        id: pkg.id,
        name: pkg.name || pkg.plan_name || 'Credit Package',
        credits: pkg.words_or_credits || pkg.credits || 0,
        price: parseFloat(pkg.amount || pkg.price) || 0,
        currency: pkg.currency || 'USD',
        bonus_credits: pkg.bonus_credits || 0,
        description: pkg.description,
        featured: pkg.featured || pkg.is_popular || false,
        best_value: pkg.best_value || pkg.is_popular || false,
      }));
    } catch (error) {
      return [];
    }
  },

  /**
   * Purchase credits with Google Pay
   */
  async purchaseWithGooglePay(packageId: number, paymentToken: string): Promise<PurchaseResult> {
    try {
      const response = await api.post('/accounts/purchase-credits/google-pay/', {
        package_id: packageId,
        payment_token: paymentToken,
      });
      
      return {
        success: true,
        transaction_id: response.data.transaction_id,
        new_balance: response.data.new_balance || response.data.credit_balance,
        message: response.data.message,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Purchase credits with Apple Pay
   */
  async purchaseWithApplePay(packageId: number, paymentToken: string): Promise<PurchaseResult> {
    try {
      const response = await api.post('/accounts/purchase-credits/apple-pay/', {
        package_id: packageId,
        payment_token: paymentToken,
      });
      
      return {
        success: true,
        transaction_id: response.data.transaction_id,
        new_balance: response.data.new_balance || response.data.credit_balance,
        message: response.data.message,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Purchase credits with Stripe
   */
  async purchaseWithStripe(packageId: number, paymentMethodId: string): Promise<PurchaseResult> {
    try {
      const response = await api.post('/accounts/purchase-credits/stripe/', {
        package_id: packageId,
        payment_method_id: paymentMethodId,
      });
      
      return {
        success: true,
        transaction_id: response.data.transaction_id,
        new_balance: response.data.new_balance || response.data.credit_balance,
        message: response.data.message,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Redeem a promo code
   */
  async redeemPromoCode(code: string): Promise<{credits: number; message: string}> {
    try {
      const response = await api.post('/accounts/redeem-code/', { code });
      return {
        credits: response.data.credits_added || response.data.credits || 0,
        message: response.data.message || 'Credits added successfully',
      };
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new Error('Promo code feature is not available yet.');
      }
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get usage statistics (computed from transactions)
   */
  async getUsageStats(): Promise<{
    today_used: number;
    week_used: number;
    month_used: number;
    total_used: number;
  }> {
    try {
      let allTransactions: any[] = [];
      let url = '/accounts/transactions/';
      let pagesFetched = 0;
      const MAX_PAGES = 20;

      while (url && pagesFetched < MAX_PAGES) {
        // Use relative URL to avoid origin issues if backend returns full URL
        if (url.startsWith('http')) {
          const urlObj = new URL(url);
          url = urlObj.pathname + urlObj.search;
        }

        const response = await api.get(url);
        
        if (Array.isArray(response.data)) {
          allTransactions = allTransactions.concat(response.data);
          url = '';
        } else {
          allTransactions = allTransactions.concat(response.data.results || []);
          url = response.data.next || '';
        }
        pagesFetched++;
      }
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(todayStart);
      monthStart.setDate(monthStart.getDate() - 30);

      let today_used = 0, week_used = 0, month_used = 0, total_used = 0;

      for (const tx of allTransactions) {
        const amount = Math.abs(tx.amount || 0);
        const isDebit = (tx.transaction_type === 'deduct' || tx.transaction_type === 'debit' || tx.type === 'debit' || tx.amount < 0);
        if (!isDebit) continue;
        
        const txDate = new Date(tx.created_at || tx.date);
        total_used += amount;
        if (txDate >= monthStart) month_used += amount;
        if (txDate >= weekStart) week_used += amount;
        if (txDate >= todayStart) today_used += amount;
      }

      return { today_used, week_used, month_used, total_used };
    } catch (error) {
      console.warn('Failed to fetch complete usage stats: ', error);
      return { today_used: 0, week_used: 0, month_used: 0, total_used: 0 };
    }
  }
};

function transformTransaction(data: any): Transaction {
  let type: Transaction['type'] = 'debit';
  if (data.type?.toLowerCase().includes('credit') || data.amount > 0) {
    type = 'credit';
  }
  if (data.type?.toLowerCase().includes('refund')) {
    type = 'refund';
  }
  if (data.type?.toLowerCase().includes('reward') || data.type?.toLowerCase().includes('ad')) {
    type = 'reward';
  }
  if (data.type?.toLowerCase().includes('subscription')) {
    type = 'subscription';
  }

  return {
    id: data.id,
    type,
    amount: Math.abs(data.amount || data.credits || 0),
    description: data.description || data.reason || 'Transaction',
    created_at: data.created_at,
    status: data.status || 'completed',
    reference_id: data.reference_id || data.transaction_id,
  };
}

export default creditsService;
