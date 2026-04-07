import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useDrawer, useCredits } from '../context';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { chatService, getErrorMessage } from '../services';
import { WS_BASE_URL, STORAGE_KEYS } from '../services/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PromptOptimizerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { credits, hasEnoughCredits, refreshCredits } = useCredits();
  
  const [prompt, setPrompt] = useState('');
  const [resultText, setResultText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [model, setModel] = useState<any>(null);
  
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchModel();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const fetchModel = async () => {
    try {
      const response = await chatService.getModels('chat');
      const textModel = response.results.find((m: any) => m.model_id === 'gpt-4o-mini' || m.model_id === 'gpt-3.5-turbo') || response.results[0];
      if (textModel) {
        setModel(textModel);
      }
    } catch (err) {
      console.error('Failed to fetch model:', err);
    }
  };

  const connectWebSocket = async (sessionId: number): Promise<WebSocket> => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) throw new Error('Not authenticated.');

    const wsUrl = `${WS_BASE_URL}/chat/${sessionId}/?token=${token}`;
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => resolve(ws);
      ws.onerror = () => reject(new Error('WebSocket connection failed'));
      wsRef.current = ws;
    });
  };

  const processPrompt = async () => {
    if (!prompt.trim()) {
        Alert.alert('Error', 'Please enter a simple prompt to optimize.');
        return;
    }

    if (!model) {
       Alert.alert('Error', 'Model not loaded. Please try again later.');
       return;
    }

    const cost = model.base_cost || 5;
    if (!hasEnoughCredits(cost)) {
      Alert.alert('Insufficient Credits', `You need \${cost} credits to use this tool.`);
      return;
    }

    setIsProcessing(true);
    setResultText('');
    let fullResponse = '';

    try {
       const session = await chatService.createSession(model.id, 'chat');
       const ws = await connectWebSocket(session.id);

       ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'message_chunk' || data.type === 'new_message') {
                const rawMessage = data.message;
                
                // Ignore user's own message being echoed back
                if (rawMessage && typeof rawMessage === 'object' && rawMessage.sender === 'user') {
                    return;
                }

                let content = '';
                if (typeof rawMessage === 'string') {
                    content = rawMessage;
                } else if (rawMessage && typeof rawMessage === 'object') {
                    content = rawMessage.content || '';
                } else if (data.content) {
                    content = typeof data.content === 'string' ? data.content : data.content.content || '';
                }

                if (content) {
                    // For chunks, we append; for new_message, if it's a full message, we might just set it. 
                    // Let's just set it for now unless we know it's streaming.
                    if (data.type === 'message_chunk') {
                        fullResponse += content;
                    } else {
                        // Normally new_message gives the complete response in this backend
                        fullResponse = content; 
                    }
                    setResultText(fullResponse);
                    setIsProcessing(false); // Stop loader when response arrives
                }
            } else if (data.type === 'end_of_stream' || data.type === 'complete') {
                refreshCredits();
                setIsProcessing(false);
                ws.close();
            } else if (data.type === 'error') {
                Alert.alert('Error', data.message || 'Processing failed');
                setIsProcessing(false);
                ws.close();
            }
          } catch(e) {}
       };

       const systemInstruction = "You are a prompt engineer. Enhance the user's simple prompt into a highly detailed, descriptive, and effective prompt for an AI image generator or writing tool. Only return the optimized prompt, without any extra conversation.";

       ws.send(JSON.stringify({
           message: systemInstruction + '\n\nHere is the prompt to optimize: ' + prompt,
       }));

    } catch (err) {
       Alert.alert('Error', getErrorMessage(err));
       setIsProcessing(false);
    }
  };

  const copyResult = async () => {
    if (resultText) {
        await Clipboard.setStringAsync(resultText);
        Alert.alert('Copied!', 'Optimized prompt copied to clipboard.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Prompt Optimizer" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
         <GlassCard style={styles.card}>
            <Text style={styles.title}>AI Prompt Optimizer</Text>
            <Text style={styles.desc}>Enhance your simple ideas into highly detailed prompts.</Text>
            
            <TextInput
               style={styles.input}
               placeholder="Enter a simple prompt (e.g. realistic photo of a cat on mars)"
               placeholderTextColor={colors.textMuted}
               value={prompt}
               onChangeText={setPrompt}
               multiline
            />

            <GradientButton
                title={isProcessing ? "Optimizing..." : `Optimize Prompt (${model?.base_cost || 5} credits)`}
                onPress={processPrompt}
                disabled={isProcessing || !prompt.trim()}
                style={{ marginTop: spacing.lg, width: '100%' }}
                icon={isProcessing ? <ActivityIndicator color={colors.white} /> : <Ionicons name="flash-outline" size={20} color={colors.white} />}
            />

            {resultText !== null && (
                <View style={styles.resultContainer}>
                     <Text style={styles.resultTitle}>Optimized Prompt</Text>
                     <View style={styles.resultBox}>
                         <Text style={styles.resultText}>{resultText}</Text>
                     </View>
                     <TouchableOpacity style={styles.copyBtn} onPress={copyResult} disabled={isProcessing}>
                         <Ionicons name="copy-outline" size={20} color={colors.white} />
                         <Text style={{color: colors.foreground, fontWeight: 'bold'}}>Copy Prompt</Text>
                     </TouchableOpacity>
                </View>
            )}
         </GlassCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary },
  scrollContent: { gap: spacing.lg, padding: spacing.lg },
  card: { padding: spacing.lg, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.sm },
  desc: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
  input: {
      width: '100%', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: borderRadius.md, padding: spacing.md, color: colors.textPrimary,
      minHeight: 120, textAlignVertical: 'top'
  },
  resultContainer: { width: '100%', marginTop: spacing.xl },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.sm },
  resultBox: {
      width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: colors.border,
      borderRadius: borderRadius.md, padding: spacing.md, minHeight: 100
  },
  resultText: { color: colors.textPrimary, fontSize: 16, lineHeight: 24 },
  copyBtn: { flexDirection: 'row', backgroundColor: colors.primary, padding: spacing.md, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
    coinBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  coinBadgeText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: 'bold',
  },
  coinIcon: { fontSize: 12 }
});
export default PromptOptimizerScreen;
