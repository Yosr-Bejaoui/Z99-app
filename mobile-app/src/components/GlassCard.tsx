import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, borderRadius, spacing } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  style,
  variant = 'default',
}) => {
  return (
    <View style={[
      styles.card, 
      variant === 'elevated' && styles.elevated,
      variant === 'outlined' && styles.outlined,
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: 'rgba(0,0,0,0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  elevated: {
    backgroundColor: colors.backgroundTertiary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export default GlassCard;
