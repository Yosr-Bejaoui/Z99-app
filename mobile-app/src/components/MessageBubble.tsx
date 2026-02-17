import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp?: string;
  modelName?: string;
  avatar?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  content, 
  isUser, 
  timestamp,
  modelName = 'AI',
  avatar,
}) => {
  // User message - ChatGPT style (right-aligned, subtle background)
  if (isUser) {
    return (
      <View style={styles.messageRow}>
        <View style={styles.userMessageContainer}>
          <View style={styles.userBubble}>
            <Text style={styles.messageText}>{content}</Text>
          </View>
        </View>
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={16} color={colors.textSecondary} />
        </View>
      </View>
    );
  }

  // AI message - ChatGPT style (full width, no bubble, just content)
  return (
    <View style={styles.aiMessageRow}>
      <View style={styles.aiAvatar}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="sparkles" size={16} color={colors.primary} />
        )}
      </View>
      <View style={styles.aiMessageContainer}>
        <Text style={styles.modelLabel}>{modelName}</Text>
        <Text style={styles.messageText}>{content}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  userMessageContainer: {
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: colors.userMessage,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
  },
  aiMessageContainer: {
    flex: 1,
    paddingRight: spacing.xl,
  },
  modelLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  messageText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 24,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});

export default MessageBubble;