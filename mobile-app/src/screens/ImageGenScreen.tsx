import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { chatService, mediaService, getErrorMessage } from '../services';
import { WS_BASE_URL } from '../services/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const imageWidth = (width - 48 - 12) / 2;

const styles_options = [
  { id: 'realistic', label: 'Realistic', icon: 'camera' as const },
  { id: 'anime', label: 'Anime', icon: 'color-palette' as const },
  { id: 'digital', label: 'Digital Art', icon: 'desktop' as const },
  { id: '3d', label: '3D Render', icon: 'cube' as const },
  { id: 'painting', label: 'Painting', icon: 'brush' as const },
  { id: 'sketch', label: 'Sketch', icon: 'pencil' as const },
];

const resolution_options = [
  { id: '512x512', label: '512×512' },
  { id: '768x768', label: '768×768' },
  { id: '1024x1024', label: '1024×1024' },
];

interface AIModel {
  id: number;
  name: string;
  provider: string;
  color: string;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  created_at?: string;
}

const ImageGenScreen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [selectedResolution, setSelectedResolution] = useState('1024x1024');
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionRef = useRef<number | null>(null);

  // Fetch AI models on mount
  useEffect(() => {
    fetchAIModels();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchAIModels = async () => {
    try {
      setIsLoadingModels(true);
      const response = await chatService.getModels('text_to_image');
      // Filter for image generation models
      const imageModels = response.results.filter(
        (m: any) => m.model_type === 'text_to_image' || m.category === 'image'
      );
      
      const modelColors = ['#10b981', '#8b5cf6', '#f59e0b', '#3b82f6', '#ef4444', '#06b6d4'];
      const formattedModels: AIModel[] = imageModels.map((m: any, idx: number) => ({
        id: m.id,
        name: m.name,
        provider: m.provider || 'AI',
        color: modelColors[idx % modelColors.length],
      }));
      
      setAIModels(formattedModels);
      if (formattedModels.length > 0 && !selectedModel) {
        setSelectedModel(formattedModels[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch AI models:', err);
      setError('Failed to load AI models. Please try again.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAIModels();
    setRefreshing(false);
  }, []);

  const connectWebSocket = async (sessionId: number): Promise<WebSocket> => {
    const token = await AsyncStorage.getItem('accessToken');
    const wsUrl = `${WS_BASE_URL}/text-to-image/${sessionId}/?token=${token}`;
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected for image generation');
        resolve(ws);
      };
      
      ws.onerror = (e) => {
        console.error('WebSocket error:', e);
        reject(new Error('WebSocket connection failed'));
      };
      
      ws.onclose = () => {
        console.log('WebSocket closed');
      };
      
      wsRef.current = ws;
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Empty Prompt', 'Please enter a description for your image.');
      return;
    }

    if (!selectedModel) {
      Alert.alert('No Model Selected', 'Please select an AI model first.');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setError(null);

    try {
      // Create session first
      const session = await chatService.createSession(selectedModel, 'text_to_image');
      sessionRef.current = session.id;

      // Connect WebSocket
      const ws = await connectWebSocket(session.id);

      // Set up message handler
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'progress') {
            setProgress(data.progress || 0);
          } else if (data.type === 'complete' || data.type === 'image_complete') {
            const imageUrl = data.image_url || data.url || data.data?.url;
            if (imageUrl) {
              const newImage: GeneratedImage = {
                id: Date.now().toString(),
                url: imageUrl,
                prompt: prompt,
                created_at: new Date().toISOString(),
              };
              setGeneratedImages((prev) => [newImage, ...prev]);
            }
            setIsGenerating(false);
            setProgress(100);
            setPrompt('');
            ws.close();
          } else if (data.type === 'error') {
            setError(data.message || 'Image generation failed');
            setIsGenerating(false);
            ws.close();
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      // Send generation request
      const fullPrompt = `${prompt}, ${selectedStyle} style`;
      const [resWidth, resHeight] = selectedResolution.split('x').map(Number);
      
      ws.send(JSON.stringify({
        action: 'generate',
        prompt: fullPrompt,
        width: resWidth,
        height: resHeight,
        style: selectedStyle,
      }));

    } catch (err) {
      console.error('Generation error:', err);
      setError(getErrorMessage(err));
      setIsGenerating(false);
    }
  };

  const handleImagePress = (image: GeneratedImage) => {
    Alert.alert(
      'Image Options',
      'What would you like to do?',
      [
        { text: 'Download', onPress: () => handleDownload(image) },
        { text: 'Share', onPress: () => handleShare(image) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const result = await mediaService.saveImageToGallery(image.url);
      if (result.success) {
        Alert.alert('Success', 'Image saved to gallery!');
      } else {
        Alert.alert('Error', result.error || 'Failed to save image');
      }
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  const handleShare = async (image: GeneratedImage) => {
    try {
      await mediaService.shareFile(image.url, `Check out this AI-generated image: ${image.prompt}`);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  const renderModelSelector = () => {
    if (isLoadingModels) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading models...</Text>
        </View>
      );
    }

    if (aiModels.length === 0) {
      return (
        <TouchableOpacity style={styles.retryButton} onPress={fetchAIModels}>
          <Text style={styles.retryText}>No models available. Tap to retry.</Text>
        </TouchableOpacity>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.modelScroll}
      >
        {aiModels.map((model) => (
          <TouchableOpacity
            key={model.id}
            onPress={() => setSelectedModel(model.id)}
            style={[
              styles.modelButton,
              selectedModel === model.id && styles.modelButtonSelected,
            ]}
          >
            <View style={[styles.modelDot, { backgroundColor: model.color }]} />
            <Text
              style={[
                styles.modelButtonText,
                selectedModel === model.id && styles.modelButtonTextSelected,
              ]}
            >
              {model.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Image Generation</Text>
          <Text style={styles.headerSubtitle}>Create stunning images with AI</Text>
        </View>

        {/* Error Banner */}
        {error && (
          <GlassCard style={styles.errorCard}>
            <Ionicons name="warning" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* Prompt Input */}
        <GlassCard style={styles.promptCard}>
          <Text style={styles.sectionTitle}>Describe your image</Text>
          <TextInput
            style={styles.promptInput}
            placeholder="A serene mountain landscape at golden hour with dramatic clouds..."
            placeholderTextColor={colors.textMuted}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isGenerating}
          />
        </GlassCard>

        {/* Model Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Model</Text>
          {renderModelSelector()}
        </View>

        {/* Style Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Style</Text>
          <View style={styles.styleGrid}>
            {styles_options.map((style) => (
              <TouchableOpacity
                key={style.id}
                onPress={() => setSelectedStyle(style.id)}
                style={[
                  styles.styleButton,
                  selectedStyle === style.id && styles.styleButtonSelected,
                ]}
                disabled={isGenerating}
              >
                <Ionicons
                  name={style.icon}
                  size={20}
                  color={selectedStyle === style.id ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.styleButtonText,
                    selectedStyle === style.id && styles.styleButtonTextSelected,
                  ]}
                >
                  {style.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Resolution Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resolution</Text>
          <View style={styles.resolutionRow}>
            {resolution_options.map((res) => (
              <TouchableOpacity
                key={res.id}
                onPress={() => setSelectedResolution(res.id)}
                style={[
                  styles.resolutionButton,
                  selectedResolution === res.id && styles.resolutionButtonSelected,
                ]}
                disabled={isGenerating}
              >
                <Text
                  style={[
                    styles.resolutionText,
                    selectedResolution === res.id && styles.resolutionTextSelected,
                  ]}
                >
                  {res.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress Indicator */}
        {isGenerating && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>Generating... {Math.round(progress)}%</Text>
          </View>
        )}

        {/* Generate Button */}
        <GradientButton
          title={isGenerating ? 'Generating...' : 'Generate Image'}
          onPress={handleGenerate}
          style={styles.generateButton}
          disabled={isGenerating || !prompt.trim() || !selectedModel}
          icon={
            isGenerating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="sparkles" size={20} color="#fff" />
            )
          }
        />

        {/* Generated Images Gallery */}
        {generatedImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Generated Images</Text>
            <View style={styles.imageGrid}>
              {generatedImages.map((img) => (
                <TouchableOpacity
                  key={img.id}
                  style={styles.imageContainer}
                  onPress={() => handleImagePress(img)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: img.url }}
                    style={styles.generatedImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.imageOverlay}
                  >
                    <View style={styles.imageActions}>
                      <TouchableOpacity
                        style={styles.imageActionButton}
                        onPress={() => handleDownload(img)}
                      >
                        <Ionicons name="download-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.imageActionButton}
                        onPress={() => handleShare(img)}
                      >
                        <Ionicons name="share-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.imagePrompt} numberOfLines={2}>
                      {img.prompt}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {generatedImages.length === 0 && !isGenerating && (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyStateText}>No images generated yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Enter a prompt above and tap Generate to create your first image
            </Text>
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
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.error,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 14,
  },
  promptCard: {
    padding: 16,
    marginBottom: 20,
  },
  promptInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  retryButton: {
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  retryText: {
    color: colors.primary,
    fontSize: 14,
    textAlign: 'center',
  },
  modelScroll: {
    gap: 10,
  },
  modelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  modelButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
  },
  modelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modelButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  modelButtonTextSelected: {
    color: colors.primary,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  styleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  styleButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
  },
  styleButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  styleButtonTextSelected: {
    color: colors.primary,
  },
  resolutionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  resolutionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resolutionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
  },
  resolutionText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  resolutionTextSelected: {
    color: colors.primary,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  generateButton: {
    marginBottom: 24,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    width: imageWidth,
    height: imageWidth,
    borderRadius: 16,
    overflow: 'hidden',
  },
  generatedImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingTop: 24,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  imageActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePrompt: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
});

export default ImageGenScreen;
