import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockNavigation = {
  goBack: jest.fn(),
};

const mockGetPlans = jest.fn();

const mockT = (key: string, options?: Record<string, unknown>) => {
  if (key === 'subscription.cta.planSummary') {
    return `${options?.name}:${options?.amount}`;
  }
  if (key === 'subscription.credits') {
    return `${options?.count} credits`;
  }
  return key;
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
}));

jest.mock('../services/planService', () => ({
  __esModule: true,
  planService: {
    getPlans: (...args: unknown[]) => mockGetPlans(...args),
  },
  Plan: {},
}));

jest.mock('../components/GlassCard', () => {
  const React = require('react');
  const { View } = require('react-native');

  return ({ children }: any) => <View>{children}</View>;
});

jest.mock('../components/GradientButton', () => {
  const React = require('react');
  const { Text, TouchableOpacity } = require('react-native');

  return ({ title, onPress }: any) => (
    <TouchableOpacity onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

import SubscriptionPlansScreen from '../screens/SubscriptionPlansScreen';

describe('SubscriptionPlansScreen', () => {
  const plans = [
    { id: 1, name: 'Starter', amount: 9.99, words_or_credits: 5000, description: 'Starter tier' },
    { id: 2, name: 'Pro', amount: 19.99, words_or_credits: 150000, description: 'Best choice' },
    { id: 3, name: 'Enterprise', amount: 39.99, words_or_credits: 600000, description: 'Top tier' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    jest.spyOn(console, 'error').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('loads plans and preselects the middle plan in the CTA summary', async () => {
    mockGetPlans.mockResolvedValueOnce(plans);
    const screen = render(<SubscriptionPlansScreen />);

    await waitFor(() => expect(screen.getByText('Pro:19.99')).toBeTruthy(), { timeout: 5000 });
  });

  it('updates the selected plan when the user taps a different option', async () => {
    mockGetPlans.mockResolvedValueOnce(plans);
    const screen = render(<SubscriptionPlansScreen />);

    await waitFor(() => expect(screen.getByText('Pro:19.99')).toBeTruthy(), { timeout: 5000 });
    fireEvent.press(screen.getByText('Enterprise'));

    expect(screen.getByText('Enterprise:39.99')).toBeTruthy();
  });

  it('shows a coming-soon alert instead of attempting an insecure fake purchase', async () => {
    mockGetPlans.mockResolvedValueOnce(plans);
    const screen = render(<SubscriptionPlansScreen />);

    await waitFor(() => expect(screen.getByText('subscription.cta.subscribeNow')).toBeTruthy(), { timeout: 5000 });
    fireEvent.press(screen.getByText('subscription.cta.subscribeNow'));

    expect(Alert.alert).toHaveBeenCalledWith('subscription.comingSoon.title', 'subscription.comingSoon.message');
  });

  it('shows the empty state when the backend returns no plans', async () => {
    mockGetPlans.mockResolvedValueOnce([]);
    const screen = render(<SubscriptionPlansScreen />);

    await waitFor(() => expect(screen.getByText('subscription.emptyState.title')).toBeTruthy(), { timeout: 5000 });
    expect(screen.getByText('subscription.emptyState.subtitle')).toBeTruthy();
  });

  it('alerts the user when plan loading fails', async () => {
    mockGetPlans.mockRejectedValueOnce(new Error('Plan endpoint unavailable'));
    const screen = render(<SubscriptionPlansScreen />);

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith(
      'subscription.purchase.error',
      'subscription.purchase.errorMessage'
    ));
    expect(screen.getByText('subscription.emptyState.title')).toBeTruthy();
  });
});