import { creditsService } from '../services/creditsService';
import api from '../services/api';

// Mock the API
jest.mock('../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('Credits Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCreditBalance', () => {
    it('should fetch credit balance from user profile', async () => {
      const mockData = {
        credits_balance: 1500,
        used_words: 5000,
        is_pro: false,
      };

      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

      const result = await creditsService.getCreditBalance();

      expect(api.get).toHaveBeenCalledWith('/accounts/profile/');
      expect(result.credits).toBe(1500);
      expect(result.usedWords).toBe(5000);
    });

    it('should handle API error gracefully', async () => {
      (api.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(creditsService.getCreditBalance()).rejects.toThrow('Network error');
    });
  });

  describe('getTransactions', () => {
    it('should fetch transaction history', async () => {
      const mockData = {
        results: [
          { id: 1, amount: 100, type: 'credit', description: 'Purchase' },
          { id: 2, amount: -50, type: 'debit', description: 'Generation' },
        ],
      };

      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

      const result = await creditsService.getTransactions();

      expect(api.get).toHaveBeenCalledWith('/accounts/transactions/');
      expect(result).toHaveLength(2);
    });
  });

  describe('redeemPromoCode', () => {
    it('should redeem a valid promo code', async () => {
      const mockData = {
        success: true,
        credits_added: 500,
        message: 'Code redeemed successfully!',
      };

      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockData });

      const result = await creditsService.redeemPromoCode('TESTCODE123');

      expect(api.post).toHaveBeenCalledWith('/accounts/redeem-code/', {
        code: 'TESTCODE123',
      });
      expect(result.credits).toBe(500);
      expect(result.message).toBeDefined();
    });

    it('should handle invalid promo code', async () => {
      const errorResponse = {
        response: {
          data: { message: 'Invalid or expired promo code' },
        },
      };

      (api.post as jest.Mock).mockRejectedValueOnce(errorResponse);

      await expect(creditsService.redeemPromoCode('INVALID')).rejects.toThrow();
    });
  });

  describe('getCreditPackages', () => {
    it('should fetch available credit packages', async () => {
      const mockData = [
        { id: 1, credits: 100, price: 4.99 },
        { id: 2, credits: 500, price: 19.99 },
        { id: 3, credits: 1000, price: 34.99 },
      ];

      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

      const result = await creditsService.getCreditPackages();

      expect(api.get).toHaveBeenCalledWith('/plans/credit-packages/');
      expect(result).toHaveLength(3);
    });
  });
});
