/**
 * Color palette inspired by the web design
 * Dark theme with teal/cyan accent colors
 */

export const colors = {
  // Background colors
  background: '#0f1115',
  backgroundSecondary: '#14171c',
  backgroundTertiary: '#1a1e24',

  // Foreground/Text colors
  foreground: '#e8ebf0',
  foregroundSecondary: '#a0a7b5',
  foregroundMuted: '#6b7280',

  // Text color aliases (for convenience)
  textPrimary: '#e8ebf0',
  textSecondary: '#a0a7b5',
  textMuted: '#6b7280',

  // Primary accent (teal/cyan gradient)
  primary: '#2dd4bf',
  primaryDark: '#14b8a6',
  secondary: '#0ea5e9',

  // Card and surface colors
  card: '#16191e',
  cardBorder: '#252a33',
  surface: 'rgba(22, 26, 32, 0.6)',

  // Interactive states
  border: '#2a303a',
  input: '#2a303a',
  ring: '#2dd4bf',

  // Status colors
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const gradients = {
  primary: ['#2dd4bf', '#0ea5e9'] as const,
  primaryReverse: ['#0ea5e9', '#2dd4bf'] as const,
  background: ['rgba(15, 17, 21, 0.6)', 'rgba(15, 17, 21, 0.8)', '#0f1115'] as const,
};

export const shadows = {
  glow: {
    shadowColor: '#2dd4bf',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  fontWeights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export default {
  colors,
  gradients,
  shadows,
  spacing,
  borderRadius,
  typography,
};
