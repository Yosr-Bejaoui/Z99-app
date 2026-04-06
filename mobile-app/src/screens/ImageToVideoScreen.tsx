import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { chatService, mediaService } from '../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, WS_BASE_URL } from '../services/config';

const motionOptions = [
  { id: 'subtle', label: 'Subtle', description: 'Gentle movements' },
  { id: 'moderate', label: 'Moderate', description: 'Balanced motion' },
  { id: 'dynamic', label: 'Dynamic', description: 'High intensity' },
];

interface GeneratedVideo {
  id: string;
  url: string;
  sourceImage: string;
  prompt: string;
  status: 'generating' | 'completed' | 'failed';
}

interface AIModel {
  id: number;
  name: string;
  model_type: string;
}

const ImageToVideoScreen: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedMotion, setSelectedMotion] = useState('moderate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
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
      const response = await chatService.getModels('image_to_video');
      const videoModels = response.results.filter(
        m => m.model_type === 'image_to_video' || m.model_type === 'text_or_image_to_video'
      );
      setModels(videoModels);
      if (videoModels.length > 0) {
        setSelectedModel(videoModels[0].id);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      if (result.assets[0].base64) {
        setSelectedImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please grant camera permission');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      if (result.assets[0].base64) {
        setSelectedImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
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
      ws.send(JSON.stringify({
        message: prompt || 'Animate this image',
        images: [selectedImageBase64 || selectedImage],
        motion_intensity: selectedMotion,
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
              sourceImage: selectedImage!,
              prompt: prompt,
              status: 'completed',
            },
            ...prev.filter(v => v.status !== 'generating'),
          ]);
          setIsGenerating(false);
          ws.close();
        } else if (data.error) {
          const errorMsg = typeof data.error === 'string' ? data.error : (data.error?.message || 'An error occurred');
          Alert.alert('Error', errorMsg);
          setGeneratedVideos(prev => prev.filter(v => v.status !== 'generating'));
          setIsGenerating(false);
          ws.close();
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
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image');
      return;
    }
    if (!selectedModel) {
      Alert.alert('Error', 'No video model available');
      return;
    }

    setIsGenerating(true);
    
    setGeneratedVideos(prev => [
      {
        id: 'generating',
        url: '',
        sourceImage: selectedImage,
        prompt: prompt,
        status: 'generating',
      },
      ...prev,
    ]);

    try {
      const session = await chatService.createSession(selectedModel, 'image_to_video');
      await connectWebSocket(session.id);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start generation');
      setIsGenerating(false);
      setGeneratedVideos(prev => prev.filter(v => v.status !== 'generating'));
    }
  };

  const handleDownload = async (video: GeneratedVideo) => {
    try {
      await mediaService.saveVideoToGallery(video.url);
      Alert.alert('Success', 'Video saved to your gallery');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to download video');
    }
  };

  const handleShare = async (video: GeneratedVideo) => {
    try {
      await mediaService.shareFile(video.url, `video_${video.id}.mp4`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to share video');
    }
  };

  const handleDelete = (videoId: string) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to remove this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setGeneratedVideos(prev => prev.filter(v => v.id !== videoId));
          },
        },
      ]
    );
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
          <Text style={styles.headerTitle}>Image to Video</Text>
          <Text style={styles.headerSubtitle}>Bring your images to life</Text>
        </View>

        {/* Image Selection */}
        <GlassCard style={styles.imageCard}>
          <Text style={styles.sectionTitle}>Source Image</Text>
          
          {selectedImage ? (
            <View style={styles.selectedImageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={28} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Ionicons name="images" size={32} color={colors.primary} />
                <Text style={styles.imageButtonText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                <Ionicons name="camera" size={32} color={colors.primary} />
                <Text style={styles.imageButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </GlassCard>

        {/* Prompt Input */}
        <GlassCard style={styles.promptCard}>
          <Text style={styles.sectionTitle}>Motion Description (Optional)</Text>
          <TextInput
            style={styles.promptInput}
            placeholder="Describe how you want the image to move..."
            placeholderTextColor={colors.textMuted}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
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

        {/* Motion Intensity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motion Intensity</Text>
          <View style={styles.motionRow}>
            {motionOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedMotion(option.id)}
                style={[
                  styles.motionButton,
                  selectedMotion === option.id && styles.motionButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.motionLabel,
                    selectedMotion === option.id && styles.motionLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.motionDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <View style={styles.generateButtonContainer}>
          <GradientButton
            title={isGenerating ? 'Generating...' : 'Generate Video'}
            onPress={handleGenerate}
            disabled={isGenerating || !selectedImage}
            icon={isGenerating ? undefined : 'play'}
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
                    <Image source={{ uri: video.sourceImage }} style={styles.thumbnailImage} />
                    <View style={styles.generatingOverlay}>
                      <ActivityIndicator size="large" color={colors.primary} />
                      <Text style={styles.generatingText}>Animating image...</Text>
                    </View>
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
                    {video.prompt && (
                      <Text style={styles.videoPrompt} numberOfLines={2}>
                        {video.prompt}
                      </Text>
                    )}
                    <View style={styles.videoActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleShare(video)}
                      >
                        <Ionicons name="share-outline" size={22} color={colors.primary} />
                        <Text style={styles.actionButtonText}>Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDownload(video)}
                      >
                        <Ionicons name="download-outline" size={22} color={colors.primary} />
                        <Text style={styles.actionButtonText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(video.id)}
                      >
                        <Ionicons name="trash-outline" size={22} color={colors.error} />
                        <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
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
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.xl,
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
  imageCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  imageButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  imageButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  selectedImageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.backgroundTertiary,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.background,
    borderRadius: 14,
  },
  promptCard: {
    marginBottom: spacing.lg,
  },
  promptInput: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 12,
    padding: spacing.lg,
    color: colors.foreground,
    fontSize: 15,
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: {
    marginBottom: spacing.lg,
  },
  optionScroll: {
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
  motionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  motionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  motionButtonSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  motionLabel: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  motionLabelSelected: {
    color: colors.primary,
  },
  motionDescription: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  generateButtonContainer: {
    marginVertical: spacing.lg,
  },
  videoCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  generatingContainer: {
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  generatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  generatingText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.md,
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
  videoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.lg,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ImageToVideoScreen;
