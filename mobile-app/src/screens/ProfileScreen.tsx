import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrawer } from '../context';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../context';
import { authService, getErrorMessage } from '../services';
import GradientButton from '../components/GradientButton';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguage, getCurrentLanguage } from '../i18n';
import type { LanguageCode } from '../i18n';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

interface ProfileScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout, isLoading, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const [settings, setSettings] = useState({
    notifications: true,
  });
  const [loggingOut, setLoggingOut] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { t, i18n } = useTranslation();
  const currentLangCode = (i18n.language || 'en') as LanguageCode;
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === currentLangCode) || SUPPORTED_LANGUAGES[0];

  const handleSignOut = async () => {
    Alert.alert(
      t('profile.signOut.title'),
      t('profile.signOut.message'),
      [
        { text: t('profile.signOut.cancel'), style: 'cancel' },
        {
          text: t('profile.signOut.confirm'),
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
              Alert.alert(t('common.error'), t('profile.signOut.error'));
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert(t('profile.image.permissionTitle'), t('profile.image.libraryPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadProfilePicture(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert(t('profile.image.permissionTitle'), t('profile.image.cameraPermission'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadProfilePicture(result.assets[0].uri);
    }
  };

  const uploadProfilePicture = async (uri: string) => {
    try {
      setIsUploadingImage(true);
      await authService.updateProfilePicture(uri);
      refreshUser?.();
      Alert.alert(t('profile.image.success'), t('profile.image.successMessage'));
    } catch (error) {
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleOpenEditModal = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setShowEditModal(true);
  };

  const showImageOptions = () => {
    Alert.alert(
      t('profile.image.changeTitle'),
      t('profile.image.chooseOption'),
      [
        { text: t('profile.image.takePhoto'), onPress: handleTakePhoto },
        { text: t('profile.image.chooseFromLibrary'), onPress: handlePickImage },
        { text: t('profile.image.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert(t('common.error'), t('profile.update.nameEmpty'));
      return;
    }

    try {
      setIsUpdating(true);
      await authService.updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
      });
      refreshUser?.();
      setShowEditModal(false);
      Alert.alert(t('profile.update.success'), t('profile.update.successMessage'));
    } catch (error) {
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setIsUpdating(false);
    }
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
    return t('common.na');
  };

  // Get subscription status color
  const getSubscriptionColor = () => {
    const planName = user?.subscription?.plan?.name?.toLowerCase() || 'free';
    if (planName.includes('enterprise')) return '#10a37f';
    if (planName.includes('pro')) return colors.primary;
    return colors.textMuted;
  };

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowEditModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('profile.editModal.title')}</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('profile.editModal.nameLabel')}</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('profile.editModal.namePlaceholder')}
              placeholderTextColor={colors.textMuted}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('profile.editModal.emailLabel')}</Text>
            <TextInput
              style={styles.input}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder={t('profile.editModal.emailPlaceholder')}
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <GradientButton
            title={isUpdating ? t('profile.editModal.saving') : t('profile.editModal.saveButton')}
            onPress={handleUpdateProfile}
            disabled={isUpdating}
            style={styles.saveButton}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Top Header with Menu */}
      <View style={styles.topHeader}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={openDrawer}
        >
          <Ionicons name="menu-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>{t('profile.title')}</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={22} color={colors.foreground} />
        </TouchableOpacity>
      
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {isUploadingImage ? (
              <View style={[styles.avatarGradient, styles.avatarLoading]}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : user?.profile_picture ? (
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
            <TouchableOpacity style={styles.editAvatarButton} onPress={showImageOptions}>
              <Ionicons name="camera" size={14} color={colors.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.userName}>{user?.name || t('profile.defaultName')}</Text>
            <TouchableOpacity onPress={handleOpenEditModal}>
              <Ionicons name="pencil-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          
          {/* Subscription Badge */}
          <View style={[styles.subscriptionBadge, { borderColor: getSubscriptionColor() }]}>
            <Ionicons name="star" size={14} color={getSubscriptionColor()} />
            <Text style={[styles.subscriptionText, { color: getSubscriptionColor() }]}>
              {user?.subscription?.plan?.name || 'Free'} {t('profile.planSuffix')}
            </Text>
          </View>
          
          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{user?.total_words_used || 0}</Text>
              <Text style={styles.quickStatLabel}>{t('profile.stats.words')}</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{user?.total_images_generated || 0}</Text>
              <Text style={styles.quickStatLabel}>{t('profile.stats.images')}</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{user?.subscription?.plan?.name || 'Free'}</Text>
              <Text style={styles.quickStatLabel}>{t('profile.stats.plan')}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.account.title')}</Text>
          <GlassCard style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="mail" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('profile.account.emailLabel')}</Text>
                <Text style={styles.infoValue}>{user?.email || t('common.na')}</Text>
              </View>
              <TouchableOpacity onPress={handleOpenEditModal}>
                <Ionicons name="pencil-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="lock-closed" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('profile.account.changePassword')}</Text>
                <Text style={styles.infoValue}>{t('profile.account.updatePassword')}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('ChangePassword')}>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="card" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('profile.account.planLabel')}</Text>
                <Text style={styles.infoValue}>{user?.subscription?.plan?.name || t('profile.account.freeTier')}</Text>
              </View>
              <TouchableOpacity style={styles.upgradeButton} onPress={() => navigation.navigate('SubscriptionPlans')}>
                <Text style={styles.upgradeButtonText}>{t('profile.account.upgrade')}</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.settings.title')}</Text>
          <GlassCard style={styles.settingsCard}>
            {/* Notifications */}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => toggleSetting('notifications')}
            >
              <View style={[styles.settingsIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.settingsLabel}>{t('profile.settings.notifications')}</Text>
              <Switch
                value={settings.notifications}
                onValueChange={() => toggleSetting('notifications')}
                trackColor={{ false: colors.surface, true: colors.primary }}
                thumbColor={colors.foreground}
              />
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            {/* Language */}
            <TouchableOpacity style={styles.settingsRow} onPress={() => setShowLanguageModal(true)}>
              <View style={[styles.settingsIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="language-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.settingsLabel}>{t('profile.language')}</Text>
              <View style={styles.settingsBadge}>
                <Text style={styles.settingsBadgeText}>{currentLang.flag} {currentLang.nativeName}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ marginLeft: spacing.sm }} />
            </TouchableOpacity>
          </GlassCard>
        </View>

        {/* Support & Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.support.title')}</Text>
          <GlassCard style={styles.settingsCard}>
            {/* Help */}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => navigation.navigate('Help')}
            >
              <View style={[styles.settingsIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.settingsLabel}>{t('profile.support.helpSupport')}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            {/* About */}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => navigation.navigate('About')}
            >
              <View style={[styles.settingsIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.settingsLabel}>{t('profile.support.about')}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            {/* Terms of Service */}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => navigation.navigate('TermsOfService')}
            >
              <View style={[styles.settingsIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.settingsLabel}>{t('profile.support.terms')}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            {/* Privacy Policy */}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              <View style={[styles.settingsIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.settingsLabel}>{t('profile.support.privacy')}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
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
            {loggingOut ? t('profile.signOut.signingOut') : t('profile.signOut.confirm')}
          </Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>{t('profile.version')}</Text>
      </ScrollView>
      
      {renderEditModal()}

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
                <Ionicons name="close" size={24} color={colors.textMuted} />
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
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
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
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
    color: colors.foreground,
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
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: spacing.lg,
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
    marginBottom: spacing.xs,
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
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoCard: {
    padding: spacing.xs,
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
    padding: spacing.xs,
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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
    gap: spacing.sm,
    marginBottom: spacing.lg,
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
    color: colors.textPrimary,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
  // Name container with edit button
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  editNameButton: {
    padding: spacing.xs,
  },
  // Subscription badge
  subscriptionBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  subscriptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
  },
  // Avatar loading overlay
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  // Language picker styles
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
    color: colors.textPrimary,
  },
  languageEnglishName: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  languageTextActive: {
    color: colors.primary,
  },
});

export default ProfileScreen;
