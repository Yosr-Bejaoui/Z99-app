/**
 * API Configuration
 * Update BASE_URL to your backend server address
 */

// For development - use your computer's IP address when testing on phone
// Example: 'http://192.168.1.100:8000'
// For production: 'https://your-api-domain.com'
export const BASE_URL = 'http://10.133.245.121:8082';

export const API_URL = `${BASE_URL}/api/v1`;

export const WS_URL = BASE_URL.replace('http', 'ws');

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
