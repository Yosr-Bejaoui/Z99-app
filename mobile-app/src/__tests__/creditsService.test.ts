const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
};

const mockGetErrorMessage = jest.fn((error: unknown) =>
  error instanceof Error ? error.message : 'Unknown API error'
);

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => mockApi.get(...args),
    post: (...args: unknown[]) => mockApi.post(...args),
  },
  get: (...args: unknown[]) => mockApi.get(...args),
  post: (...args: unknown[]) => mockApi.post(...args),
  getErrorMessage: (...args: unknown[]) => mockGetErrorMessage(...args),
}));

import { creditsService } from '../services/creditsService';

describe('creditsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetErrorMessage.mockImplementation((error: unknown) =>
      error instanceof Error ? error.message : 'Unknown API error'
    );
  });

  describe('getCreditBalance', () => {
    it('normalizes array-shaped balance payloads into the frontend credit model', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: [{ credit_balance: '150', bonus_credits: 25, used_words: 9, is_pro: true }],
      });

      await expect(creditsService.getCreditBalance()).resolves.toEqual({
        credits: 150,
        total_credits: 175,
        bonus_credits: 25,
        usedWords: 9,
        isPro: true,
      });
      expect(mockApi.get).toHaveBeenCalledWith('/accounts/credit-account/');
    });

    it('reads paginated result payloads and coerces invalid balances to zero', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { results: [{ balance: 'not-a-number', words_used: 3, subscription_active: false }] },
      });

      await expect(creditsService.getCreditBalance()).resolves.toEqual({
        credits: 0,
        total_credits: 0,
        bonus_credits: 0,
        usedWords: 3,
        isPro: false,
      });
    });

    it('rethrows formatted API errors when loading the balance fails', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Balance unavailable'));

      await expect(creditsService.getCreditBalance()).rejects.toThrow('Balance unavailable');
      expect(mockGetErrorMessage).toHaveBeenCalled();
    });
  });

  describe('getTransactions', () => {
    it('wraps plain arrays into a paginated transaction response and normalizes the transaction type', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            type: 'credit_purchase',
            amount: 25,
            description: 'Starter pack',
            created_at: '2026-03-10T00:00:00Z',
          },
          {
            id: 2,
            type: 'ad_reward',
            amount: 5,
            reason: 'Rewarded ad',
            created_at: '2026-03-10T00:00:00Z',
          },
        ],
      });

      await expect(creditsService.getTransactions(2, 10)).resolves.toEqual({
        count: 2,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            type: 'credit',
            amount: 25,
            description: 'Starter pack',
            created_at: '2026-03-10T00:00:00Z',
            status: 'completed',
            reference_id: undefined,
          },
          {
            id: 2,
            type: 'reward',
            amount: 5,
            description: 'Rewarded ad',
            created_at: '2026-03-10T00:00:00Z',
            status: 'completed',
            reference_id: undefined,
          },
        ],
      });
      expect(mockApi.get).toHaveBeenCalledWith('/accounts/transactions/', {
        params: { page: 2, page_size: 10 },
      });
    });

    it('normalizes paginated debit, refund, and subscription transactions', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          count: 3,
          next: 'next-page',
          previous: null,
          results: [
            {
              id: 3,
              transaction_type: 'deduct',
              amount: -7,
              description: 'Image generation',
              created_at: '2026-03-10T00:00:00Z',
              transaction_id: 'tx-3',
            },
            {
              id: 4,
              type: 'refund_request',
              amount: 4,
              created_at: '2026-03-11T00:00:00Z',
            },
            {
              id: 5,
              type: 'subscription_renewal',
              credits: 99,
              created_at: '2026-03-12T00:00:00Z',
            },
          ],
        },
      });

      const result = await creditsService.getTransactions();

      expect(result).toEqual({
        count: 3,
        next: 'next-page',
        previous: null,
        results: [
          {
            id: 3,
            type: 'debit',
            amount: 7,
            description: 'Image generation',
            created_at: '2026-03-10T00:00:00Z',
            status: 'completed',
            reference_id: 'tx-3',
          },
          {
            id: 4,
            type: 'refund',
            amount: 4,
            description: 'Transaction',
            created_at: '2026-03-11T00:00:00Z',
            status: 'completed',
            reference_id: undefined,
          },
          {
            id: 5,
            type: 'subscription',
            amount: 99,
            description: 'Transaction',
            created_at: '2026-03-12T00:00:00Z',
            status: 'completed',
            reference_id: undefined,
          },
        ],
      });
    });

    it('rethrows a formatted error when transaction loading fails', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Transactions unavailable'));

      await expect(creditsService.getTransactions()).rejects.toThrow('Transactions unavailable');
    });
  });

  describe('getCreditPackages', () => {
    it('maps backend plans into credit package cards', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          results: [
            {
              id: 11,
              plan_name: 'Pro Pack',
              words_or_credits: 1000,
              amount: '19.99',
              currency: 'EUR',
              bonus_credits: 100,
              description: 'Best seller',
              is_popular: true,
            },
          ],
        },
      });

      await expect(creditsService.getCreditPackages()).resolves.toEqual([
        {
          id: 11,
          name: 'Pro Pack',
          credits: 1000,
          price: 19.99,
          currency: 'EUR',
          bonus_credits: 100,
          description: 'Best seller',
          featured: true,
          best_value: true,
        },
      ]);
    });

    it('returns an empty array when package loading fails', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Plans unavailable'));

      await expect(creditsService.getCreditPackages()).resolves.toEqual([]);
    });
  });

  describe('purchase methods', () => {
    it('verifies Google Pay purchases and normalizes the response payload', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { transaction_id: 'google-1', credit_balance: 240, message: 'Paid' },
      });

      await expect(creditsService.purchaseWithGooglePay(7, 'google-token')).resolves.toEqual({
        success: true,
        transaction_id: 'google-1',
        new_balance: 240,
        message: 'Paid',
      });
      expect(mockApi.post).toHaveBeenCalledWith('/accounts/purchase-credits/google-pay/', {
        package_id: 7,
        payment_token: 'google-token',
      });
    });

    it('verifies Apple Pay purchases', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { transaction_id: 'apple-1', new_balance: 300 },
      });

      await expect(creditsService.purchaseWithApplePay(8, 'apple-token')).resolves.toEqual({
        success: true,
        transaction_id: 'apple-1',
        new_balance: 300,
        message: undefined,
      });
    });

    it('verifies Stripe purchases', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { transaction_id: 'stripe-1', new_balance: 500, message: 'Complete' },
      });

      await expect(creditsService.purchaseWithStripe(9, 'pm_123')).resolves.toEqual({
        success: true,
        transaction_id: 'stripe-1',
        new_balance: 500,
        message: 'Complete',
      });
    });

    it('rethrows formatted purchase errors', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Payment provider unavailable'));

      await expect(creditsService.purchaseWithGooglePay(7, 'bad-token')).rejects.toThrow('Payment provider unavailable');
    });
  });

  describe('redeemPromoCode', () => {
    it('returns the added credits and backend message on success', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { credits_added: 45, message: 'Promo applied' },
      });

      await expect(creditsService.redeemPromoCode('SPRING45')).resolves.toEqual({
        credits: 45,
        message: 'Promo applied',
      });
    });

    it('returns a feature-flag message when the backend responds with 404', async () => {
      mockApi.post.mockRejectedValueOnce({ response: { status: 404 } });

      await expect(creditsService.redeemPromoCode('NOTREADY')).rejects.toThrow('Promo code feature is not available yet.');
    });

    it('rethrows formatted promo-code errors for all other failures', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Promo code expired'));

      await expect(creditsService.redeemPromoCode('EXPIRED')).rejects.toThrow('Promo code expired');
    });
  });

  describe('getUsageStats', () => {
    it('computes today, week, month, and total debit usage from transaction history', async () => {
      const now = new Date('2026-03-14T12:00:00Z');
      jest.useFakeTimers().setSystemTime(now);
      mockApi.get.mockResolvedValueOnce({
        data: [
          { amount: -3, type: 'debit', created_at: '2026-03-14T10:00:00Z' },
          { amount: -4, transaction_type: 'deduct', created_at: '2026-03-10T10:00:00Z' },
          { amount: -8, type: 'debit', date: '2026-02-20T10:00:00Z' },
          { amount: 100, type: 'credit', created_at: '2026-03-14T10:00:00Z' },
        ],
      });

      await expect(creditsService.getUsageStats()).resolves.toEqual({
        today_used: 3,
        week_used: 7,
        month_used: 15,
        total_used: 15,
      });
      jest.useRealTimers();
    });

    it('returns zeroed usage stats when the request fails', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Usage unavailable'));

      await expect(creditsService.getUsageStats()).resolves.toEqual({
        today_used: 0,
        week_used: 0,
        month_used: 0,
        total_used: 0,
      });
    });
  });
});
