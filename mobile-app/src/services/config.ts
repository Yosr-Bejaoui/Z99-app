// API Configuration
// Update this URL based on your environment

// For development on same network as backend server
export const API_BASE_URL = 'http://172.18.133.153:8082/api/v1';

// For local development (if backend runs locally)
// export const API_BASE_URL = 'http://localhost:8082/api/v1';

// For production
// export const API_BASE_URL = 'https://your-production-domain.com/api/v1';

// WebSocket URL for real-time chat
export const WS_BASE_URL = 'ws://172.18.133.153:8082/ws';

// API Endpoints
export const ENDPOINTS = {
  // Auth
  REGISTER: '/accounts/register/',
  ACTIVATE: '/accounts/activate/',
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
