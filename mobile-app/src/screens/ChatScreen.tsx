import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Alert, // Keeping for backward compatibility if needed elsewhere
  StatusBar,
  Modal, // AUDIT FIX 4b
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../theme';
import ModelSelector from '../components/ModelSelector';
import MessageBubble from '../components/MessageBubble';
import IconButton from '../components/ui/IconButton'; // AUDIT FIX 3
import { chatService, AIModel, ChatSession, ChatMessage } from '../services';
import { useDrawer } from '../context';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

const ChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingMessageRef = useRef<string | null>(null); // Single pending message
  const isConnectingRef = useRef(false); // Ref to avoid stale closure
  const sentMessagesRef = useRef<Set<string>>(new Set()); // Track sent messages to prevent duplicates
  const typingAnim = useRef(new Animated.Value(0)).current;
  const bannerAnim = useRef(new Animated.Value(-100)).current; // AUDIT FIX 4a - Animated banner

  // AUDIT FIX 4b - Bottom sheet state
  const [showModelModal, setShowModelModal] = useState(false);
  const [modelToSwitch, setModelToSwitch] = useState<number | null>(null);

  // Fetch available chat models
  useEffect(() => {
    fetchModels();
    return () => {
      // Cleanup WebSocket on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchModels = async () => {
    try {
      const response = await chatService.getModels('chat');
      const chatModels = response.results || [];
      setModels(chatModels);
      if (chatModels.length > 0) {
        setSelectedModel(chatModels[0].id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load AI models');
    } finally {
      setIsLoading(false);
    }
  };

  // Typing animation
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingAnim.setValue(0);
    }
  }, [isTyping]);

  // Create or join a chat session
  const startSession = useCallback(async () => {
    if (!selectedModel || isConnectingRef.current) return;
    
    isConnectingRef.current = true;
    setIsConnecting(true);
    
    try {
      // Close existing WebSocket if any
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      // Create new session
      const newSession = await chatService.createSession(selectedModel);
      setSession(newSession);
      
      // Connect to WebSocket
      const ws = await chatService.createWebSocket(newSession.id);
      
      ws.onopen = () => {
        isConnectingRef.current = false;
        setIsConnecting(false);
        
        // Hide banner if reconnected
        Animated.timing(bannerAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        // Send pending message if exists
        const pendingMsg = pendingMessageRef.current;
        if (pendingMsg && !sentMessagesRef.current.has(pendingMsg)) {
          sentMessagesRef.current.add(pendingMsg);
          const payload = chatService.formatSendMessage(pendingMsg);
          ws.send(payload);
          pendingMessageRef.current = null;
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data: any = JSON.parse(event.data);

          // Handle error messages
          if (data.type === 'error' || data.error) {
            let errorMsg = 'Unknown error';
            if (typeof data.error === 'string') {
              errorMsg = data.error;
            } else if (data.error?.message) {
              errorMsg = data.error.message;
            } else if (typeof data.message === 'string') {
              errorMsg = data.message;
            }
            Alert.alert('Error', errorMsg);
            setIsTyping(false);
            return;
          }

          // Hydrate previous messages when joining an existing session
          if (data.type === 'previous_messages' && Array.isArray(data.messages)) {
            setMessages((prev) => {
              if (prev.length > 0) {
                return prev;
              }
              const history: Message[] = data.messages
                .map((msg: any) => {
                  if (!msg || !msg.content) return null;
                  return {
                    id: String(msg.id ?? `${Date.now()}-${Math.random()}`),
                    content: msg.content,
                    isUser: msg.sender === 'user',
                    timestamp: new Date(
                      msg.created_at || new Date().toISOString()
                    ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  } as Message;
                })
                .filter(Boolean) as Message[];
              return history;
            });

            // Removed setTimeout // AUDIT FIX 5
            return;
          }

          // Handle incoming chat messages (both user/AI) from WebSocket
          if (data.type === 'new_message' || data.type === 'chat_message' || data.message) {
            const rawMessage = data.message;

            // Ignore echo of the user's own message (we already render it locally)
            if (rawMessage && typeof rawMessage === 'object' && rawMessage.sender === 'user') { return;
            }

            let messageContent = '';

            if (typeof rawMessage === 'string') {
              messageContent = rawMessage;
            } else if (rawMessage && typeof rawMessage === 'object') {
              messageContent = rawMessage.content || '';
            } else if (data.content) {
              messageContent =
                typeof data.content === 'string'
                  ? data.content
                  : data.content.content || '';
            }

            if (messageContent) {
              const aiMessage: Message = {
                id: String(rawMessage?.id ?? Date.now().toString()),
                content: messageContent,
                isUser: false,
                timestamp: new Date(
                  rawMessage?.created_at || new Date().toISOString()
                ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              setMessages((prev) => [...prev, aiMessage]);
            }

            setIsTyping(false);
          }
        } catch (e) {
          console.error('Failed to parse message:', e);
          setIsTyping(false);
        }
      };
      
      ws.onerror = () => {
        isConnectingRef.current = false;
        setIsConnecting(false);
        setIsTyping(false);
        // Show banner on error
        Animated.timing(bannerAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      };
      
      ws.onclose = () => {
        isConnectingRef.current = false;
        setIsConnecting(false);
        // Show banner on close
        Animated.timing(bannerAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      };
      
      wsRef.current = ws;
    } catch (error) {
      // AUDIT FIX 4a - Remove Alert
      isConnectingRef.current = false;
      setIsConnecting(false);
      setIsTyping(false);
      Animated.timing(bannerAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedModel]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    const messageId = `${Date.now()}-${messageText.substring(0, 20)}`;
    
    // Prevent sending if already sent
    if (sentMessagesRef.current.has(messageText)) {
      return;
    }
    
    // Add user message to UI immediately
    const userMessage: Message = {
      id: messageId,
      content: messageText,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    
    // AUDIT FIX 5 - Remove setTimeout scroll handling
    
    // If WebSocket is ready, send immediately
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      sentMessagesRef.current.add(messageText);
      const payload = chatService.formatSendMessage(messageText);
      wsRef.current.send(payload);
      return;
    }
    
    // Store as pending message for when connection is ready
    pendingMessageRef.current = messageText;
    
    // Start session if needed
    if (!session && !isConnectingRef.current) {
      startSession();
    }
  };

  const handleModelChange = (model: { id: number; name: string }) => {
    if (model.id === selectedModel) return;
    
    // AUDIT FIX 4b - Replace Alert with Bottom Sheet
    if (messages.length > 0) {
      setModelToSwitch(model.id);
      setShowModelModal(true);
    } else {
      doModelSwitch(model.id);
    }
  };
  
  const doModelSwitch = (modelId: number) => {
    setSelectedModel(modelId);
    setSession(null);
    setMessages([]);
    setIsTyping(false);
    pendingMessageRef.current = null;
    sentMessagesRef.current.clear();
    isConnectingRef.current = false;
    setIsConnecting(false);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const handleNewChat = () => {
    if (messages.length === 0) return;
    setModelToSwitch(selectedModel);
    setShowModelModal(true); // AUDIT FIX 4b - Ensure modal is also used here
  };

  const getSelectedModelName = () => {
    const model = models.find(m => m.id === selectedModel);
    return model?.name || 'AI';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* AUDIT FIX 4a - Animated banner */}
      <Animated.View style={[styles.connectionBanner, { transform: [{ translateY: bannerAnim }] }]}>
        <Text style={styles.connectionBannerText}>Connection lost — reconnecting...</Text>
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <IconButton 
          icon="menu-outline" 
          onPress={openDrawer}
          accessibilityLabel="Open drawer"
          color={colors.textSecondary}
          style={styles.headerButton}
        />
        
        <ModelSelector 
          selected={selectedModel} 
          onSelect={handleModelChange} 
          models={models.map(m => ({ id: m.id, name: m.name }))}
        />
        
        <IconButton
          icon="create-outline"
          onPress={handleNewChat}
          accessibilityLabel="Start new chat"
          color={colors.textSecondary}
          style={styles.headerRight}
          size={22}
        />
      </View>

      {/* Messages or Empty State */}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        {messages.length === 0 && !isTyping ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="sparkles" size={32} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>How can I help you today?</Text>
            <Text style={styles.emptySubtitle}>
              Start a conversation by typing a message below
            </Text>
            
            {/* Quick suggestions */}
            <View style={styles.suggestions}>
              {[
                'Explain quantum computing',
                'Write a poem about nature',
                'Help me code a function',
                'Summarize this article',
              ].map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => setInputText(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                  <Ionicons name="arrow-up-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            // AUDIT FIX 5 - Use onContentSizeChange
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                content={message.content}
                isUser={message.isUser}
                timestamp={message.timestamp}
                modelName={getSelectedModelName()}
              />
            ))}

            {isTyping && (
              <View style={styles.typingContainer}>
                <View style={styles.typingAvatar}>
                  <Ionicons name="sparkles" size={16} color={colors.primary} />
                </View>
                <View style={styles.typingContent}>
                  <Text style={styles.typingLabel}>{getSelectedModelName()}</Text>
                  <View style={styles.typingDots}>
                    <Animated.View style={[styles.typingDot, { opacity: typingAnim }]} />
                    <Animated.View
                      style={[
                        styles.typingDot,
                        {
                          opacity: typingAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1],
                          }),
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.typingDot,
                        {
                          opacity: typingAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 0.5],
                          }),
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Input Area */}
        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add" size={24} color={colors.textMuted} />
            </TouchableOpacity>
            
            <TextInput
              style={styles.input}
              placeholder="Message"
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={4000}
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() && styles.sendButtonActive,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={inputText.trim() ? colors.white : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.disclaimer}>
            AI can make mistakes. Consider checking important information.
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* AUDIT FIX 4b - Bottom Sheet Modal for Model Change / New Chat */}
      <Modal
        visible={showModelModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Switch Model?</Text>
              <IconButton 
                icon="close"
                onPress={() => setShowModelModal(false)}
                accessibilityLabel="Close confirmation"
                color={colors.textSecondary}
                size={24}
              />
            </View>
            <Text style={styles.bottomSheetText}>
              Switching models will start a new conversation. Continue?
            </Text>
            <View style={styles.bottomSheetActions}>
              <TouchableOpacity 
                style={[styles.bottomSheetButton, styles.bottomSheetCancel]}
                onPress={() => setShowModelModal(false)}
              >
                <Text style={styles.bottomSheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.bottomSheetButton, styles.bottomSheetConfirm]}
                onPress={() => {
                  setShowModelModal(false);
                  if (modelToSwitch !== null) doModelSwitch(modelToSwitch);
                }}
              >
                <Text style={styles.bottomSheetConfirmText}>Switch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: spacing.md,
    fontSize: 15,
  },
  // AUDIT FIX 4a - Connection banner styles
  connectionBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: colors.warning,
    padding: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionBannerText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  // AUDIT FIX 4b - Bottom sheet styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24, // Fallback if xl is missing
    borderTopRightRadius: 24,
    padding: spacing.xl || 24,
    paddingBottom: (spacing.xl || 24) * 2,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  bottomSheetText: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.xl || 24,
  },
  bottomSheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomSheetButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  bottomSheetCancel: {
    backgroundColor: colors.card,
  },
  bottomSheetConfirm: {
    backgroundColor: colors.primary,
  },
  bottomSheetCancelText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  bottomSheetConfirmText: {
    color: colors.white,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: 100,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  suggestions: {
    width: '100%',
    gap: spacing.sm,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: spacing.lg,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  typingAvatar: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingContent: {
    flex: 1,
  },
  typingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  typingDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  inputArea: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    minHeight: 48,
  },
  attachButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    maxHeight: 120,
    minHeight: 36,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  disclaimer: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 0 : spacing.sm,
  },
});

export default ChatScreen;
