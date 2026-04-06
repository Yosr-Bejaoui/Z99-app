import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlassCard } from '../components';
import { useAuth } from '../context';
import { SUPPORTED_LANGUAGES, changeLanguage } from '../i18n';
import type { LanguageCode } from '../i18n';
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../theme';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

interface SettingsScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
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
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const currentLangCode = (i18n.language || 'en') as LanguageCode;
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === currentLangCode) || SUPPORTED_LANGUAGES[0];

  const handleLogout = () => {
    Alert.alert(
      t('settings.logoutAlert.title'),
      t('settings.logoutAlert.message'),
      [
        { text: t('settings.logoutAlert.cancel'), style: 'cancel' },
        { 
          text: t('settings.logoutAlert.confirm'), 
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Landing' }],
            });
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAlert.title'),
      t('settings.deleteAlert.message'),
      [
        { text: t('settings.deleteAlert.cancel'), style: 'cancel' },
        { 
          text: t('settings.deleteAlert.confirm'), 
          style: 'destructive',
          onPress: () => {
            Alert.alert(t('settings.deleteAlert.contactTitle'), t('settings.deleteAlert.contactMessage'));
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      t('settings.clearCacheAlert.title'),
      t('settings.clearCacheAlert.message'),
      [
        { text: t('settings.clearCacheAlert.cancel'), style: 'cancel' },
        { 
          text: t('settings.clearCacheAlert.confirm'), 
          onPress: async () => {
            try {
              // Get auth keys before clearing
              const authKeys = [
                '@auth_access_token',
                '@auth_refresh_token',
                '@auth_user',
              ];
              const authData = await Promise.all(
                authKeys.map(async (key) => [key, await AsyncStorage.getItem(key)] as [string, string | null])
              );

              // Clear everything
              await AsyncStorage.clear();

              // Restore auth keys
              const validAuthData = authData.filter(([, value]) => value !== null) as [string, string][];
              if (validAuthData.length > 0) {
                await AsyncStorage.multiSet(validAuthData);
              }

              Alert.alert(t('common.success'), t('settings.clearCacheAlert.success'));
            } catch (error) {
              Alert.alert(t('common.error'), t('settings.clearCacheAlert.error'));
            }
          },
        },
      ]
    );
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(t('common.error'), t('settings.linkError'));
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
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.placeholder} />
      
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <Text style={styles.sectionTitle}>{t('settings.account.title')}</Text>
        <GlassCard style={styles.section}>
          <SettingItem
            icon="person-outline"
            title={t('settings.account.editProfile')}
            subtitle={user?.email}
            onPress={() => navigation.navigate('Profile')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="card-outline"
            title={t('settings.account.subscription')}
            subtitle={user?.subscribed ? t('settings.account.proPlan') : t('settings.account.freePlan')}
            iconColor="#10b981"
            onPress={() => navigation.navigate('Credits')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="key-outline"
            title={t('settings.account.changePassword')}
            iconColor="#f59e0b"
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </GlassCard>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>{t('settings.preferences.title')}</Text>
        <GlassCard style={styles.section}>
          <SettingItem
            icon="notifications-outline"
            title={t('settings.preferences.notifications')}
            subtitle={t('settings.preferences.notificationsSubtitle')}
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
        </GlassCard>

        {/* Language Section */}
        <Text style={styles.sectionTitle}>{t('profile.settings.language')}</Text>
        <GlassCard style={styles.section}>
          <SettingItem
            icon="language-outline"
            title={t('profile.settings.language')}
            subtitle={`${currentLang.flag} ${currentLang.nativeName}`}
            iconColor="#0ea5e9"
            onPress={() => setShowLanguageModal(true)}
          />
        </GlassCard>

        {/* Support Section */}
        <Text style={styles.sectionTitle}>{t('settings.support.title')}</Text>
        <GlassCard style={styles.section}>
          <SettingItem
            icon="help-circle-outline"
            title={t('settings.support.helpFaq')}
            iconColor="#0ea5e9"
            onPress={() => navigation.navigate('Help')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="chatbubble-ellipses-outline"
            title={t('settings.support.contactSupport')}
            iconColor="#10b981"
            onPress={() => openLink('mailto:support@z99.ai')}
          />
        </GlassCard>

        {/* About Section */}
        <Text style={styles.sectionTitle}>{t('settings.about.title')}</Text>
        <GlassCard style={styles.section}>
          <SettingItem
            icon="document-text-outline"
            title={t('settings.about.terms')}
            onPress={() => navigation.navigate('TermsOfService')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="shield-checkmark-outline"
            title={t('settings.about.privacy')}
            iconColor="#10b981"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="information-circle-outline"
            title={t('settings.about.appVersion')}
            subtitle={t('settings.about.versionNumber')}
            iconColor="#6b7280"
            showChevron={false}
          />
        </GlassCard>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>{t('settings.dangerZone.title')}</Text>
        <GlassCard style={[styles.section, { borderColor: '#ef444430' }]}>
          <SettingItem
            icon="log-out-outline"
            title={t('settings.dangerZone.logout')}
            iconColor="#ef4444"
            onPress={handleLogout}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="warning-outline"
            title={t('settings.dangerZone.deleteAccount')}
            subtitle={t('settings.dangerZone.deleteAccountSubtitle')}
            iconColor="#ef4444"
            onPress={handleDeleteAccount}
          />
        </GlassCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('settings.footer.madeWith')}</Text>
          <Text style={styles.footerSubtext}>{t('settings.footer.copyright')}</Text>
        </View>
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color={colors.foregroundMuted} />
              </TouchableOpacity>
            </View>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  currentLangCode === lang.code && styles.languageOptionActive,
                ]}
                onPress={async () => {
                  await changeLanguage(lang.code);
                  setShowLanguageModal(false);
                }}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <View style={styles.languageTextContainer}>
                  <Text style={[
                    styles.languageNativeName,
                    currentLangCode === lang.code && styles.languageTextActive,
                  ]}>{lang.nativeName}</Text>
                  <Text style={styles.languageEnglishName}>{lang.name}</Text>
                </View>
                {currentLangCode === lang.code && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  languageOptionActive: {
    backgroundColor: `${colors.primary}15`,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 14,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageNativeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  languageEnglishName: {
    fontSize: 13,
    color: colors.foregroundMuted,
    marginTop: 2,
  },
  languageTextActive: {
    color: colors.primary,
  },
});

export default SettingsScreen;
