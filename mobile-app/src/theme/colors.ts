/**
 * ChatGPT-inspired color palette
 * Clean dark theme with minimal accent colors
 */

export const colors = {
  // Background colors (ChatGPT-inspired dark grays)
  background: '#212121',
  backgroundSecondary: '#171717',
  backgroundTertiary: '#2f2f2f',
  sidebar: '#171717',
  chatArea: '#212121',

  // Foreground/Text colors
  foreground: '#ececec',
  foregroundSecondary: '#b4b4b4',
  foregroundMuted: '#8e8e8e',

  // Text color aliases
  textPrimary: '#ececec',
  textSecondary: '#b4b4b4',
  textMuted: '#8e8e8e',

  // Primary accent (subtle teal for actions)
  primary: '#10a37f',
  primaryDark: '#0d8a6a',
  primaryLight: '#19c37d',
  secondary: '#10a37f',

  // Card and surface colors
  card: '#2f2f2f',
  cardHover: '#3f3f3f',
  cardBorder: '#3f3f3f',
  surface: '#2f2f2f',
  surfaceHover: '#424242',

  // Interactive states
  border: '#3f3f3f',
  borderLight: '#4f4f4f',
  input: '#3f3f3f',
  inputFocus: '#4f4f4f',
  ring: '#10a37f',

  // Message colors
  userMessage: '#2f2f2f',
  aiMessage: 'transparent',
  messageHover: '#3a3a3a',

  // Status colors
  success: '#10a37f',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',

  // Special
  white: '#ffffff',
  black: '#000000',
};

// Minimal gradients (ChatGPT uses mostly solid colors)
export const gradients = {
  primary: ['#10a37f', '#19c37d'] as const,
  subtle: ['#2f2f2f', '#212121'] as const,
  dark: ['#171717', '#212121'] as const,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  fontSizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
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
