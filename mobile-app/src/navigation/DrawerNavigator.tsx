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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../theme';
import { useAuth, DrawerContext } from '../context';

// Screens
import ChatScreen from '../screens/ChatScreen';
import ImageGenScreen from '../screens/ImageGenScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CreditsScreen from '../screens/CreditsScreen';
import ProfileScreen from '../screens/ProfileScreen';

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
  const insets = useSafeAreaInsets();

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

  const menuItems = [
    { icon: 'chatbubble-outline' as const, label: 'Chat', route: 'ChatScreen' },
    { icon: 'image-outline' as const, label: 'Create Image', route: 'ImageGenScreen' },
    { icon: 'time-outline' as const, label: 'History', route: 'HistoryScreen' },
    { icon: 'wallet-outline' as const, label: 'Credits', route: 'CreditsScreen' },
    { icon: 'person-outline' as const, label: 'Profile', route: 'ProfileScreen' },
  ];

  const handleNavigate = (route: string) => {
    onNavigate(route);
    onClose();
  };

  return (
    <View style={[styles.drawerContainer, { paddingTop: insets.top }]}>
      {/* New Chat Button */}
      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => handleNavigate('ChatScreen')}
      >
        <Ionicons name="add" size={20} color={colors.white} />
        <Text style={styles.newChatText}>New chat</Text>
      </TouchableOpacity>

      {/* Main Menu */}
      <View style={styles.menuSection}>
        {menuItems.map((item) => (
          <DrawerMenuItem
            key={item.route}
            icon={item.icon}
            label={item.label}
            isActive={currentRoute === item.route}
            onPress={() => handleNavigate(item.route)}
          />
        ))}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Additional Options */}
      <View style={styles.menuSection}>
        <DrawerMenuItem
          icon="settings-outline"
          label="Settings"
          onPress={() => handleNavigate('Settings')}
        />
        <DrawerMenuItem
          icon="help-circle-outline"
          label="Help & FAQ"
          onPress={() => handleNavigate('Help')}
        />
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* User Profile Section */}
      <View style={[styles.userSection, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => handleNavigate('ProfileScreen')}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name || user?.email || 'User'}
            </Text>
            <Text style={styles.userCredits}>
              {user?.credits?.toLocaleString() || 0} credits
            </Text>
          </View>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface DrawerNavigatorProps {
  navigation: any;
}

const DrawerNavigator: React.FC<DrawerNavigatorProps> = ({ navigation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('ChatScreen');
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

  const handleNavigate = (route: string) => {
    if (route === 'Settings' || route === 'Help') {
      navigation.navigate(route);
    } else {
      setCurrentRoute(route);
    }
  };

  const renderScreen = () => {
    switch (currentRoute) {
      case 'ChatScreen':
        return <ChatScreen />;
      case 'ImageGenScreen':
        return <ImageGenScreen />;
      case 'HistoryScreen':
        return <HistoryScreen />;
      case 'CreditsScreen':
        return <CreditsScreen />;
      case 'ProfileScreen':
        return <ProfileScreen navigation={navigation} />;
      default:
        return <ChatScreen />;
    }
  };

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, isOpen }}>
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
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
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
    backgroundColor: colors.card,
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
