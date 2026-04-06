/**
 * Design Tokens System
 * Semantic naming layer for consistent theming
 * Single source of truth for all design values
 */

import { colors, spacing, borderRadius, typography } from './index';

export const tokens = {
  // Color tokens - semantic names mapped to theme colors
  color: {
    // Backgrounds
    bg: {
      primary: colors.background,
      secondary: colors.backgroundSecondary,
      tertiary: colors.backgroundTertiary,
      surface: colors.surface,
      card: colors.card,
      sidebar: colors.sidebar,
    },
    // Text
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      muted: colors.textMuted,
      inverse: colors.background,
    },
    // Interactive
    interactive: {
      primary: colors.primary,
      primaryDark: colors.primaryDark,
      primaryLight: colors.primaryLight,
      secondary: colors.secondary,
      focus: colors.ring,
    },
    // Semantic
    semantic: {
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
    },
    // Borders
    border: {
      default: colors.border,
      light: colors.borderLight,
    },
  },

  // Spacing tokens - semantic names
  space: {
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
    xxl: spacing.xxl,
    xxxl: spacing.xxxl,
  },

  // Border radius tokens
  radius: {
    xs: borderRadius.xs,
    sm: borderRadius.sm,
    md: borderRadius.md,
    lg: borderRadius.lg,
    xl: borderRadius.xl,
    full: borderRadius.full,
  },

  // Font tokens
  font: {
    size: {
      xs: typography.fontSizes.xs,
      sm: typography.fontSizes.sm,
      md: typography.fontSizes.md,
      lg: typography.fontSizes.lg,
      xl: typography.fontSizes.xl,
      '2xl': typography.fontSizes['2xl'],
      '3xl': typography.fontSizes['3xl'],
    },
    weight: {
      normal: typography.fontWeights.normal,
      medium: typography.fontWeights.medium,
      semibold: typography.fontWeights.semibold,
      bold: typography.fontWeights.bold,
    },
  },
};

// Aliases for common patterns
export const semantic = {
  // Common button styles
  buttonPrimary: {
    backgroundColor: tokens.color.interactive.primary,
    borderRadius: tokens.radius.md,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.color.interactive.primary,
    borderRadius: tokens.radius.md,
  },
  // Card styles
  card: {
    backgroundColor: tokens.color.bg.card,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.color.border.default,
  },
  // Input styles
  input: {
    backgroundColor: colors.input,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border.default,
  },
};

// Export all as default
export default tokens;
