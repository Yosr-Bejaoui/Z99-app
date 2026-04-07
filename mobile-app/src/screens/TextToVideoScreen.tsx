import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { chatService } from '../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, WS_BASE_URL } from '../services/config';

const { width } = Dimensions.get('window');

const durationOptions = [
  { id: '5', label: '5s' },
  { id: '10', label: '10s' },
  { id: '15', label: '15s' },
];

const aspectRatioOptions = [
  { id: '16:9', label: '16:9', icon: 'tablet-landscape' as const },
  { id: '9:16', label: '9:16', icon: 'phone-portrait' as const },
  { id: '1:1', label: '1:1', icon: 'square' as const },
];

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  status: 'generating' | 'completed' | 'failed';
}

interface AIModel {
  id: number;
  name: string;
  model_type: string;
}

const TextToVideoScreen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('5');
  const [selectedAspect, setSelectedAspect] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    loadModels();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const loadModels = async () => {
    try {
      const response = await chatService.getModels('text_to_video');
      const videoModels = response.results.filter(m => m.model_type === 'text_to_video');
      setModels(videoModels);
      if (videoModels.length > 0) {
        setSelectedModel(videoModels[0].id);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const connectWebSocket = async (sessionId: number) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      Alert.alert('Error', 'Please login to continue');
      return;
    }

    const ws = new WebSocket(`${WS_BASE_URL}/chat/${sessionId}/?token=${token}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      // Send the prompt
      ws.send(JSON.stringify({
        message: prompt,
        duration: selectedDuration,
        aspect_ratio: selectedAspect,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WS message:', data);
        
        if (data.video_url || data.url) {
          const videoUrl = data.video_url || data.url;
          setGeneratedVideos(prev => [
            {
              id: Date.now().toString(),
              url: videoUrl,
              prompt: prompt,
              status: 'completed',
            },
            ...prev.filter(v => v.status !== 'generating'),
          ]);
          setIsGenerating(false);
          setPrompt('');
          ws.close();
        } else if (data.error) {
          const errorMsg = typeof data.error === 'string' ? data.error : (data.error?.message || 'An error occurred');
          Alert.alert('Error', errorMsg);
          setGeneratedVideos(prev => prev.filter(v => v.status !== 'generating'));
          setIsGenerating(false);
          ws.close();
        } else if (data.status === 'processing' || data.message) {
          // Still processing
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      Alert.alert('Connection Error', 'Failed to connect to the server. Please try again.');
      setGeneratedVideos(prev => prev.filter(v => v.status !== 'generating'));
      setIsGenerating(false);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };

    wsRef.current = ws;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }
    if (!selectedModel) {
      Alert.alert('Error', 'No video model available');
      return;
    }

    setIsGenerating(true);
    
    // Add placeholder video
    setGeneratedVideos(prev => [
      {
        id: 'generating',
        url: '',
        prompt: prompt,
        status: 'generating',
      },
      ...prev,
    ]);

    try {
      // Create session
      const session = await chatService.createSession(selectedModel, 'text_to_video');
      setSessionId(session.id);
      
      // Connect WebSocket and send prompt
      await connectWebSocket(session.id);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start generation');
      setIsGenerating(false);
      setGeneratedVideos(prev => prev.filter(v => v.status !== 'generating'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Text to Video</Text>
          <Text style={styles.headerSubtitle}>Transform your ideas into videos</Text>
        </View>

        {/* Prompt Input */}
        <GlassCard style={styles.promptCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>Describe your video</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{prompt.length}/2000</Text>
          </View>
          <TextInput
            style={styles.promptInput}
            placeholder="A drone flying over a beautiful mountain landscape at sunset..."
            placeholderTextColor={colors.textMuted}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={2000}
            accessibilityLabel="Video generation prompt"
            accessibilityHint="Describe the video you want to generate"
          />
        </GlassCard>

        {/* Model Selection */}
        {models.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Model</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionScroll}
            >
              {models.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  onPress={() => setSelectedModel(model.id)}
                  style={[
                    styles.optionButton,
                    selectedModel === model.id && styles.optionButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      selectedModel === model.id && styles.optionButtonTextSelected,
                    ]}
                  >
                    {model.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Aspect Ratio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aspect Ratio</Text>
          <View style={styles.optionRow}>
            {aspectRatioOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedAspect(option.id)}
                style={[
                  styles.aspectButton,
                  selectedAspect === option.id && styles.aspectButtonSelected,
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={selectedAspect === option.id ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.aspectButtonText,
                    selectedAspect === option.id && styles.aspectButtonTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.optionRow}>
            {durationOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedDuration(option.id)}
                style={[
                  styles.durationButton,
                  selectedDuration === option.id && styles.durationButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    selectedDuration === option.id && styles.durationButtonTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <View style={styles.generateButtonContainer}>
          <GradientButton
            title={isGenerating ? 'Generating...' : 'Generate Video'}
            onPress={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            icon={isGenerating ? undefined : 'videocam'}
          />
        </View>

        {/* Generated Videos */}
        {generatedVideos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Generated Videos</Text>
            {generatedVideos.map((video) => (
              <GlassCard key={video.id} style={styles.videoCard}>
                {video.status === 'generating' ? (
                  <View style={styles.generatingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.generatingText}>Generating video...</Text>
                    <Text style={styles.generatingSubtext}>This may take a few minutes</Text>
                  </View>
                ) : (
                  <View>
                    <Video
                      source={{ uri: video.url }}
                      style={styles.videoPlayer}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      isLooping
                    />
                    <Text style={styles.videoPrompt} numberOfLines={2}>
                      {video.prompt}
                    </Text>
                  </View>
                )}
              </GlassCard>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: 120,
  },
  header: {
    
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  promptCard: {
    
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    
  },
  promptInput: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 12,
    padding: spacing.lg,
    color: colors.foreground,
    fontSize: 15,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: {
    
  },
  optionScroll: {
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  optionButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  optionButtonTextSelected: {
    color: colors.primary,
  },
  aspectButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  aspectButtonSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  aspectButtonText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  aspectButtonTextSelected: {
    color: colors.primary,
  },
  durationButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationButtonSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  durationButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  durationButtonTextSelected: {
    color: colors.primary,
  },
  generateButtonContainer: {
    marginVertical: spacing.lg,
  },
  videoCard: {
    
    overflow: 'hidden',
  },
  generatingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  generatingText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  generatingSubtext: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  videoPlayer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: colors.backgroundTertiary,
  },
  videoPrompt: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.md,
  },
});

export default TextToVideoScreen;
