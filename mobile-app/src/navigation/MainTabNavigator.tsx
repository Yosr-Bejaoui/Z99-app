import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

import ChatScreen from '../screens/ChatScreen';
import ImageGenScreen from '../screens/ImageGenScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CreditsScreen from '../screens/CreditsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

interface TabIconProps {
  focused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
}

const TabIcon: React.FC<TabIconProps> = ({ focused, iconName, iconOutline }) => {
  return (
    <View style={[focused && styles.activeTabPill]}>
      <Ionicons 
        name={focused ? iconName : iconOutline} 
        size={22} 
        color={focused ? colors.primary : colors.textMuted} 
      />
    </View>
  );
};

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="chatbubble" iconOutline="chatbubble-outline" />
          ),
        }}
      />
      <Tab.Screen
        name="Create"
        component={ImageGenScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="add-circle" iconOutline="add-circle-outline" />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="time" iconOutline="time-outline" />
          ),
        }}
      />
      <Tab.Screen
        name="Credits"
        component={CreditsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="wallet" iconOutline="wallet-outline" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="person" iconOutline="person-outline" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? 28 : spacing.sm,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  activeTabPill: {
    backgroundColor: 'rgba(16, 163, 127, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
});

export default MainTabNavigator;
