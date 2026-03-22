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

import { planService } from '../services/planService';
import { ENDPOINTS } from '../services/config';

describe('planService', () => {
  const originalWarn = console.warn;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetErrorMessage.mockImplementation((error: unknown) =>
      error instanceof Error ? error.message : 'Unknown API error'
    );
    console.warn = jest.fn();
  });

  afterAll(() => {
    console.warn = originalWarn;
  });

  it('returns plans from paginated backend responses', async () => {
    const plans = [{ id: 1, name: 'Starter' }, { id: 2, name: 'Pro' }];
    mockApi.get.mockResolvedValueOnce({ data: { results: plans } });

    await expect(planService.getPlans()).resolves.toEqual(plans);
    expect(mockApi.get).toHaveBeenCalledWith(ENDPOINTS.PLANS);
  });

  it('returns plans from bare array responses', async () => {
    const plans = [{ id: 3, name: 'Enterprise' }];
    mockApi.get.mockResolvedValueOnce({ data: plans });

    await expect(planService.getPlans()).resolves.toEqual(plans);
  });

  it('rethrows readable plan-loading failures', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('Plans unavailable'));

    await expect(planService.getPlans()).rejects.toThrow('Plans unavailable');
  });

  it('returns the current subscription when the backend provides one', async () => {
    const subscription = { id: 11, status: 'active' };
    mockApi.get.mockResolvedValueOnce({ data: subscription });

    await expect(planService.getCurrentSubscription()).resolves.toEqual(subscription);
    expect(mockApi.get).toHaveBeenCalledWith('/plan/subscription/current/');
  });

  it('returns null when there is no active subscription', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('404 Not Found'));

    await expect(planService.getCurrentSubscription()).resolves.toBeNull();
    expect(console.warn).toHaveBeenCalledWith('No active subscription:', '404 Not Found');
  });

  it('verifies a Google purchase token against the backend', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { ok: true, credits: 500 } });

    await expect(planService.verifyGooglePurchase('purchase-token', 'plan.pro')).resolves.toEqual({ ok: true, credits: 500 });
    expect(mockApi.post).toHaveBeenCalledWith('/plan/checkout/google-pay/', {
      purchase_token: 'purchase-token',
      product_id: 'plan.pro',
    });
  });

  it('rethrows readable Google purchase verification errors', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('Purchase verification failed'));

    await expect(planService.verifyGooglePurchase('bad-token', 'plan.pro')).rejects.toThrow('Purchase verification failed');
  });
});