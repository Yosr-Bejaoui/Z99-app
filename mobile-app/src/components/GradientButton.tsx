import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { colors, borderRadius, spacing } from '../theme';

interface GradientButtonProps {
  onPress: () => void;
  title: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  onPress,
  title,
  icon,
  style,
  textStyle,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7} 
      disabled={isDisabled}
    >
      <View style={[
        styles.button,
        styles[variant],
        styles[`size_${size}`],
        isDisabled && styles.buttonDisabled,
        style,
      ]}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white} 
          />
        ) : (
          <>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={[
              styles.buttonText,
              styles[`${variant}Text`],
              styles[`size_${size}_text`],
              isDisabled && styles.buttonTextDisabled,
              textStyle,
            ]}>
              {title}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.card,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  size_sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  size_md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  size_lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  outlineText: {
    color: colors.textPrimary,
  },
  ghostText: {
    color: colors.primary,
  },
  size_sm_text: {
    fontSize: 13,
  },
  size_md_text: {
    fontSize: 15,
  },
  size_lg_text: {
    fontSize: 17,
  },
  buttonTextDisabled: {
    color: colors.textMuted,
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
});

export default GradientButton;
