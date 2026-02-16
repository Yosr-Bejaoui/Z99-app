import api from './api';

export interface ProfileData {
  name?: string;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

export interface SystemConfig {
  id?: number;
  key: string;
  value: string;
  description?: string;
  is_active?: boolean;
}

export interface APIProviderConfig {
  id?: number;
  name: string;
  api_key?: string;
  base_url?: string;
  is_active?: boolean;
}

export const settingsService = {
  // Profile Management
  async getProfile(): Promise<ProfileData> {
    const response = await api.get('/accounts/profile/');
    const data = response.data.results?.[0] || response.data;
    return {
      name: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      email: data.email,
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
    };
  },

  async updateProfile(data: ProfileData): Promise<ProfileData> {
    // Parse name into first_name and last_name if provided
    const profileData: Record<string, string> = {};
    
    if (data.name) {
      const [firstName, ...lastNameParts] = data.name.split(' ');
      profileData.first_name = firstName;
      profileData.last_name = lastNameParts.join(' ');
    }
    if (data.email) profileData.email = data.email;
    if (data.username) profileData.username = data.username;
    
    const response = await api.patch('/accounts/profile/', profileData);
    return response.data;
  },

  // Password Management
  async changePassword(data: PasswordChangeData): Promise<{ message: string }> {
    const response = await api.post('/accounts/change-password/', {
      current_password: data.current_password,
      new_password: data.new_password,
    });
    return response.data;
  },

  // System Configuration
  async getSystemConfigs(): Promise<SystemConfig[]> {
    const response = await api.get('/accounts/admin/config/');
    return response.data.results || response.data || [];
  },

  async updateSystemConfig(id: number, data: Partial<SystemConfig>): Promise<SystemConfig> {
    const response = await api.patch(`/accounts/admin/config/${id}/`, data);
    return response.data;
  },

  async createSystemConfig(data: SystemConfig): Promise<SystemConfig> {
    const response = await api.post('/accounts/admin/config/', data);
    return response.data;
  },

  // API Provider Configuration
  async getAPIProviders(): Promise<APIProviderConfig[]> {
    const response = await api.get('/accounts/admin/providers/');
    return response.data.results || response.data || [];
  },

  async updateAPIProvider(id: number, data: Partial<APIProviderConfig>): Promise<APIProviderConfig> {
    const response = await api.patch(`/accounts/admin/providers/${id}/`, data);
    return response.data;
  },

  async createAPIProvider(data: APIProviderConfig): Promise<APIProviderConfig> {
    const response = await api.post('/accounts/admin/providers/', data);
    return response.data;
  },

  // Notification settings (stored as system configs)
  async getNotificationSettings(): Promise<Record<string, boolean>> {
    try {
      const configs = await this.getSystemConfigs();
      const notificationConfig = configs.find(c => c.key === 'notification_settings');
      if (notificationConfig) {
        return JSON.parse(notificationConfig.value);
      }
    } catch {
      // Return defaults if not found
    }
    return {
      emailNewUsers: true,
      emailSubscriptions: true,
      emailSystemAlerts: true,
      pushNotifications: false,
      weeklyReports: true,
    };
  },

  async updateNotificationSettings(settings: Record<string, boolean>): Promise<void> {
    try {
      const configs = await this.getSystemConfigs();
      const notificationConfig = configs.find(c => c.key === 'notification_settings');
      
      if (notificationConfig && notificationConfig.id) {
        await this.updateSystemConfig(notificationConfig.id, {
          value: JSON.stringify(settings),
        });
      } else {
        await this.createSystemConfig({
          key: 'notification_settings',
          value: JSON.stringify(settings),
          description: 'Admin notification preferences',
        });
      }
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  },
};

export default settingsService;
