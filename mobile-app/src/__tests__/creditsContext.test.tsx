import React from 'react';
import { AppState, Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';

const mockAsyncStorage = {
  getItem: jest.fn(),
};

const mockCreditsService = {
  getCreditBalance: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: (...args: unknown[]) => mockAsyncStorage.getItem(...args),
  },
  getItem: (...args: unknown[]) => mockAsyncStorage.getItem(...args),
}));

jest.mock('../services', () => ({
  creditsService: {
    getCreditBalance: (...args: unknown[]) => mockCreditsService.getCreditBalance(...args),
  },
  STORAGE_KEYS: {
    ACCESS_TOKEN: '@auth_access_token',
  },
}));

import { CreditsProvider, useCredits } from '../context/CreditsContext';

describe('CreditsContext', () => {
  let capturedContext: ReturnType<typeof useCredits> | undefined;
  let appStateListener: ((nextState: string) => void) | undefined;
  const originalError = console.error;

  const initialCredits = {
    credits: 30,
    total_credits: 30,
    bonus_credits: 0,
    usedWords: 3,
    isPro: false,
  };

  const Capture = () => {
    capturedContext = useCredits();
    return <Text>{capturedContext.isLoading ? 'loading' : String(capturedContext.credits?.credits ?? 0)}</Text>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    capturedContext = undefined;
    console.error = jest.fn();
    (AppState as any).currentState = 'active';
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener: any) => {
      appStateListener = listener;
      return { remove: jest.fn() } as any;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('throws when useCredits is called outside CreditsProvider', () => {
    expect(() => render(<Capture />)).toThrow('useCredits must be used within a CreditsProvider');
  });

  it('starts with no credits when there is no access token', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    const screen = render(
      <CreditsProvider>
        <Capture />
      </CreditsProvider>
    );

    await waitFor(() => expect(screen.getByText('0')).toBeTruthy(), { timeout: 5000 });
    expect(mockCreditsService.getCreditBalance).not.toHaveBeenCalled();
    expect(capturedContext?.credits).toBeNull();
  });

  it('loads credits on mount when the user is authenticated', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('access-token');
    mockCreditsService.getCreditBalance.mockResolvedValue(initialCredits);

    const screen = render(
      <CreditsProvider>
        <Capture />
      </CreditsProvider>
    );

    await waitFor(() => expect(screen.getByText('30')).toBeTruthy(), { timeout: 5000 });
    expect(capturedContext?.credits).toEqual(initialCredits);
  });

  it('does not refresh credits when no token exists', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    render(
      <CreditsProvider>
        <Capture />
      </CreditsProvider>
    );

    await waitFor(() => expect(capturedContext?.isLoading).toBe(false), { timeout: 5000 });
    await act(async () => {
      await capturedContext?.refreshCredits();
    });

    expect(mockCreditsService.getCreditBalance).not.toHaveBeenCalled();
  });

  it('reports whether the user has enough credits and refuses insufficient deductions', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('access-token');
    mockCreditsService.getCreditBalance.mockResolvedValue(initialCredits);

    render(
      <CreditsProvider>
        <Capture />
      </CreditsProvider>
    );

    await waitFor(() => expect(capturedContext?.credits?.credits).toBe(30));
    expect(capturedContext?.hasEnoughCredits(10)).toBe(true);
    expect(capturedContext?.hasEnoughCredits(31)).toBe(false);
    await expect(capturedContext?.deductCredits(50, 'Too expensive')).resolves.toBe(false);
  });

  it('deducts credits optimistically and then refreshes from the backend', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('access-token');
    mockCreditsService.getCreditBalance
      .mockResolvedValueOnce(initialCredits)
      .mockResolvedValueOnce({ ...initialCredits, credits: 18, total_credits: 18 });

    render(
      <CreditsProvider>
        <Capture />
      </CreditsProvider>
    );

    await waitFor(() => expect(capturedContext?.credits?.credits).toBe(30));
    await expect(capturedContext?.deductCredits(12, 'Image generation')).resolves.toBe(true);
    await waitFor(() => expect(capturedContext?.credits?.credits).toBe(18));
  });

  it('adds credits optimistically and then refreshes from the backend', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('access-token');
    mockCreditsService.getCreditBalance
      .mockResolvedValueOnce(initialCredits)
      .mockResolvedValueOnce({ ...initialCredits, credits: 55, total_credits: 55 });

    render(
      <CreditsProvider>
        <Capture />
      </CreditsProvider>
    );

    await waitFor(() => expect(capturedContext?.credits?.credits).toBe(30));
    await act(async () => {
      await capturedContext?.addCredits(25, 'Purchase');
    });

    await waitFor(() => expect(capturedContext?.credits?.credits).toBe(55));
  });

  it('refreshes credits when the app returns to the foreground', async () => {
    (AppState as any).currentState = 'background';
    mockAsyncStorage.getItem.mockResolvedValue('access-token');
    mockCreditsService.getCreditBalance
      .mockResolvedValueOnce(initialCredits)
      .mockResolvedValueOnce({ ...initialCredits, credits: 42, total_credits: 42 });

    render(
      <CreditsProvider>
        <Capture />
      </CreditsProvider>
    );

    await waitFor(() => expect(capturedContext?.credits?.credits).toBe(30));
    await act(async () => {
      appStateListener?.('active');
    });

    await waitFor(() => expect(capturedContext?.credits?.credits).toBe(42));
  });

  it('rate-limits the post-login sync effect when credit refresh keeps failing', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);
    mockAsyncStorage.getItem.mockResolvedValue('access-token');
    mockCreditsService.getCreditBalance.mockRejectedValue(new Error('API down'));

    render(
      <CreditsProvider>
        <Capture />
      </CreditsProvider>
    );

    await waitFor(() => expect(capturedContext?.isLoading).toBe(false));
    expect(mockCreditsService.getCreditBalance.mock.calls.length).toBeLessThanOrEqual(2);
    nowSpy.mockRestore();
  });
});