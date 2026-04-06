import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, borderRadius, spacing } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';

interface CreditBadgeProps {
  credits: number;
}

export const CreditBadge: React.FC<CreditBadgeProps> = ({ credits }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <TouchableOpacity 
      style={styles.badge} 
      onPress={() => navigation.navigate('CreditsScreen' as any)}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>🪙</Text>
      <Text style={styles.text}>{credits.toLocaleString()}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  text: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default CreditBadge;