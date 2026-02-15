import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../context';

interface SettingsItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  type: 'link' | 'toggle' | 'badge';
  value?: string | boolean;
  color?: string;
}

const settingsItems: SettingsItem[] = [
  { id: 'notifications', icon: 'notifications-outline', label: 'Notifications', type: 'toggle', value: true },
  { id: 'darkMode', icon: 'moon-outline', label: 'Dark Mode', type: 'toggle', value: true },
  { id: 'language', icon: 'language-outline', label: 'Language', type: 'badge', value: 'English' },
  { id: 'security', icon: 'shield-outline', label: 'Security', type: 'link' },
  { id: 'help', icon: 'help-circle-outline', label: 'Help & Support', type: 'link' },
  { id: 'about', icon: 'information-circle-outline', label: 'About', type: 'link' },
  { id: 'privacy', icon: 'lock-closed-outline', label: 'Privacy Policy', type: 'link' },
  { id: 'terms', icon: 'document-text-outline', label: 'Terms of Service', type: 'link' },
];

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout, isLoading } = useAuth();
  const [settings, setSettings] = React.useState({
    notifications: true,
    darkMode: true,
  });
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Landing' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const toggleSetting = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev],
    }));
  };

  // Get user initials from name or email
  const getInitials = () => {
    if (user?.name) {
      const names = user.name.split(' ');
      if (names.length > 1) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return user.name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'AI';
  };

  // Format date
  const formatMemberSince = () => {
    if (user?.created_at) {
      const date = new Date(user.created_at);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return 'N/A';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.profile_picture ? (
              <Image source={{ uri: user.profile_picture }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </LinearGradient>
            )}
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          
          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{user?.total_words_used || 0}</Text>
              <Text style={styles.quickStatLabel}>Words</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{user?.total_images_generated || 0}</Text>
              <Text style={styles.quickStatLabel}>Images</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{user?.subscription?.plan?.name || 'Free'}</Text>
              <Text style={styles.quickStatLabel}>Plan</Text>
            </View>
          </View>
        </GlassCard>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <GlassCard style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="mail" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="pencil-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="card" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Plan</Text>
                <Text style={styles.infoValue}>{user?.subscription?.plan?.name || 'Free Tier'}</Text>
              </View>
              <TouchableOpacity style={styles.upgradeButton}>
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>{formatMemberSince()}</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <GlassCard style={styles.settingsCard}>
            {settingsItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <View style={styles.settingsDivider} />}
                <TouchableOpacity
                  style={styles.settingsRow}
                  onPress={() => {
                    if (item.type === 'toggle') {
                      toggleSetting(item.id);
                    } else if (item.type === 'link') {
                      if (item.id === 'help') {
                        navigation.navigate('Help');
                      } else if (item.id === 'security') {
                        navigation.navigate('Settings');
                      } else {
                        // Navigate to Settings for other items
                        navigation.navigate('Settings');
                      }
                    }
                  }}
                  disabled={item.type === 'toggle'}
                >
                  <View style={[styles.settingsIcon, { backgroundColor: `${colors.primary}15` }]}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.settingsLabel}>{item.label}</Text>
                  {item.type === 'toggle' && (
                    <Switch
                      value={settings[item.id as keyof typeof settings]}
                      onValueChange={() => toggleSetting(item.id)}
                      trackColor={{ false: colors.surface, true: colors.primary }}
                      thumbColor="#fff"
                    />
                  )}
                  {item.type === 'badge' && (
                    <View style={styles.settingsBadge}>
                      <Text style={styles.settingsBadgeText}>{item.value}</Text>
                    </View>
                  )}
                  {item.type === 'link' && (
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </GlassCard>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={handleSignOut}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          )}
          <Text style={styles.signOutText}>
            {loggingOut ? 'Signing Out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  profileCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 20,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  quickStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  infoCard: {
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 64,
  },
  upgradeButton: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  upgradeButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  settingsCard: {
    padding: 4,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 64,
  },
  settingsBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  settingsBadgeText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
  },
});

export default ProfileScreen;
