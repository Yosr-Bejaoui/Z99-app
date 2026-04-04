import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../theme';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'chat' | 'history' | 'images' | 'search';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconColor = colors.primary,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'chat':
        return {
          iconBg: ['rgba(45, 212, 191, 0.15)', 'rgba(45, 212, 191, 0.05)'],
          iconColor: '#2dd4bf',
        };
      case 'history':
        return {
          iconBg: ['rgba(16, 163, 127, 0.15)', 'rgba(16, 163, 127, 0.05)'],
          iconColor: '#10a37f',
        };
      case 'images':
        return {
          iconBg: ['rgba(156, 163, 175, 0.15)', 'rgba(156, 163, 175, 0.05)'],
          iconColor: '#9ca3af',
        };
      case 'search':
        return {
          iconBg: ['rgba(209, 213, 219, 0.15)', 'rgba(209, 213, 219, 0.05)'],
          iconColor: '#d1d5db',
        };
      default:
        return {
          iconBg: ['rgba(45, 212, 191, 0.15)', 'rgba(45, 212, 191, 0.05)'],
          iconColor: iconColor,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <LinearGradient
          colors={variantStyles.iconBg as [string, string]}
          style={styles.iconContainer}
        >
          <Ionicons
            name={icon}
            size={48}
            color={variantStyles.iconColor}
          />
        </LinearGradient>
        
        {/* Decorative dots */}
        <View style={[styles.dot, styles.dotTopLeft, { backgroundColor: variantStyles.iconColor + '40' }]} />
        <View style={[styles.dot, styles.dotTopRight, { backgroundColor: variantStyles.iconColor + '30' }]} />
        <View style={[styles.dot, styles.dotBottomLeft, { backgroundColor: variantStyles.iconColor + '20' }]} />
        <View style={[styles.dot, styles.dotBottomRight, { backgroundColor: variantStyles.iconColor + '50' }]} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: variantStyles.iconColor + '50' }]}
          onPress={onAction}
          activeOpacity={0.7}
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={variantStyles.iconColor}
          />
          <Text style={[styles.actionText, { color: variantStyles.iconColor }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Predefined empty states for common scenarios
export const ChatEmptyState: React.FC<{ onStartChat?: () => void }> = ({ onStartChat }) => (
  <EmptyState
    icon="chatbubbles-outline"
    title="No messages yet"
    description="Start a conversation with our AI models. Ask anything!"
    actionLabel="Start chatting"
    onAction={onStartChat}
    variant="chat"
  />
);

export const HistoryEmptyState: React.FC<{ onStartNew?: () => void }> = ({ onStartNew }) => (
  <EmptyState
    icon="time-outline"
    title="No history yet"
    description="Your conversations and creations will appear here"
    actionLabel="Create something"
    onAction={onStartNew}
    variant="history"
  />
);

export const ImagesEmptyState: React.FC<{ onGenerate?: () => void }> = ({ onGenerate }) => (
  <EmptyState
    icon="images-outline"
    title="No images yet"
    description="Generate amazing images with AI. Describe what you want to see!"
    actionLabel="Generate image"
    onAction={onGenerate}
    variant="images"
  />
);

export const SearchEmptyState: React.FC<{ query: string }> = ({ query }) => (
  <EmptyState
    icon="search-outline"
    title="No results found"
    description={`We couldn't find anything for "${query}". Try a different search term.`}
    variant="search"
  />
);

export const ErrorState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    icon="alert-circle-outline"
    iconColor="#ef4444"
    title="Something went wrong"
    description="We couldn't load the content. Please try again."
    actionLabel="Try again"
    onAction={onRetry}
  />
);

export const OfflineState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    icon="cloud-offline-outline"
    iconColor="#f59e0b"
    title="You're offline"
    description="Check your internet connection and try again"
    actionLabel="Retry"
    onAction={onRetry}
  />
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotTopLeft: {
    top: 10,
    left: -5,
  },
  dotTopRight: {
    top: 0,
    right: 10,
  },
  dotBottomLeft: {
    bottom: 5,
    left: 10,
  },
  dotBottomRight: {
    bottom: 15,
    right: -5,
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSizes.md,
    color: colors.foregroundMuted,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  actionText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
  },
});

export default EmptyState;
