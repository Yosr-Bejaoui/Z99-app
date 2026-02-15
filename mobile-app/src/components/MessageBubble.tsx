import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ content, isUser, timestamp }) => {
  if (isUser) {
    return (
      <View style={styles.userContainer}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userBubble}
        >
          <Text style={styles.userText}>{content}</Text>
        </LinearGradient>
        {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.assistantContainer}>
      <View style={styles.assistantHeader}>
        <View style={styles.assistantAvatar}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
        </View>
        <Text style={styles.assistantLabel}>AI Assistant</Text>
      </View>
      <View style={styles.assistantBubble}>
        <Text style={styles.assistantText}>{content}</Text>
      </View>
      {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  userContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userBubble: {
    maxWidth: '85%',
    borderRadius: 20,
    borderBottomRightRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  assistantContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assistantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  assistantLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  assistantBubble: {
    maxWidth: '85%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  assistantText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    marginHorizontal: 4,
  },
});

export default MessageBubble;
