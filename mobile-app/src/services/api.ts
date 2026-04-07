import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, NativeModules, Platform } from 'react-native';
import { API_BASE_URL, STORAGE_KEYS } from './config';

// Track offline state to avoid spamming alerts
let offlineAlertShown = false;

const showOfflineAlert = () => {
  if (!offlineAlertShown) {
    offlineAlertShown = true;
    Alert.alert(
      'No Internet Connection',
      'Please check your network connection and try again.',
      [{ text: 'OK', onPress: () => { offlineAlertShown = false; } }]
    );
  }
};

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

const getOriginFromApiBase = (base: string): string => {
  return base.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
};

const buildFallbackApiBaseUrls = (currentBaseUrl: string): string[] => {
  const currentOrigin = getOriginFromApiBase(currentBaseUrl);
  const bundleHost = getBundleHost();
  const webHost = (() => {
    try {
      if (typeof window !== 'undefined') {
        const anyWindow = window as any;
        const hostname = anyWindow?.location?.hostname;
        return typeof hostname === 'string' && hostname.length > 0 ? hostname : null;
      }
    } catch {
      // In React Native, window may be partially defined or behave unexpectedly; ignore.
    }
    return null;
  })();

  const candidateOrigins = [
    currentOrigin,
    bundleHost ? `http://${bundleHost}:8000` : null,
    webHost ? `http://${webHost}:8000` : null,
    'http://10.214.117.121:8000',
    'http://10.214.117.121:8000',
    'http://localhost:8000',
  ].filter((v): v is string => !!v);

  const deduped = Array.from(new Set(candidateOrigins.map((origin) => origin.replace(/\/+$/, ''))));
  return deduped.map((origin) => `${origin}/api/v1`);
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    // Skip ngrok browser warning page (required for free tier ngrok tunnels)
    'ngrok-skip-browser-warning': 'true',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Avoid sending token for auth endpoints
      const isAuthEndpoint = config.url && (
        config.url.includes('/login/') || 
        config.url.includes('/register/') || 
        config.url.includes('/activate/')
      );
      
      if (!isAuthEndpoint) {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh and offline detection
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean; _networkRetry?: boolean }) | undefined;

    // Detect offline / network errors
    if ((error.message === 'Network Error' || error.code === 'ERR_NETWORK') && originalRequest) {
      if (!originalRequest._networkRetry) {
        originalRequest._networkRetry = true;
        const currentBaseUrl = String(originalRequest.baseURL || api.defaults.baseURL || API_BASE_URL);
        const candidates = buildFallbackApiBaseUrls(currentBaseUrl);

        for (const candidateBaseUrl of candidates) {
          if (candidateBaseUrl === currentBaseUrl) {
            continue;
          }

          try {
            const retriedRequest = {
              ...originalRequest,
              baseURL: candidateBaseUrl,
            };
            const response = await api.request(retriedRequest);

            // Keep using the first working backend endpoint for subsequent calls.
            api.defaults.baseURL = candidateBaseUrl;
            return response;
          } catch (retryError) {
            if (!axios.isAxiosError(retryError) || (retryError.code !== 'ERR_NETWORK' && retryError.message !== 'Network Error')) {
              return Promise.reject(retryError);
            }
          }
        }
      }

      showOfflineAlert();
      return Promise.reject(error);
    }

    // If 401 and not already retrying, attempt token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER,
        ]);
        // The auth context will handle navigation to login
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Helper function to handle API errors
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    if (axiosError.response?.data) {
      const data = axiosError.response.data;
      
      // Direct string messages
      if (typeof data === 'string') return data;
      if (data.message) return data.message;
      if (data.detail) return data.detail;
      if (data.error) {
        if (typeof data.error === 'string') return data.error;
        if (typeof data.error.message === 'string') return data.error.message;
        if (typeof data.error.detail === 'string') return data.error.detail;
        return JSON.stringify(data.error);
      }
      
      // Django REST framework field errors: { field: ["error1", "error2"] }
      const fieldErrors = Object.entries(data)
        .filter(([key]) => key !== 'status' && key !== 'code')
        .map(([key, value]) => {
          const msgs = Array.isArray(value) ? value.join(', ') : String(value);
          return key === 'non_field_errors' ? msgs : `${key}: ${msgs}`;
        });
      if (fieldErrors.length > 0) return fieldErrors.join('\n');
      
      return 'An error occurred';
    }
    
    if (axiosError.message === 'Network Error') {
      return 'Unable to connect to server. Please check your internet connection.';
    }

    if (axiosError.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
    
    return axiosError.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};
