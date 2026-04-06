import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';
import { GlassCard } from '../GlassCard';

interface Props {
  text?: string;
}

export const FullScreenLoader: React.FC<Props> = ({ text = 'Processing...' }) => {
  return (
    <GlassCard style={styles.card}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{text}</Text>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
  },
  text: {
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  }
});

export default FullScreenLoader;