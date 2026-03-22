/**
 * API Configuration
 * Update BASE_URL to your backend server address
 */

import { NativeModules, Platform } from 'react-native';

const getBundleHost = (): string | null => {
  const scriptUrl = NativeModules.SourceCode?.scriptURL;

  if (typeof scriptUrl !== 'string' || scriptUrl.length === 0) {
    return null;
  }

  const hostMatch = scriptUrl.match(/^[a-z]+:\/\/([^/:]+)/i);
  if (!hostMatch) {
    return null;
  }

  const host = hostMatch[1];
  if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
    return '10.0.2.2';
  }

  return host;
};

const getHostFromUrl = (url?: string): string | null => {
  if (!url) return null;
  const match = url.match(/^[a-z]+:\/\/([^/:]+)/i);
  return match ? match[1] : null;
};

// For development - use your computer's IP address when testing on phone
// Example: EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8000/api/v1
// For production: EXPO_PUBLIC_API_BASE_URL=https://your-api-domain.com/api/v1
const bundleHost = getBundleHost();
const defaultApiHost = bundleHost || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
const defaultApiBaseUrl = `http://${defaultApiHost}:8000/api/v1`;
const envApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const envApiHost = getHostFromUrl(envApiBaseUrl);

// If running on Android emulator, prefer emulator loopback even when env points to LAN IP.
const isAndroidEmulator = Platform.OS === 'android' && defaultApiHost === '10.0.2.2';
const envForcesDifferentHost = !!envApiHost && !['10.0.2.2', 'localhost', '127.0.0.1'].includes(envApiHost);
const configuredApiBaseUrl = isAndroidEmulator && envForcesDifferentHost
  ? defaultApiBaseUrl
  : (envApiBaseUrl || defaultApiBaseUrl);
export const BASE_URL = configuredApiBaseUrl.replace(/\/+$/, '').replace(/\/api\/v1$/, '');

export const API_URL = `${BASE_URL}/api/v1`;

export const WS_URL = BASE_URL.replace('https', 'wss');

export const ENDPOINTS = {
  // Auth
  register: '/accounts/register/',
  login: '/accounts/login/',
  googleLogin: '/accounts/google/login/',
  logout: '/accounts/logout/',
  activate: '/accounts/activate/',
  forgotPassword: '/accounts/forgot-password/',
  resetPassword: '/accounts/reset-password/',
  
  // Profile
  profile: '/accounts/profile/',
  transactions: '/accounts/transactions/',
  creditAccount: '/accounts/credit-account/',
  
  // AI Models
  models: '/list/',
  chatSessions: '/chat/session/list/',
  
  // Plans
  plans: '/plan/list/',
  googlePurchase: '/plan/checkout/google-pay/',
  
  // Ads & Rewards
  rewards: '/ads/rewards/',
  
  // Invoices
  invoices: '/invoices/list/',
};

// WebSocket endpoint factory
export const getWebSocketUrl = (sessionId: string, token: string) => 
  `${WS_URL}/ws/chat/${sessionId}/?token=${token}`;
