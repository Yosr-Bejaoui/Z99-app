import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, borderRadius, spacing } from '../theme';

interface GradientButtonProps {
  onPress: () => void;
  title: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  onPress,
  title,
  icon,
  style,
  textStyle,
  disabled = false,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={disabled}>
      <LinearGradient
        colors={disabled ? ['#3a3f47', '#2a2f37'] : gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.button, style, disabled && styles.buttonDisabled]}
      >
        <Text style={[styles.buttonText, textStyle, disabled && styles.buttonTextDisabled]}>
          {title}
        </Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: colors.foregroundMuted,
  },
  iconContainer: {
    marginLeft: spacing.xs,
  },
});

export default GradientButton;
