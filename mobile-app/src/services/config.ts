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

// API Configuration
const bundleHost = getBundleHost();
const defaultApiHost = bundleHost || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
const defaultApiBaseUrl = `http://${defaultApiHost}:8000/api/v1`;
const envApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const envApiHost = getHostFromUrl(envApiBaseUrl);

// Only force emulator loopback when Metro bundle host explicitly resolves to 10.0.2.2.
// In standalone APK builds, bundleHost is often null and should not be treated as emulator.
const isAndroidEmulator = Platform.OS === 'android' && bundleHost === '10.0.2.2';
// Force API URL to local network IP for testing
const configuredApiBaseUrl = 'http://192.168.1.11:8000/api/v1';

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, '');

// WebSocket URL for real-time chat
const apiOrigin = API_BASE_URL.replace(/\/api\/v1$/, '');
export const WS_BASE_URL = `${apiOrigin.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')}/ws`;

// API Endpoints
export const ENDPOINTS = {
  // Auth
  REGISTER: '/accounts/register/',
  ACTIVATE: '/accounts/activate/',
  RESEND_OTP: '/accounts/resend-otp/',
  LOGIN: '/accounts/login/',
  GOOGLE_LOGIN: '/accounts/google/login/',
  LOGOUT: '/accounts/logout/',
  FORGOT_PASSWORD: '/accounts/forgot-password/',
  RESET_PASSWORD: '/accounts/reset-password/',
  PROFILE: '/accounts/profile/',
  TRANSACTIONS: '/accounts/transactions/',

  // AI Models
  MODELS_LIST: '/list/',

  // Chat Sessions
  CHAT_SESSIONS: '/chat/session/list/',

  // Image Generation
  IMAGE_SESSIONS: '/chat/session/list/',
  IMAGE_TO_3D: '/image-to-3d/',
  IMAGE_UPSCALER: '/image-upscaler/',
  IMAGE_EDIT: '/image-edit/',

  // Plans
  PLANS: '/plan/list/',
  SUBSCRIBE: '/plan/subscribe/',

  // Invoices
  INVOICES: '/invoices/list/',
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@auth_access_token',
  REFRESH_TOKEN: '@auth_refresh_token',
  USER: '@auth_user',
};
