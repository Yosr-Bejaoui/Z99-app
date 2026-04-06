import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius } from '../theme';
import { useAuth, useCredits } from '../context';

interface DrawerMenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isActive?: boolean;
}

const DrawerMenuItem: React.FC<DrawerMenuItemProps> = ({
  icon,
  label,
  onPress,
  isActive,
}) => (
  <TouchableOpacity
    style={[styles.menuItem, isActive && styles.menuItemActive]}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ selected: isActive }}
  >
    <Ionicons
      name={icon}
      size={20}
      color={isActive ? colors.primary : colors.textSecondary}
    />
    <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

interface DrawerContentProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onClose: () => void;
}

export const DrawerContent: React.FC<DrawerContentProps> = ({
  currentRoute,
  onNavigate,
  onClose,
}) => {
  const { user } = useAuth();
  const { credits } = useCredits();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

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

  const handleNavigate = (route: string) => {
    onNavigate(route);
    onClose();
  };

  const imageTools = [
    { icon: 'image-outline' as const, label: t('drawer.menu.createImage'), route: 'ImageGenScreen' },
    { icon: 'image-outline' as const, label: t('drawer.menu.imageEditor'), route: 'ImageEditorScreen' },
    { icon: 'expand-outline' as const, label: t('drawer.tools.imageUpscaler'), route: 'ImageUpscalerScreen' },

    { icon: 'cut-outline' as const, label: 'Background Editor', route: 'BackgroundRemoverScreen' },
    { icon: 'cube-outline' as const, label: t('drawer.tools.imageTo3D'), route: 'ImageTo3DScreen' },
  ];

  const videoTools = [
    { icon: 'videocam-outline' as const, label: 'AI Video Generator', route: 'TextToVideoScreen' },
    { icon: 'flash-outline' as const, label: t('drawer.menu.videoEffects'), route: 'VideoEffectsScreen' },
    { icon: 'expand-outline' as const, label: t('drawer.tools.videoUpscaler'), route: 'VideoUpscalerScreen' },
  ];

  const textTools = [
    { icon: 'flash-outline' as const, label: t('drawer.tools.promptOptimizer'), route: 'PromptOptimizerScreen' },
    { icon: 'library-outline' as const, label: t('drawer.tools.customGPTs'), route: 'CustomGPTLibraryScreen' },
    { icon: 'briefcase-outline' as const, label: t('drawer.tools.gptTools'), route: 'GPTToolsScreen' },
  ];

  const audioTools = [
    { icon: 'mic-outline' as const, label: t('drawer.tools.textToSpeech'), route: 'TextToSpeechScreen' },
    { icon: 'musical-notes-outline' as const, label: t('drawer.tools.speechToText'), route: 'SpeechToTextScreen' },
    { icon: 'git-branch-outline' as const, label: t('drawer.tools.voiceCloning'), route: 'VoiceCloningScreen' },
  ];

  const accountItems = [
    { icon: 'time-outline' as const, label: t('drawer.menu.history'), route: 'HistoryScreen' },
    { icon: 'wallet-outline' as const, label: t('drawer.menu.credits'), route: 'CreditsScreen' },
    { icon: 'people-outline' as const, label: 'Invite a Friend', route: 'ReferralScreen' },
    { icon: 'gift-outline' as const, label: 'Donate Credits', route: 'Donate' },
    { icon: 'person-outline' as const, label: t('drawer.menu.profile'), route: 'ProfileScreen' },
  ];

  return (
    <View style={[styles.drawerContainer, { paddingTop: insets.top }]}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <Ionicons name="sparkles" size={24} color={colors.primary} />
        <Text style={styles.brandName}>{t('app.name')}</Text>
      </View>

      {/* Primary Section */}
      <Text style={styles.sectionLabel}>PRIMARY</Text>
      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => handleNavigate('ChatScreen')}
        accessibilityRole="button"
        accessibilityLabel={t('drawer.a11y.newChat')}
      >
        <Ionicons name="add" size={20} color={colors.white} />
        <Text style={styles.newChatText}>{t('drawer.newChat')}</Text>
      </TouchableOpacity>

      {/* Main Menu */}
      <ScrollView 
        style={styles.menuSectionContainer}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.divider} />
        
        {/* TOOLS */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>IMAGE TOOLS</Text>
          {imageTools.map((item) => (
            <DrawerMenuItem
              key={item.route}
              icon={item.icon}
              label={item.label}
              onPress={() => handleNavigate(item.route)}
              isActive={currentRoute === item.route}
            />
          ))}
        
          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>VIDEO TOOLS</Text>
          {videoTools.map((item) => (
            <DrawerMenuItem
              key={item.route}
              icon={item.icon}
              label={item.label}
              onPress={() => handleNavigate(item.route)}
              isActive={currentRoute === item.route}
            />
          ))}

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>TEXT & GPT TOOLS</Text>
          {textTools.map((item) => (
            <DrawerMenuItem
              key={item.route}
              icon={item.icon}
              label={item.label}
              onPress={() => handleNavigate(item.route)}
              isActive={currentRoute === item.route}
            />
          ))}

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>AUDIO TOOLS</Text>
          {audioTools.map((item) => (
            <DrawerMenuItem
              key={item.route}
              icon={item.icon}
              label={item.label}
              onPress={() => handleNavigate(item.route)}
              isActive={currentRoute === item.route}
            />
          ))}

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          {accountItems.map((item) => (
            <DrawerMenuItem
              key={item.route}
              icon={item.icon}
              label={item.label}
              isActive={currentRoute === item.route}
              onPress={() => handleNavigate(item.route)}
            />
          ))}
        </View>

        {/* Flexible space to push Support to bottom */}
        <View style={{ flex: 1 }} />

        {/* SUPPORT */}
        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>SUPPORT</Text>
        <View style={styles.menuSection}>
          <DrawerMenuItem
            icon="settings-outline"
            label={t('drawer.menu.settings')}
            onPress={() => handleNavigate('Settings')}
          />
          <DrawerMenuItem
            icon="help-circle-outline"
            label={t('drawer.menu.helpFaq')}
            onPress={() => handleNavigate('Help')}
          />
        </View>
      </ScrollView>

      {/* User Profile Section */}
      <View style={[styles.userSection, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => handleNavigate('ProfileScreen')}
          accessibilityRole="button"
          accessibilityLabel={`Profile: ${user?.name || user?.email || t('drawer.defaultUser')}`}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name || user?.email || t('drawer.defaultUser')}
            </Text>
            <Text style={styles.userCredits}>
              {(credits?.credits ?? 0).toLocaleString()} {t('drawer.credits')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: colors.sidebar,
  },
  menuSectionContainer: {
    flex: 1,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  newChatText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  menuSection: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  menuItemActive: {
    backgroundColor: 'rgba(16, 163, 127, 0.12)',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  menuLabelActive: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
    marginHorizontal: spacing.md,
  },
  userSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  userCredits: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});

export default DrawerContent;
