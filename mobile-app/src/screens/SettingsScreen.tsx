import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlassCard } from '../components';
import { useAuth } from '../context/AuthContext';
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../theme';

interface SettingsScreenProps {
  navigation: any;
}

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  iconColor = colors.primary,
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = true,
}) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    disabled={!onPress && !rightElement}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={[styles.settingIconContainer, { backgroundColor: iconColor + '20' }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement || (showChevron && onPress && (
      <Ionicons name="chevron-forward" size={20} color={colors.foregroundMuted} />
    ))}
  </TouchableOpacity>
);

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Contact Support', 'Please contact support@aiplatform.com to delete your account.');
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. You may need to re-login.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open link');
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1e24', '#0f1115', '#0a0c0f']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <GlassCard style={styles.section}>
          <SettingItem
            icon="person-outline"
            title="Edit Profile"
            subtitle={user?.email}
            onPress={() => navigation.navigate('Profile')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="card-outline"
            title="Subscription"
            subtitle={user?.subscribed ? 'Pro Plan' : 'Free Plan'}
            iconColor="#10b981"
            onPress={() => navigation.navigate('Credits')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="key-outline"
            title="Change Password"
            iconColor="#f59e0b"
            onPress={() => Alert.alert('Coming Soon', 'This feature is coming soon')}
          />
        </GlassCard>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <GlassCard style={styles.section}>
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive updates and alerts"
            showChevron={false}
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.primary + '50' }}
                thumbColor={notifications ? colors.primary : colors.foregroundMuted}
              />
            }
          />
          <View style={styles.divider} />
          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Currently always on"
            iconColor="#8b5cf6"
            showChevron={false}
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.border, true: colors.primary + '50' }}
                thumbColor={darkMode ? colors.primary : colors.foregroundMuted}
                disabled
              />
            }
          />
          <View style={styles.divider} />
          <SettingItem
            icon="save-outline"
            title="Auto-save Chats"
            subtitle="Automatically save conversations"
            iconColor="#06b6d4"
            showChevron={false}
            rightElement={
              <Switch
                value={autoSave}
                onValueChange={setAutoSave}
                trackColor={{ false: colors.border, true: colors.primary + '50' }}
                thumbColor={autoSave ? colors.primary : colors.foregroundMuted}
              />
            }
          />
        </GlassCard>

        {/* Support Section */}
        <Text style={styles.sectionTitle}>Support</Text>
        <GlassCard style={styles.section}>
          <SettingItem
            icon="help-circle-outline"
            title="Help & FAQ"
            iconColor="#0ea5e9"
            onPress={() => navigation.navigate('Help')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="chatbubble-ellipses-outline"
            title="Contact Support"
            iconColor="#10b981"
            onPress={() => openLink('mailto:support@aiplatform.com')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="star-outline"
            title="Rate App"
            iconColor="#f59e0b"
            onPress={() => Alert.alert('Thank You!', 'We appreciate your feedback!')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="share-social-outline"
            title="Share App"
            iconColor="#8b5cf6"
            onPress={() => Alert.alert('Share', 'Share functionality coming soon')}
          />
        </GlassCard>

        {/* About Section */}
        <Text style={styles.sectionTitle}>About</Text>
        <GlassCard style={styles.section}>
          <SettingItem
            icon="document-text-outline"
            title="Terms of Service"
            onPress={() => openLink('https://aiplatform.com/terms')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            iconColor="#10b981"
            onPress={() => openLink('https://aiplatform.com/privacy')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="information-circle-outline"
            title="App Version"
            subtitle="1.0.0 (Build 1)"
            iconColor="#6b7280"
            showChevron={false}
          />
        </GlassCard>

        {/* Data Section */}
        <Text style={styles.sectionTitle}>Data</Text>
        <GlassCard style={styles.section}>
          <SettingItem
            icon="trash-outline"
            title="Clear Cache"
            subtitle="Free up storage space"
            iconColor="#f59e0b"
            onPress={handleClearCache}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="download-outline"
            title="Export Data"
            subtitle="Download your data"
            iconColor="#0ea5e9"
            onPress={() => Alert.alert('Coming Soon', 'This feature is coming soon')}
          />
        </GlassCard>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
        <GlassCard style={[styles.section, { borderColor: '#ef444430' }]}>
          <SettingItem
            icon="log-out-outline"
            title="Logout"
            iconColor="#ef4444"
            onPress={handleLogout}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="warning-outline"
            title="Delete Account"
            subtitle="Permanently delete your account"
            iconColor="#ef4444"
            onPress={handleDeleteAccount}
          />
        </GlassCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ by AI Platform Team</Text>
          <Text style={styles.footerSubtext}>© 2024 All rights reserved</Text>
        </View>
      </ScrollView>
    </View>
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
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.foreground,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.foregroundMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  section: {
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.foreground,
  },
  settingSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.foregroundMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 60,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSizes.sm,
    color: colors.foregroundMuted,
  },
  footerSubtext: {
    fontSize: typography.fontSizes.xs,
    color: colors.foregroundMuted,
    marginTop: spacing.xs,
    opacity: 0.7,
  },
});

export default SettingsScreen;
