import api, { getErrorMessage } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Note: expo-notifications needs to be installed
// import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';

const NOTIFICATION_STORAGE_KEY = '@notifications';
const PUSH_TOKEN_KEY = '@push_token';

export interface AppNotification {
  id: number | string;
  title: string;
  message: string;
  body?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion' | 'reward';
  read: boolean;
  created_at: string;
  data?: Record<string, any>;
  action_url?: string;
}

export interface NotificationsResponse {
  count: number;
  unread_count: number;
  notifications: AppNotification[];
}

export interface NotificationSettings {
  push_enabled: boolean;
  email_enabled: boolean;
  promotions_enabled: boolean;
  generation_updates: boolean;
  reward_alerts: boolean;
  marketing_enabled?: boolean;
  new_features?: boolean;
  credits_alerts?: boolean;
}

export const notificationService = {
  /**
   * Register for push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Check if we already have a token
      const existingToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (existingToken) {
        return existingToken;
      }

      // Push notifications would be implemented with expo-notifications
      // For now, return null to avoid errors
      console.log('Push notification registration - expo-notifications needs to be installed');
      return null;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      return null;
    }
  },

  /**
   * Check device permissions (stub for now)
   */
  async checkPermissions(): Promise<boolean> {
    // Would use Notifications.getPermissionsAsync() when expo-notifications is installed
    return true;
  },

  /**
   * Register device token with backend
   */
  async registerDeviceToken(token: string): Promise<void> {
    try {
      await api.post('/accounts/device-token/', {
        token,
        platform: Platform.OS,
        device_type: Constants.deviceName || 'unknown',
      });
    } catch (error) {
      console.error('Error registering device token:', error);
    }
  },

  /**
   * Get all notifications from backend
   */
  async getNotifications(page: number = 1): Promise<NotificationsResponse> {
    try {
      const response = await api.get('/accounts/notifications/', {
        params: { page },
      });
      
      const data = response.data;
      const notifications = Array.isArray(data) ? data : data.results || [];
      
      return {
        count: data.count || notifications.length,
        unread_count: data.unread_count || notifications.filter((n: any) => !n.read).length,
        notifications: notifications.map(transformNotification),
      };
    } catch (error) {
      // Fallback to local storage if backend fails
      console.error('Error fetching notifications from backend:', error);
      return this.getLocalNotifications();
    }
  },

  /**
   * Get local notifications (fallback)
   */
  async getLocalNotifications(): Promise<NotificationsResponse> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      const notifications: AppNotification[] = stored ? JSON.parse(stored) : [];
      const unread = notifications.filter(n => !n.read);
      
      return {
        count: notifications.length,
        unread_count: unread.length,
        notifications,
      };
    } catch {
      return { count: 0, unread_count: 0, notifications: [] };
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.post(`/accounts/notifications/${notificationId}/read/`);
    } catch {
      // Update locally if backend fails
      await this.markLocalAsRead(notificationId);
    }
  },

  /**
   * Mark local notification as read
   */
  async markLocalAsRead(notificationId: string): Promise<void> {
    try {
      const { notifications } = await this.getLocalNotifications();
      const updated = notifications.map(n =>
        String(n.id) === notificationId ? { ...n, read: true } : n
      );
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await api.post('/accounts/notifications/read-all/');
    } catch {
      // Update locally if backend fails
      const { notifications } = await this.getLocalNotifications();
      const updated = notifications.map(n => ({ ...n, read: true }));
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await api.delete(`/accounts/notifications/${notificationId}/`);
    } catch {
      // Delete locally if backend fails
      const { notifications } = await this.getLocalNotifications();
      const updated = notifications.filter(n => String(n.id) !== notificationId);
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
    }
  },

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    try {
      await api.delete('/accounts/notifications/clear/');
    } catch {
      // Clear locally
    }
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify([]));
  },

  /**
   * Add a local notification (for in-app events)
   */
  async addLocalNotification(notification: Omit<AppNotification, 'id' | 'created_at' | 'read'>): Promise<void> {
    try {
      const { notifications } = await this.getLocalNotifications();
      const newNotification: AppNotification = {
        ...notification,
        id: `local_${Date.now()}`,
        created_at: new Date().toISOString(),
        read: false,
      };
      
      notifications.unshift(newNotification);
      
      // Keep only last 100 notifications
      const trimmed = notifications.slice(0, 100);
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error adding local notification:', error);
    }
  },

  /**
   * Get notification settings
   */
  async getSettings(): Promise<NotificationSettings> {
    try {
      const response = await api.get('/accounts/notification-settings/');
      return {
        push_enabled: response.data.push_enabled ?? true,
        email_enabled: response.data.email_enabled ?? true,
        promotions_enabled: response.data.promotions_enabled ?? true,
        generation_updates: response.data.generation_updates ?? true,
        reward_alerts: response.data.reward_alerts ?? true,
      };
    } catch {
      return {
        push_enabled: true,
        email_enabled: true,
        promotions_enabled: true,
        generation_updates: true,
        reward_alerts: true,
      };
    }
  },

  /**
   * Update notification settings
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      await api.patch('/accounts/notification-settings/', settings);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/accounts/notifications/unread-count/');
      return response.data.count || 0;
    } catch {
      const { unread_count } = await this.getLocalNotifications();
      return unread_count;
    }
  },

  /**
   * Schedule a local notification (stub - requires expo-notifications)
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    seconds: number = 1
  ): Promise<string> {
    // Stub implementation - returns a mock ID
    // Real implementation would use:
    // const id = await Notifications.scheduleNotificationAsync({
    //   content: { title, body },
    //   trigger: { seconds },
    // });
    // return id;
    console.log('scheduleLocalNotification stub called:', { title, body, seconds });
    return `scheduled_${Date.now()}`;
  },

  /**
   * Cancel a scheduled notification (stub)
   */
  async cancelScheduledNotification(id: string): Promise<void> {
    // Would use Notifications.cancelScheduledNotificationAsync(id) when expo-notifications is installed
    console.log('Cancel notification:', id);
  },
};

function transformNotification(data: any): AppNotification {
  let type: AppNotification['type'] = 'info';
  if (data.type === 'success' || data.type === 'complete') {
    type = 'success';
  } else if (data.type === 'warning') {
    type = 'warning';
  } else if (data.type === 'error' || data.type === 'failed') {
    type = 'error';
  } else if (data.type === 'promotion' || data.type === 'marketing') {
    type = 'promotion';
  } else if (data.type === 'reward') {
    type = 'reward';
  }

  return {
    id: typeof data.id === 'number' ? data.id : parseInt(data.id) || Date.now(),
    title: data.title || 'Notification',
    message: data.body || data.message || '',
    body: data.body || data.message || '',
    type,
    read: data.read || data.is_read || false,
    created_at: data.created_at || new Date().toISOString(),
    data: data.data || data.extra_data,
    action_url: data.action_url || data.deep_link,
  };
}

export default notificationService;
