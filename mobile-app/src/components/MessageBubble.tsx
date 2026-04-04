import React from 'react';
import { View, Text, StyleSheet, Image, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  timestamp?: string;
  modelName?: string;
  avatar?: string;
  attachments?: MessageAttachment[];
}

interface MessageAttachment {
  id: string;
  uri: string;
  name: string;
  type: 'image' | 'document';
}

type ParsedBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'ordered-item'; text: string; index: number }
  | { type: 'bullet-item'; text: string }
  | { type: 'code'; code: string; language: string }
  | { type: 'spacer' };

const INLINE_TOKEN_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|`([^`]+)`|(https?:\/\/[^\s]+)/g;

const parseContentToBlocks = (rawContent: string): ParsedBlock[] => {
  const normalized = rawContent.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [];
  }

  const lines = normalized.split('\n');
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      blocks.push({ type: 'spacer' });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const language = trimmed.replace('```', '').trim();
      i += 1;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length && lines[i].trim().startsWith('```')) {
        i += 1;
      }
      blocks.push({
        type: 'code',
        code: codeLines.join('\n'),
        language,
      });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      i += 1;
      continue;
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      blocks.push({
        type: 'ordered-item',
        index: Number(orderedMatch[1]),
        text: orderedMatch[2],
      });
      i += 1;
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      blocks.push({
        type: 'bullet-item',
        text: bulletMatch[1],
      });
      i += 1;
      continue;
    }

    const paragraphLines: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (!next) {
        break;
      }
      if (
        next.startsWith('```') ||
        /^(#{1,3})\s+/.test(next) ||
        /^(\d+)\.\s+/.test(next) ||
        /^[-*]\s+/.test(next)
      ) {
        break;
      }
      paragraphLines.push(next);
      i += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
  }

  return blocks;
};

const normalizeHeadingText = (text: string) =>
  text
    .replace(/^\*\*(.+)\*\*$/, '$1')
    .replace(/^__(.+)__$/, '$1')
    .trim();

const sanitizeInlineMarkdownMarkers = (text: string) =>
  text
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1');

const openExternalLink = async (url: string) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  } catch {
    // Ignore invalid URLs or failed open attempts.
  }
};

const renderInlineText = (text: string, keyPrefix: string) => {
  const cleanedText = sanitizeInlineMarkdownMarkers(text);
  const parts: Array<string | React.ReactNode> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tokenIndex = 0;

  INLINE_TOKEN_REGEX.lastIndex = 0;

  while ((match = INLINE_TOKEN_REGEX.exec(cleanedText)) !== null) {
    const [matchedToken] = match;
    const tokenStart = match.index;

    if (tokenStart > lastIndex) {
      parts.push(cleanedText.slice(lastIndex, tokenStart));
    }

    const markdownLabel = match[1];
    const markdownUrl = match[2];
    const inlineCode = match[3];
    const plainUrl = match[4];

    if (markdownLabel && markdownUrl) {
      parts.push(
        <Text
          key={`${keyPrefix}-link-${tokenIndex}`}
          style={styles.inlineLink}
          onPress={() => {
            openExternalLink(markdownUrl).catch(() => {});
          }}
        >
          {markdownLabel}
        </Text>
      );
    } else if (inlineCode) {
      parts.push(
        <Text key={`${keyPrefix}-code-${tokenIndex}`} style={styles.inlineCode}>
          {inlineCode}
        </Text>
      );
    } else if (plainUrl) {
      parts.push(
        <Text
          key={`${keyPrefix}-url-${tokenIndex}`}
          style={styles.inlineLink}
          onPress={() => {
            openExternalLink(plainUrl).catch(() => {});
          }}
        >
          {plainUrl}
        </Text>
      );
    } else {
      parts.push(matchedToken);
    }

    lastIndex = tokenStart + matchedToken.length;
    tokenIndex += 1;
  }

  if (lastIndex < cleanedText.length) {
    parts.push(cleanedText.slice(lastIndex));
  }

  return parts;
};

const renderFormattedContent = (content: string) => {
  const blocks = parseContentToBlocks(content);

  return blocks.map((block, index) => {
    if (block.type === 'spacer') {
      return <View key={`spacer-${index}`} style={styles.blockSpacer} />;
    }

    if (block.type === 'heading') {
      const headingStyle =
        block.level === 1
          ? styles.heading1
          : block.level === 2
            ? styles.heading2
            : styles.heading3;
      return (
        <Text key={`heading-${index}`} style={[styles.messageText, headingStyle]}>
          {renderInlineText(normalizeHeadingText(block.text), `heading-${index}`)}
        </Text>
      );
    }

    if (block.type === 'ordered-item') {
      return (
        <View key={`ordered-${index}`} style={styles.listRow}>
          <Text style={styles.listPrefix}>{`${block.index}.`}</Text>
          <Text style={[styles.messageText, styles.listText]}>
            {renderInlineText(block.text, `ordered-${index}`)}
          </Text>
        </View>
      );
    }

    if (block.type === 'bullet-item') {
      return (
        <View key={`bullet-${index}`} style={styles.listRow}>
          <Text style={styles.listPrefix}>{'•'}</Text>
          <Text style={[styles.messageText, styles.listText]}>
            {renderInlineText(block.text, `bullet-${index}`)}
          </Text>
        </View>
      );
    }

    if (block.type === 'code') {
      return (
        <View key={`code-${index}`} style={styles.codeBlock}>
          {block.language ? <Text style={styles.codeLanguage}>{block.language}</Text> : null}
          <Text style={styles.codeText}>{block.code}</Text>
        </View>
      );
    }

    return (
      <Text key={`paragraph-${index}`} style={styles.messageText}>
        {renderInlineText(block.text, `paragraph-${index}`)}
      </Text>
    );
  });
};

const renderAttachments = (attachments: MessageAttachment[]) => {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <View style={styles.attachmentsWrap}>
      {attachments.map((attachment) => (
        <TouchableAttachment key={attachment.id} attachment={attachment} />
      ))}
    </View>
  );
};

const TouchableAttachment: React.FC<{ attachment: MessageAttachment }> = ({ attachment }) => {
  const handlePress = () => {
    openExternalLink(attachment.uri).catch(() => {});
  };

  if (attachment.type === 'image') {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
        <Image
          source={{ uri: attachment.uri }}
          style={styles.attachmentImage}
          resizeMode="cover"
          fadeDuration={0}
        />
      </TouchableOpacity>
    );
  }

  return (
    <Text style={styles.attachmentDocChip} onPress={handlePress}>
      {'DOC: '}
      {attachment.name}
    </Text>
  );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  content, 
  isUser, 
  modelName = 'AI',
  avatar,
  attachments = [],
}) => {
  // User message - ChatGPT style (right-aligned, subtle background)
  if (isUser) {
    return (
      <View style={styles.messageRow}>
        <View style={styles.userMessageContainer}>
          <View style={styles.userBubble}>
            <Text style={styles.messageText}>{content}</Text>
            {renderAttachments(attachments)}
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
        {content ? <View style={styles.formattedContainer}>{renderFormattedContent(content)}</View> : null}
        {renderAttachments(attachments)}
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
    width: '100%',
  },
  userMessageContainer: {
    maxWidth: '85%',
  },
  userBubble: {
    padding: spacing.md, paddingHorizontal: spacing.lg,
    backgroundColor: '#2f2f2f',
    borderRadius: 18, borderBottomRightRadius: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  userAvatar: {
    display: 'none',
  },
  aiMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    backgroundColor: 'transparent',
    width: '100%',
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
    paddingRight: spacing.sm,
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
  formattedContainer: {
    gap: spacing.sm,
  },
  blockSpacer: {
    height: spacing.xs,
  },
  heading1: {
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 28,
    marginTop: spacing.xs,
  },
  heading2: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25,
    marginTop: spacing.xs,
  },
  heading3: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 23,
    marginTop: spacing.xs,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  listPrefix: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    minWidth: 18,
  },
  listText: {
    flex: 1,
  },
  inlineLink: {
    color: colors.info,
    textDecorationLine: 'underline',
  },
  inlineCode: {
    fontFamily: 'monospace',
    backgroundColor: colors.backgroundTertiary,
    color: colors.primaryLight,
    paddingHorizontal: 4,
    borderRadius: borderRadius.xs,
  },
  codeBlock: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  codeLanguage: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeText: {
    color: colors.foreground,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  attachmentsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  attachmentImage: {
    width: 140,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attachmentDocChip: {
    color: colors.textPrimary,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
  },
});

export default MessageBubble;