import React from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockAuthService = {
  activateAccount: jest.fn(),
};

const mockApi = {
  post: jest.fn(),
};

jest.mock('../services', () => ({
  authService: {
    activateAccount: (...args: unknown[]) => mockAuthService.activateAccount(...args),
  },
}));

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    post: (...args: unknown[]) => mockApi.post(...args),
  },
  post: (...args: unknown[]) => mockApi.post(...args),
}));

jest.mock('../components/GradientButton', () => {
  const React = require('react');
  const { Text, TouchableOpacity } = require('react-native');

  return ({ title, onPress, disabled }: any) => (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

jest.mock('../components/GlassCard', () => {
  const React = require('react');
  const { View } = require('react-native');

  return ({ children }: any) => <View>{children}</View>;
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

import OTPVerificationScreen from '../screens/OTPVerificationScreen';

describe('OTPVerificationScreen', () => {
  const navigation = {
    goBack: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const renderScreen = () =>
    render(
      <OTPVerificationScreen
        navigation={navigation as any}
        route={{ params: { email: 'ada@example.com' } } as any}
      />
    );

  it('shows a validation error when the verification code is incomplete', async () => {
    const screen = renderScreen();

    fireEvent.press(screen.getByText('Verify Email'));

    expect(screen.getByText('Please enter the complete 6-digit code')).toBeTruthy();
    expect(mockAuthService.activateAccount).not.toHaveBeenCalled();
  });

  it('verifies the account and routes to login after the success alert action', async () => {
    mockAuthService.activateAccount.mockResolvedValueOnce({ message: 'Activated' });
    const screen = renderScreen();
    const inputs = screen.UNSAFE_getAllByType(TextInput);

    fireEvent.changeText(inputs[0], '123456');
    fireEvent.press(screen.getByText('Verify Email'));

    await waitFor(() => expect(mockAuthService.activateAccount).toHaveBeenCalledWith('ada@example.com', '123456'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Success!',
      'Your account has been verified. Please login to continue.',
      expect.any(Array)
    );

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    buttons[0].onPress();
    expect(navigation.replace).toHaveBeenCalledWith('Login');
  });

  it('renders the backend verification error when activation fails', async () => {
    mockAuthService.activateAccount.mockRejectedValueOnce(new Error('Invalid verification code.'));
    const screen = renderScreen();
    const inputs = screen.UNSAFE_getAllByType(TextInput);

    fireEvent.changeText(inputs[0], '123456');
    fireEvent.press(screen.getByText('Verify Email'));

    await waitFor(() => expect(screen.getByText('Invalid verification code.')).toBeTruthy());
  });

  it('does not resend the OTP before the countdown reaches zero', async () => {
    const screen = renderScreen();

    fireEvent.press(screen.getByText('Resend in 60s'));

    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it('resends the OTP after the countdown and resets the timer', async () => {
    jest.useFakeTimers();
    mockApi.post.mockResolvedValueOnce({ data: {} });
    const screen = renderScreen();

    await act(async () => {
      jest.advanceTimersByTime(60000);
    });

    fireEvent.press(screen.getByText('Resend'));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledWith('/accounts/resend-otp/', { email: 'ada@example.com' }));
    expect(Alert.alert).toHaveBeenCalledWith('Code Sent', 'A new verification code has been sent to your email.');
    expect(screen.getByText('Resend in 60s')).toBeTruthy();
  });

});