import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';
import { historyService, getErrorMessage } from '../services';
import type { HistoryItem } from '../services/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectSession: (sessionId: number) => void;
  navigation?: any;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onNewChat,
  onSelectSession,
  navigation,
}) => {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [chatHistory, setChatHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: -DRAWER_WIDTH,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const fetchChatHistory = async () => {
    try {
      setIsLoading(true);
      const response = await historyService.getHistory({ 
        type: 'chat',
        page_size: 20 
      });
      setChatHistory(response.results);
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChat = (item: HistoryItem) => {
    onSelectSession(item.id);
    onClose();
  };

  const handleDeleteChat = (item: HistoryItem) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await historyService.deleteHistoryItem(item.id);
              setChatHistory(prev => prev.filter(h => h.id !== item.id));
            } catch (err) {
              Alert.alert('Error', getErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  // Group chats by date
  const groupedChats = chatHistory.reduce((groups, chat) => {
    const date = formatDate(chat.created_at || chat.date);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(chat);
    return groups;
  }, {} as Record<string, HistoryItem[]>);

  if (!isOpen) return null;

  return (
    <View style={styles.container}>
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayAnim,
          },
        ]}
      >
        <TouchableOpacity style={styles.overlayTouch} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* New Chat Button */}
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={() => {
            onNewChat();
            onClose();
          }}
        >
          <View style={styles.newChatIcon}>
            <Ionicons name="add" size={20} color={colors.white} />
          </View>
          <Text style={styles.newChatText}>New chat</Text>
        </TouchableOpacity>

        {/* Chat History */}
        <ScrollView 
          style={styles.historyContainer}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : chatHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>No chats yet</Text>
            </View>
          ) : (
            Object.entries(groupedChats).map(([date, chats]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateLabel}>{date}</Text>
                {chats.map((chat) => (
                  <TouchableOpacity
                    key={chat.id}
                    style={styles.chatItem}
                    onPress={() => handleSelectChat(chat)}
                    onLongPress={() => handleDeleteChat(chat)}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.chatTitle} numberOfLines={1}>
                      {chat.title || 'Untitled chat'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </ScrollView>

        {/* Bottom Menu */}
        <View style={styles.bottomMenu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              navigation?.navigate('Settings');
              onClose();
            }}
          >
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.menuItemText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              navigation?.navigate('Help');
              onClose();
            }}
          >
            <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.menuItemText}>Help & FAQ</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  overlayTouch: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.backgroundSecondary,
    paddingTop: 60,
    paddingHorizontal: spacing.md,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  newChatIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  historyContainer: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  dateGroup: {
    marginBottom: spacing.lg,
  },
  dateLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
    marginBottom: 2,
  },
  chatTitle: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
  },
  bottomMenu: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  menuItemText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

export default Sidebar;
