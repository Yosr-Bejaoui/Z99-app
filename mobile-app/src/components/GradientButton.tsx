import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Animated,
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
  badge?: string;
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
  badge,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }], width: style?.width }}>
      <TouchableOpacity 
        onPress={onPress} 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85} 
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={[
          styles.button,
          styles[variant],
          styles[`size_${size}`],
          isDisabled && styles.buttonDisabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white} 
          />
        ) : (
          <>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
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
            </View>
            {badge && (
              <View style={{
                 backgroundColor: 'rgba(255,255,255,0.2)', 
                 paddingHorizontal: spacing.sm, 
                 paddingVertical: spacing.xs, 
                 borderRadius: 12, 
                 marginLeft: spacing.sm 
              }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{badge}</Text>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
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
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    shadowColor: '#10a37f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
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
    textAlign: 'center',
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
