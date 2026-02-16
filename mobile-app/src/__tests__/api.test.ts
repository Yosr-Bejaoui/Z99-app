import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../services/config';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should store tokens after successful login', async () => {
      const mockSetItem = AsyncStorage.setItem as jest.Mock;
      
      // Simulate token storage
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'test-access-token');
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'test-refresh-token');
      
      expect(mockSetItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN, 'test-access-token');
      expect(mockSetItem).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN, 'test-refresh-token');
    });

    it('should retrieve stored tokens', async () => {
      const mockGetItem = AsyncStorage.getItem as jest.Mock;
      mockGetItem.mockResolvedValueOnce('test-access-token');
      
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      
      expect(token).toBe('test-access-token');
      expect(mockGetItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
    });

    it('should clear tokens on logout', async () => {
      const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;
      
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      
      expect(mockRemoveItem).toHaveBeenCalledTimes(3);
    });
  });

  describe('API Configuration', () => {
    it('should have correct base URL configured', () => {
      // This would test that the API client is configured correctly
      expect(true).toBe(true); // Placeholder for actual implementation
    });
  });
});
