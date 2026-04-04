import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrawer, useCredits } from '../context';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Toast, { showToast } from '../components/Toast';
import { chatService, mediaService, getErrorMessage } from '../services';
import { WS_BASE_URL, STORAGE_KEYS } from '../services/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const imageWidth = (width - 48 - 12) / 2;

const styles_options = [
  { id: 'realistic', labelKey: 'imageGen.style.realistic', icon: 'camera' as const },
  { id: 'anime', labelKey: 'imageGen.style.anime', icon: 'color-palette' as const },
  { id: 'digital', labelKey: 'imageGen.style.digital', icon: 'desktop' as const },
  { id: '3d', labelKey: 'imageGen.style.threeD', icon: 'cube' as const },
  { id: 'painting', labelKey: 'imageGen.style.painting', icon: 'brush' as const },
  { id: 'sketch', labelKey: 'imageGen.style.sketch', icon: 'pencil' as const },
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
  base_cost?: number;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  created_at?: string;
}

const ImageGenScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  
  const { credits, hasEnoughCredits, refreshCredits } = useCredits();
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [selectedResolution, setSelectedResolution] = useState('1024x1024');
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
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
      // Get all image generation models
      const allImageModels = response.results.filter(
        (m: any) => m.model_type === 'text_to_image' || m.category === 'image'
      );
      const imageModels = allImageModels.length > 0 ? allImageModels : [];
      
      const modelColors = ['#10b981', '#10a37f', '#a7f3d0', '#d1d5db', '#9ca3af', '#4b5563'];
      const formattedModels: AIModel[] = imageModels.map((m: any, idx: number) => ({
        id: m.id,
        name: m.name,
        provider: m.provider || 'AI',
        color: modelColors[idx % modelColors.length],
        base_cost: m.base_cost || 10,
      }));
      
      setAIModels(formattedModels);
      if (formattedModels.length > 0 && !selectedModel) {
        setSelectedModel(formattedModels[0]);
      }
    } catch (err) {
      console.error('Failed to fetch AI models:', err);
      setError(t('imageGen.model.loadError'));
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
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (!token) {
      throw new Error('Not authenticated. Please log in again.');
    }

    const wsUrl = `${WS_BASE_URL}/chat/${sessionId}/?token=${token}`;
    
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
      Alert.alert(t('imageGen.emptyPrompt.title'), t('imageGen.emptyPrompt.message'));
      return;
    }

    if (!selectedModel) {
      Alert.alert(t('imageGen.noModel.title'), t('imageGen.noModel.message'));
      return;
    }
    const cost = selectedModel.base_cost || 10;
    const currentCredits = credits?.credits || 0;

    // Check if user has enough credits
    if (!hasEnoughCredits(cost)) {
      Alert.alert(
        t('imageGen.insufficientCredits.title'),
        t('imageGen.insufficientCredits.message', { cost, balance: currentCredits }),
        [
          { text: t('imageGen.insufficientCredits.cancel'), style: 'cancel' },
          {
            text: t('imageGen.insufficientCredits.buy'),
            style: 'default',
            onPress: () => {
              // Navigate to subscription plan screen
              // navigation.navigate('SubscriptionPlans');
            },
          },
        ]
      );
      return;
    }

    // No confirmation needed - proceed directly
    setIsGenerating(true);
    setProgress(0);
    setError(null);

    // Close any existing WebSocket connection before starting new one
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      // Create session first
      const session = await chatService.createSession(selectedModel.id, 'text_to_image');
      sessionRef.current = session.id;

      // Connect WebSocket
      const ws = await connectWebSocket(session.id);

      // Set up message handler
      ws.onmessage = (event) => {
        try {
          const data: any = JSON.parse(event.data);
          
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

              // Show cost toast
              const cost = selectedModel?.base_cost || 10;
              showToast(
                t('imageGen.costToast', { cost }),
                'success'
              );
              refreshCredits(); // Refresh to get the latest balance
            }
            setIsGenerating(false);
            setProgress(100);
            setPrompt('');
            ws.close();
          } else if (
            data.type === 'new_message' &&
            data.message &&
            typeof data.message === 'object' &&
            Array.isArray(data.message.images) &&
            data.message.images.length > 0 &&
            data.message.sender === 'ai'
          ) {
            // Fallback for backend that returns generated images inside a chat message
            const imageUrl = data.message.images[0];
            if (imageUrl) {
              const newImage: GeneratedImage = {
                id: String(data.message.id ?? Date.now().toString()),
                url: imageUrl,
                prompt: prompt,
                created_at: data.message.created_at || new Date().toISOString(),
              };
              setGeneratedImages((prev) => [newImage, ...prev]);

              // Show cost toast
              const cost = selectedModel?.base_cost || 10;
              showToast(
                t('imageGen.costToast', { cost }),
                'success'
              );
              refreshCredits(); // Refresh to get the latest balance
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
        message: fullPrompt,
        width: resWidth,
        height: resHeight,
        style: selectedStyle,
        num_images: 1,
      }));

    } catch (err) {
      console.error('Generation error:', err);
      setError(getErrorMessage(err));
      setIsGenerating(false);
    }
  };

  const handleImagePress = (image: GeneratedImage) => {
    setSelectedImage(image);
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const result = await mediaService.saveImageToGallery(image.url);
      if (result.success) {
        Alert.alert(t('common.success'), t('imageGen.downloadSuccess'));
      } else {
        Alert.alert(t('common.error'), result.error || t('imageGen.downloadError'));
      }
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
    }
  };

  const handleShare = async (image: GeneratedImage) => {
    try {
      await mediaService.shareFile(image.url, `Check out this AI-generated image: ${image.prompt}`);
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
    }
  };

  const renderModelSelector = () => {
    if (isLoadingModels) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>{t('imageGen.model.loading')}</Text>
        </View>
      );
    }

    if (aiModels.length === 0) {
      return (
        <TouchableOpacity style={styles.retryButton} onPress={fetchAIModels}>
          <Text style={styles.retryText}>{t('imageGen.model.retry')}</Text>
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
            onPress={() => setSelectedModel(model)}
            style={[
              styles.modelButton,
              selectedModel?.id === model.id && styles.modelButtonSelected,
            ]}
          >
            <View style={[styles.modelDot, { backgroundColor: model.color }]} />
            <Text
              style={[
                styles.modelButtonText,
                selectedModel?.id === model.id && styles.modelButtonTextSelected,
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={openDrawer}>
          <Ionicons name="menu-outline" size={28} color={colors.textPrimary || '#fff'} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('imageGen.title')}</Text>
        <View style={styles.iconButton}>
          <View style={styles.coinBadge}>
             <Text style={styles.coinBadgeText}>🪙 {credits?.credits || 0}</Text>
          </View>
        </View>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >

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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>{t('imageGen.prompt.title')}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{prompt.length}/2000</Text>
          </View>
          <TextInput
            style={styles.promptInput}
            placeholder={t('imageGen.prompt.placeholder')}
            placeholderTextColor={colors.textMuted}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isGenerating}
            maxLength={2000}
            accessibilityLabel={t('imageGen.a11y.prompt')}
            accessibilityHint={t('imageGen.a11y.promptHint')}
          />
        </GlassCard>

        {/* Model Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('imageGen.model.title')}</Text>
          {renderModelSelector()}
        </View>

        {/* Style Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('imageGen.style.title')}</Text>
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
                  {t(style.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Resolution Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('imageGen.resolution.title')}</Text>
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
            <Text style={styles.progressText}>{t('imageGen.progress', { percent: Math.round(progress) })}</Text>
          </View>
        )}

        {/* Generate Button */}
        <GradientButton
          title={isGenerating ? t('imageGen.generating') : `${t('imageGen.generateButton')} (${Math.round(Number(selectedModel?.base_cost || 10))} ${t('common.credits')})`}
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
            <Text style={styles.sectionTitle}>{t('imageGen.gallery.title')}</Text>
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
            <Text style={styles.emptyStateText}>{t('imageGen.emptyState.text')}</Text>
            <Text style={styles.emptyStateSubtext}>
              {t('imageGen.emptyState.subtext')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerClose}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <>
              <Image
                source={{ uri: selectedImage.url }}
                style={styles.imageViewerImage}
                resizeMode="contain"
              />
              <View style={styles.imageViewerActions}>
                <TouchableOpacity
                  style={styles.imageViewerButton}
                  onPress={() => {
                    handleDownload(selectedImage);
                  }}
                >
                  <Ionicons name="download-outline" size={24} color="#fff" />
                  <Text style={styles.imageViewerButtonText}>{t('imageGen.imageOptions.download')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imageViewerButton}
                  onPress={() => {
                    handleShare(selectedImage);
                  }}
                >
                  <Ionicons name="share-outline" size={24} color="#fff" />
                  <Text style={styles.imageViewerButtonText}>{t('imageGen.imageOptions.share')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.error,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 14,
  },
  promptCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  promptInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  retryButton: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
  },
  retryText: {
    color: colors.primary,
    fontSize: 14,
    textAlign: 'center',
  },
  modelScroll: {
    gap: spacing.sm,
  },
  modelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  modelButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceHover,
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
    gap: spacing.sm,
  },
  styleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  styleButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceHover,
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
    gap: spacing.sm,
  },
  resolutionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resolutionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceHover,
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
    marginBottom: spacing.lg,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: colors.card,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.sm,
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
    marginBottom: spacing.xl,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  imageContainer: {
    width: imageWidth,
    height: imageWidth,
    borderRadius: borderRadius.lg,
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
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
    paddingVertical: spacing.xxxl,
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  emptyStateSubtext: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xxl,
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  imageViewerImage: {
    width: width - 40,
    height: width - 40,
    borderRadius: borderRadius.lg,
  },
  imageViewerActions: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.xl,
  },
  imageViewerButton: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  imageViewerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },

  coinBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  iconButton: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary || '#fff',
  },
});

export default ImageGenScreen;
