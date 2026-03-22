import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import { useCredits } from '../context/CreditsContext';

interface CreditsHeaderProps {
  onPress?: () => void;
}

const CreditsHeader: React.FC<CreditsHeaderProps> = ({ onPress }) => {
  const { credits, isRefreshing } = useCredits();

  const displayCredits = credits?.credits || 0;

  const getCreditsColor = () => {
    if (displayCredits >= 1000) return colors.primary;
    if (displayCredits >= 100) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: getCreditsColor() }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${getCreditsColor()}20` }]}>
          {isRefreshing ? (
            <ActivityIndicator size="small" color={getCreditsColor()} />
          ) : (
            <Ionicons name="wallet" size={16} color={getCreditsColor()} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Credits</Text>
          <Text style={[styles.value, { color: getCreditsColor() }]}>
            {displayCredits.toLocaleString()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: `${colors.primary}08`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default CreditsHeader;
