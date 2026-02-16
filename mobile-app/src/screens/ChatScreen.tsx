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
  SafeAreaView,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import ModelSelector from '../components/ModelSelector';
import MessageBubble from '../components/MessageBubble';
import { chatService, AIModel, ChatSession, ChatMessage } from '../services';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

const ChatScreen: React.FC = () => {
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
          const data = JSON.parse(event.data);
          
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
          
          // Handle chat messages - extract content from nested message object if needed
          if (data.type === 'chat_message' || data.message) {
            let messageContent = '';
            
            // data.message could be a string or an object with content
            if (typeof data.message === 'string') {
              messageContent = data.message;
            } else if (data.message && typeof data.message === 'object') {
              messageContent = data.message.content || JSON.stringify(data.message);
            } else if (data.content) {
              messageContent = typeof data.content === 'string' ? data.content : data.content.content || '';
            }
            
            if (messageContent) {
              const aiMessage: Message = {
                id: Date.now().toString(),
                content: messageContent,
                isUser: false,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              setMessages((prev) => [...prev, aiMessage]);
            }
            setIsTyping(false);
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
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
      };
      
      ws.onclose = () => {
        isConnectingRef.current = false;
        setIsConnecting(false);
      };
      
      wsRef.current = ws;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start session';
      Alert.alert('Connection Error', errorMessage);
      isConnectingRef.current = false;
      setIsConnecting(false);
      setIsTyping(false);
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
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
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

  const handleModelChange = (modelId: number) => {
    if (modelId === selectedModel) return;
    
    // If there are messages, confirm before switching
    if (messages.length > 0) {
      Alert.alert(
        'Switch Model',
        'Switching models will start a new conversation. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Switch',
            onPress: () => {
              doModelSwitch(modelId);
            },
          },
        ]
      );
    } else {
      doModelSwitch(modelId);
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading models...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Chat</Text>
          <View style={styles.headerActions}>
            {isConnecting && (
              <View style={styles.connectingBadge}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.connectingText}>Connecting...</Text>
              </View>
            )}
            {messages.length > 0 && (
              <TouchableOpacity 
                style={styles.newChatButton}
                onPress={() => {
                  Alert.alert('New Chat', 'Start a new conversation?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'New Chat', onPress: () => doModelSwitch(selectedModel!) },
                  ]);
                }}
              >
                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <ModelSelector 
          selected={selectedModel} 
          onSelect={handleModelChange} 
          models={models.map(m => ({ id: m.id, name: m.name }))}
        />
      </View>

      {/* Empty State */}
      {messages.length === 0 && !isTyping && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Start a conversation</Text>
          <Text style={styles.emptySubtitle}>
            Send a message to begin chatting with AI
          </Text>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              content={message.content}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <View style={styles.typingContainer}>
              <View style={styles.typingBubble}>
                <Animated.View
                  style={[
                    styles.typingDot,
                    { opacity: typingAnim },
                  ]}
                />
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
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => {}}
            >
              <Ionicons name="attach" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleSend} disabled={!inputText.trim()}>
            <LinearGradient
              colors={inputText.trim() ? [colors.primary, colors.secondary] : [colors.surface, colors.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendButton}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? '#fff' : colors.textMuted}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  connectingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  connectingText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newChatButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  typingContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 16 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 6,
    minHeight: 48,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  attachButton: {
    padding: 6,
    marginLeft: 4,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatScreen;
