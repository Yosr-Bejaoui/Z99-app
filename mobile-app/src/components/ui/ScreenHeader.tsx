import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useDrawer, useCredits } from '../../context';
import { colors, spacing, borderRadius } from '../../theme';

interface ScreenHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
  showBack?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, showBack, rightAction }) => {
  const navigation = useNavigation<any>();
  const { openDrawer, navigateTo } = useDrawer();
  const { credits } = useCredits();

  const handleLeftPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (showBack) {
      if (navigation.canGoBack()) navigation.goBack(); else navigateTo('ChatScreen');
    } else {
      openDrawer();
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.iconButton} onPress={handleLeftPress}>
        <Ionicons
          name={showBack ? "chevron-back" : "menu-outline"}
          size={28}
          color={colors.textPrimary}
        />
      </TouchableOpacity>
      
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      
      <View style={[styles.iconButtonRight, {flexDirection: "row", gap: spacing.sm, width: "auto"}]}>
        {rightAction}
        <View style={styles.coinBadge}>
          <Text style={styles.coinBadgeText}>{"\uD83E\uDE99"} {credits?.credits || 0}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconButton: {
    width: 60,
    height: 40,
    
    alignItems: 'flex-start',
  },
  iconButtonRight: {
    minWidth: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
  },
  coinBadgeText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ScreenHeader;
