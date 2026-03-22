jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    multiRemove: jest.fn(),
  },
}));

import { getErrorMessage } from '../services/api';

describe('API error formatting', () => {
  it('returns a string payload directly when the backend sends a plain-text error', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: 'Plain backend error',
      },
    };

    expect(getErrorMessage(error)).toBe('Plain backend error');
  });

  it('prefers the message field when the backend provides one', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: { message: 'Readable message' },
      },
    };

    expect(getErrorMessage(error)).toBe('Readable message');
  });

  it('falls back to the detail field for DRF-style errors', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: { detail: 'Authentication failed' },
      },
    };

    expect(getErrorMessage(error)).toBe('Authentication failed');
  });

  it('stringifies nested error objects when error is not a string', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: { error: { code: 'invalid_purchase', detail: 'Purchase token rejected' } },
      },
    };

    expect(getErrorMessage(error)).toBe(JSON.stringify({ code: 'invalid_purchase', detail: 'Purchase token rejected' }));
  });

  it('joins field validation messages into a readable multiline string', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          email: ['This field is required.'],
          non_field_errors: ['Invalid credentials.'],
          code: 'ignored',
          status: 400,
        },
      },
    };

    expect(getErrorMessage(error)).toBe('email: This field is required.\nInvalid credentials.');
  });

  it('returns a connectivity message for network errors', () => {
    const error = {
      isAxiosError: true,
      message: 'Network Error',
    };

    expect(getErrorMessage(error)).toBe('Unable to connect to server. Please check your internet connection.');
  });

  it('returns a timeout-specific message for aborted requests', () => {
    const error = {
      isAxiosError: true,
      code: 'ECONNABORTED',
      message: 'timeout exceeded',
    };

    expect(getErrorMessage(error)).toBe('Request timed out. Please try again.');
  });

  it('returns the native error message for non-axios errors', () => {
    expect(getErrorMessage(new Error('Unexpected failure'))).toBe('Unexpected failure');
  });

  it('returns a generic message for unknown thrown values', () => {
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
  });
});
