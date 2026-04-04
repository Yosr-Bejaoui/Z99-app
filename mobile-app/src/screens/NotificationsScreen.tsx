import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import { notificationService, getErrorMessage } from '../services';
import type { AppNotification, NotificationSettings } from '../services/types';

interface NotificationSettingsState {
  pushEnabled: boolean;
  emailEnabled: boolean;
  promoEnabled: boolean;
  weeklyDigest: boolean;
  usageAlerts: boolean;
  newFeatures: boolean;
}

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSettingsState>({
    pushEnabled: true,
    emailEnabled: true,
    promoEnabled: false,
    weeklyDigest: true,
    usageAlerts: true,
    newFeatures: true,
  });

  useEffect(() => {
    loadNotifications();
    loadSettings();
    // Register for push notifications
    notificationService.registerForPushNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationService.getNotifications();
      setNotifications(response.notifications);
    } catch (err) {
      setError(getErrorMessage(err));
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const backendSettings = await notificationService.getSettings();
      setSettings({
        pushEnabled: backendSettings.push_enabled,
        emailEnabled: backendSettings.email_enabled,
        promoEnabled: backendSettings.promotions_enabled,
        weeklyDigest: true,
        usageAlerts: backendSettings.reward_alerts,
        newFeatures: backendSettings.generation_updates,
      });
    } catch (error) {
      console.log('Failed to load settings, using defaults');
    }
  };

  const saveSettings = async (newSettings: NotificationSettingsState) => {
    try {
      setSettings(newSettings);
      await notificationService.updateSettings({
        push_enabled: newSettings.pushEnabled,
        email_enabled: newSettings.emailEnabled,
        promotions_enabled: newSettings.promoEnabled,
        reward_alerts: newSettings.usageAlerts,
        generation_updates: newSettings.newFeatures,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, []);

  const markAsRead = async (id: number | string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    await notificationService.markAsRead(String(id));
  };

  const markAllAsRead = async () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    await notificationService.markAllAsRead();
  };

  const deleteNotification = async (id: number | string) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    await notificationService.deleteNotification(String(id));
  };

  const clearAllNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setNotifications([]);
            await notificationService.clearAll();
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: colors.success };
      case 'warning':
        return { name: 'warning', color: colors.warning };
      case 'error':
        return { name: 'close-circle', color: colors.error };
      case 'promotion':
      case 'promo':
        return { name: 'gift', color: colors.secondary };
      case 'reward':
        return { name: 'trophy', color: '#f59e0b' };
      default:
        return { name: 'information-circle', color: colors.primary };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotificationsTab = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="warning-outline" size={64} color={colors.error} />
          <Text style={styles.emptyTitle}>Error Loading Notifications</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadNotifications}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
    <>
      {/* Actions Bar */}
      {notifications.length > 0 && (
        <View style={styles.actionsBar}>
          <TouchableOpacity onPress={markAllAsRead} style={styles.actionButton}>
            <Ionicons name="checkmark-done" size={18} color={colors.primary} />
            <Text style={styles.actionText}>Mark all read</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearAllNotifications} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySubtitle}>
            You're all caught up! We'll notify you when something important happens.
          </Text>
        </View>
      ) : (
        <View style={styles.notificationsList}>
          {notifications.map((notification) => {
            const icon = getNotificationIcon(notification.type);
            return (
              <TouchableOpacity
                key={notification.id}
                onPress={() => markAsRead(notification.id)}
                onLongPress={() =>
                  Alert.alert('Delete Notification', 'Remove this notification?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => deleteNotification(notification.id),
                    },
                  ])
                }
              >
                <GlassCard
                  style={[
                    styles.notificationCard,
                    !notification.read && styles.notificationCardUnread,
                  ]}
                >
                  <View style={styles.notificationContent}>
                    <View style={[styles.notificationIcon, { backgroundColor: icon.color + '20' }]}>
                      <Ionicons name={icon.name as any} size={24} color={icon.color} />
                    </View>
                    <View style={styles.notificationText}>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        {!notification.read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.notificationMessage} numberOfLines={2}>
                        {notification.message || notification.body}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatTimestamp(notification.created_at)}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </>
  );
  };

  const renderSettingsTab = () => (
    <View style={styles.settingsContainer}>
      {/* Push Notifications */}
      <GlassCard style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Push Notifications</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={22} color={colors.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Receive push notifications on your device</Text>
            </View>
          </View>
          <Switch
            value={settings.pushEnabled}
            onValueChange={(value) => saveSettings({ ...settings, pushEnabled: value })}
            trackColor={{ false: colors.border, true: colors.primary + '50' }}
            thumbColor={settings.pushEnabled ? colors.primary : colors.textMuted}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="mail" size={22} color={colors.secondary} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>Receive important updates via email</Text>
            </View>
          </View>
          <Switch
            value={settings.emailEnabled}
            onValueChange={(value) => saveSettings({ ...settings, emailEnabled: value })}
            trackColor={{ false: colors.border, true: colors.primary + '50' }}
            thumbColor={settings.emailEnabled ? colors.primary : colors.textMuted}
          />
        </View>
      </GlassCard>

      {/* Notification Types */}
      <GlassCard style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Notification Types</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="gift" size={22} color={colors.warning} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Promotions & Offers</Text>
              <Text style={styles.settingDescription}>Special deals and discounts</Text>
            </View>
          </View>
          <Switch
            value={settings.promoEnabled}
            onValueChange={(value) => saveSettings({ ...settings, promoEnabled: value })}
            trackColor={{ false: colors.border, true: colors.primary + '50' }}
            thumbColor={settings.promoEnabled ? colors.primary : colors.textMuted}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="trending-up" size={22} color={colors.success} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Usage Alerts</Text>
              <Text style={styles.settingDescription}>Low credits and usage warnings</Text>
            </View>
          </View>
          <Switch
            value={settings.usageAlerts}
            onValueChange={(value) => saveSettings({ ...settings, usageAlerts: value })}
            trackColor={{ false: colors.border, true: colors.primary + '50' }}
            thumbColor={settings.usageAlerts ? colors.primary : colors.textMuted}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="sparkles" size={22} color={colors.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>New Features</Text>
              <Text style={styles.settingDescription}>Updates about new AI models and features</Text>
            </View>
          </View>
          <Switch
            value={settings.newFeatures}
            onValueChange={(value) => saveSettings({ ...settings, newFeatures: value })}
            trackColor={{ false: colors.border, true: colors.primary + '50' }}
            thumbColor={settings.newFeatures ? colors.primary : colors.textMuted}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="newspaper" size={22} color={colors.secondary} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Weekly Digest</Text>
              <Text style={styles.settingDescription}>Summary of your weekly activity</Text>
            </View>
          </View>
          <Switch
            value={settings.weeklyDigest}
            onValueChange={(value) => saveSettings({ ...settings, weeklyDigest: value })}
            trackColor={{ false: colors.border, true: colors.primary + '50' }}
            thumbColor={settings.weeklyDigest ? colors.primary : colors.textMuted}
          />
        </View>
      </GlassCard>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notifications' && styles.tabActive]}
          onPress={() => setActiveTab('notifications')}
        >
          <Ionicons
            name="notifications"
            size={20}
            color={activeTab === 'notifications' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
            Inbox
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons
            name="settings"
            size={20}
            color={activeTab === 'settings' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          activeTab === 'notifications' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          ) : undefined
        }
      >
        {activeTab === 'notifications' ? renderNotificationsTab() : renderSettingsTab()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  unreadBadge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  tabActive: {
    backgroundColor: colors.primary + '15',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    padding: 16,
  },
  notificationCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    gap: 14,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  settingsContainer: {
    gap: 16,
  },
  settingsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.foreground,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default NotificationsScreen;
