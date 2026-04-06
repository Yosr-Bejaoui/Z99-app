import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, BRAND_NAME } from '../theme';
import { useAuth, DrawerContext, NavigationParams, useCredits } from '../context';

// Screens
import ChatScreen from '../screens/ChatScreen';
import ImageGenScreen from '../screens/ImageGenScreen';
import ImageEditorScreen from '../screens/ImageEditorScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CreditsScreen from '../screens/CreditsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReferralScreen from '../screens/ReferralScreen';
import TextRemoverScreen from '../screens/TextRemoverScreen';
import BackgroundGenScreen from '../screens/BackgroundGenScreen';
import VideoUpscalerScreen from '../screens/VideoUpscalerScreen';
import VideoWatermarkRemoverScreen from '../screens/VideoWatermarkRemoverScreen';
import ImageWatermarkRemoverScreen from '../screens/ImageWatermarkRemoverScreen';
import ImageUpscalerScreen from '../screens/ImageUpscalerScreen';
import PromptOptimizerScreen from '../screens/PromptOptimizerScreen';
import DonateScreen from '../screens/DonateScreen';
import CustomGPTLibraryScreen from '../screens/CustomGPTLibraryScreen';
import GPTToolsScreen from '../screens/GPTToolsScreen';
import ImageTo3DScreen from '../screens/ImageTo3DScreen';
import BackgroundRemoverScreen from '../screens/BackgroundRemoverScreen';
import TextToSpeechScreen from '../screens/TextToSpeechScreen';
import SpeechToTextScreen from '../screens/SpeechToTextScreen';
import VoiceCloningScreen from '../screens/VoiceCloningScreen';
import TextToVideoScreen from '../screens/TextToVideoScreen';
import ImageToVideoScreen from '../screens/ImageToVideoScreen';






const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = 280;

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

const DrawerContent: React.FC<DrawerContentProps> = ({
  currentRoute,
  onNavigate,
  onClose,
}) => {
  const { user, logout } = useAuth();
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

  const imageTools = [
    { icon: 'image-outline' as const, label: t('drawer.menu.createImage'), route: 'ImageGenScreen' },
    { icon: 'expand-outline' as const, label: 'Image Upscaler', route: 'ImageUpscalerScreen' },
    { icon: 'water-outline' as const, label: 'Watermark Remover', route: 'ImageWatermarkRemoverScreen' },
    { icon: 'color-wand-outline' as const, label: 'Text Remover', route: 'TextRemoverScreen' },
    { icon: 'color-palette-outline' as const, label: 'Generate Background', route: 'BackgroundGenScreen' },
    { icon: 'cut-outline' as const, label: 'Background Remover', route: 'BackgroundRemoverScreen' },
    { icon: 'cube-outline' as const, label: 'Image to 3D', route: 'ImageTo3DScreen' },
  ];

  const videoTools = [
    { icon: 'videocam-outline' as const, label: 'Text to Video', route: 'TextToVideoScreen' },
    { icon: 'images-outline' as const, label: 'Image to Video', route: 'ImageToVideoScreen' },
    { icon: 'cut-outline' as const, label: 'Background Remover', route: 'BackgroundRemoverScreen' },
    { icon: 'expand-outline' as const, label: 'Video Upscaler', route: 'VideoUpscalerScreen' },
    { icon: 'water-outline' as const, label: 'Watermark Remover', route: 'VideoWatermarkRemoverScreen' },
  ];

  const textTools = [
    { icon: 'flash-outline' as const, label: 'Prompt Optimizer', route: 'PromptOptimizerScreen' },
    { icon: 'library-outline' as const, label: 'My Custom GPTs', route: 'CustomGPTLibraryScreen' },
    { icon: 'briefcase-outline' as const, label: 'GPT Tools', route: 'GPTToolsScreen' },
  ];

  const audioTools = [
    { icon: 'mic-outline' as const, label: 'Text to Speech', route: 'TextToSpeechScreen' },
    { icon: 'musical-notes-outline' as const, label: 'Speech to Text', route: 'SpeechToTextScreen' },
      { icon: 'git-branch-outline' as const, label: 'Voice Cloning', route: 'VoiceCloningScreen' },
  ];

  const accountItems = [
    { icon: 'time-outline' as const, label: t('drawer.menu.history'), route: 'HistoryScreen' },
    { icon: 'wallet-outline' as const, label: t('drawer.menu.credits'), route: 'CreditsScreen' },
    { icon: 'people-outline' as const, label: 'Invite a Friend', route: 'ReferralScreen' },
    { icon: 'gift-outline' as const, label: 'Donate Credits', route: 'Donate' },
    { icon: 'person-outline' as const, label: t('drawer.menu.profile'), route: 'ProfileScreen' },
  ];

  const handleNavigate = (route: string) => {
    onNavigate(route);
    onClose();
  };

  return (
    <View style={[styles.drawerContainer, { paddingTop: insets.top }]}>
      {/* Z99 Brand Header */}
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

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

interface DrawerNavigatorProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const DrawerNavigator: React.FC<DrawerNavigatorProps> = ({ navigation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('ChatScreen');
  const [currentParams, setCurrentParams] = useState<NavigationParams | null>(null);
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const openDrawer = useCallback(() => {
    setIsOpen(true);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateX, overlayOpacity]);

  const closeDrawer = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsOpen(false);
    });
  }, [translateX, overlayOpacity]);

  const navigateTo = useCallback((route: string, params?: NavigationParams) => {
    if (route === 'Settings' || route === 'Help') {
      navigation.navigate(route);
    } else {
      setCurrentParams(params || null);
      setCurrentRoute(route);
    }
  }, [navigation]);

  const handleNavigate = (route: string) => {
    navigateTo(route);
  };

  const renderScreen = () => {
    switch (currentRoute) {
      case 'ChatScreen':
        return <ChatScreen />;
      case 'ImageGenScreen':
        return <ImageGenScreen />;
      case 'ImageEditorScreen':
        return <ImageEditorScreen />;
      case 'HistoryScreen':
        return <HistoryScreen />;
      case 'CreditsScreen':
        return <CreditsScreen />;
      case 'ReferralScreen':
        return <ReferralScreen />;
      case 'Donate':
        return <DonateScreen />;

      case 'BackgroundRemoverScreen':
        return <BackgroundRemoverScreen />;
      case 'ImageTo3DScreen':
        return <ImageTo3DScreen />;


      
      

      case 'PromptOptimizerScreen':
        return <PromptOptimizerScreen />;
      case 'CustomGPTLibraryScreen':
        return <CustomGPTLibraryScreen />;
      case 'GPTToolsScreen':
        return <GPTToolsScreen />;
            case 'VideoUpscalerScreen':
        return <VideoUpscalerScreen />;
      case 'ImageUpscalerScreen':
        return <ImageUpscalerScreen />;
      case 'TextToSpeechScreen':
        return <TextToSpeechScreen />;
      case 'SpeechToTextScreen':
        return <SpeechToTextScreen />;
      case 'VoiceCloningScreen':
        return <VoiceCloningScreen />;
      case 'TextToVideoScreen':
        return <TextToVideoScreen />;
      case 'ProfileScreen':
        return <ProfileScreen navigation={navigation} />;
      default:
        return <ChatScreen />;
    }
  };

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, isOpen, navigateTo, currentParams }}>
      <View style={styles.container}>
        {/* Main Content */}
        <View style={styles.mainContent}>
          {renderScreen()}
        </View>

        {/* Overlay */}
        {isOpen && (
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <Animated.View
              style={[
                styles.overlay,
                { opacity: overlayOpacity },
              ]}
            />
          </TouchableWithoutFeedback>
        )}

        {/* Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            { transform: [{ translateX }] },
          ]}
        >
          <DrawerContent
            currentRoute={currentRoute}
            onNavigate={handleNavigate}
            onClose={closeDrawer}
          />
        </Animated.View>
      </View>
    </DrawerContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainContent: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 100,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.sidebar,
    zIndex: 101,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 16,
      },
    }),
  },
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
    marginBottom: 2,
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
    marginTop: 2,
  },
});

export default DrawerNavigator;



