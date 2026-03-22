import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { chatService, mediaService } from '../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, WS_BASE_URL } from '../services/config';

const { width } = Dimensions.get('window');

const editTools = [
  { id: 'remove_bg', label: 'Remove BG', icon: 'cut-outline' as const },
  { id: 'enhance', label: 'Enhance', icon: 'sparkles' as const },
  { id: 'upscale', label: 'Upscale', icon: 'resize' as const },
  { id: 'inpaint', label: 'Inpaint', icon: 'brush' as const },
  { id: 'colorize', label: 'Colorize', icon: 'color-palette' as const },
  { id: 'restore', label: 'Restore', icon: 'refresh' as const },
];

interface EditedImage {
  id: string;
  url: string;
  tool: string;
  prompt?: string;
  status: 'processing' | 'completed' | 'failed';
}

interface AIModel {
  id: number;
  name: string;
  model_type: string;
}

const ImageEditorScreen: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState('enhance');
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editedImages, setEditedImages] = useState<EditedImage[]>([]);
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
      const response = await chatService.getModels('image_editor');
      const editorModels = response.results.filter(
        m => m.model_type === 'image_editor' || m.model_type === 'image_tool'
      );
      setModels(editorModels);
      if (editorModels.length > 0) {
        setSelectedModel(editorModels[0].id);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
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
      quality: 0.9,
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
        message: prompt || `Apply ${selectedTool} to this image`,
        images: [selectedImageBase64 || selectedImage],
        tool: selectedTool,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.image_url || data.url || data.images) {
          const imageUrl = data.image_url || data.url || (data.images && data.images[0]);
          setEditedImages(prev => [
            {
              id: Date.now().toString(),
              url: imageUrl,
              tool: selectedTool,
              prompt: prompt,
              status: 'completed',
            },
            ...prev.filter(i => i.status !== 'processing'),
          ]);
          setIsProcessing(false);
          ws.close();
        } else if (data.error) {
          const errorMsg = typeof data.error === 'string' ? data.error : (data.error?.message || 'An error occurred');
          Alert.alert('Error', errorMsg);
          setEditedImages(prev => prev.filter(i => i.status !== 'processing'));
          setIsProcessing(false);
          ws.close();
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    ws.onerror = () => {
      Alert.alert('Connection Error', 'Failed to connect to the server. Please try again.');
      setIsProcessing(false);
    };

    wsRef.current = ws;
  };

  const handleProcess = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image');
      return;
    }
    if (!selectedModel) {
      Alert.alert('Error', 'No editor model available');
      return;
    }

    setIsProcessing(true);
    
    setEditedImages(prev => [
      {
        id: 'processing',
        url: '',
        tool: selectedTool,
        prompt: prompt,
        status: 'processing',
      },
      ...prev,
    ]);

    try {
      const session = await chatService.createSession(selectedModel, 'image_editor');
      await connectWebSocket(session.id);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process image');
      setIsProcessing(false);
      setEditedImages(prev => prev.filter(i => i.status !== 'processing'));
    }
  };

  const handleDownload = async (image: EditedImage) => {
    try {
      await mediaService.saveImageToGallery(image.url);
      Alert.alert('Success', 'Image saved to your gallery');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to download image');
    }
  };

  const handleShare = async (image: EditedImage) => {
    try {
      await mediaService.shareFile(image.url, `edited_${image.id}.jpg`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to share image');
    }
  };

  const handleDelete = (imageId: string) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setEditedImages(prev => prev.filter(i => i.id !== imageId));
          },
        },
      ]
    );
  };

  const needsPrompt = ['inpaint'].includes(selectedTool);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Image Editor</Text>
          <Text style={styles.headerSubtitle}>AI-powered image editing tools</Text>
        </View>

        {/* Image Selection */}
        <GlassCard style={styles.imageCard}>
          <Text style={styles.sectionTitle}>Select Image</Text>
          
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

        {/* Tool Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edit Tool</Text>
          <View style={styles.toolGrid}>
            {editTools.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                onPress={() => setSelectedTool(tool.id)}
                style={[
                  styles.toolButton,
                  selectedTool === tool.id && styles.toolButtonSelected,
                ]}
              >
                <View style={[
                  styles.toolIcon,
                  selectedTool === tool.id && styles.toolIconSelected,
                ]}>
                  <Ionicons
                    name={tool.icon}
                    size={22}
                    color={selectedTool === tool.id ? colors.primary : colors.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.toolLabel,
                    selectedTool === tool.id && styles.toolLabelSelected,
                  ]}
                >
                  {tool.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Prompt Input (for inpainting) */}
        {needsPrompt && (
          <GlassCard style={styles.promptCard}>
            <Text style={styles.sectionTitle}>Describe what to add/change</Text>
            <TextInput
              style={styles.promptInput}
              placeholder="E.g., Add a blue sky background..."
              placeholderTextColor={colors.textMuted}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </GlassCard>
        )}

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
                    styles.modelButton,
                    selectedModel === model.id && styles.modelButtonSelected,
                  ]}
                >
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
          </View>
        )}

        {/* Process Button */}
        <View style={styles.processButtonContainer}>
          <GradientButton
            title={isProcessing ? 'Processing...' : 'Apply Edit'}
            onPress={handleProcess}
            disabled={isProcessing || !selectedImage}
            icon={isProcessing ? undefined : 'checkmark-circle'}
          />
        </View>

        {/* Edited Images */}
        {editedImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Edited Images</Text>
            {editedImages.map((image) => (
              <GlassCard key={image.id} style={styles.resultCard}>
                {image.status === 'processing' ? (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.processingText}>Processing image...</Text>
                  </View>
                ) : (
                  <View>
                    <Image source={{ uri: image.url }} style={styles.resultImage} />
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultTool}>
                        {editTools.find(t => t.id === image.tool)?.label || image.tool}
                      </Text>
                    </View>
                    <View style={styles.imageActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleShare(image)}
                      >
                        <Ionicons name="share-outline" size={20} color={colors.primary} />
                        <Text style={styles.actionButtonText}>Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDownload(image)}
                      >
                        <Ionicons name="download-outline" size={20} color={colors.primary} />
                        <Text style={styles.actionButtonText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(image.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
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
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  imageCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  imageButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  imageButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
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
  section: {
    marginBottom: 20,
  },
  toolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolButton: {
    width: '31%',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolButtonSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  toolIconSelected: {
    backgroundColor: colors.primary + '30',
  },
  toolLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  toolLabelSelected: {
    color: colors.primary,
  },
  promptCard: {
    marginBottom: 20,
  },
  promptInput: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 12,
    padding: 16,
    color: colors.foreground,
    fontSize: 15,
    minHeight: 60,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionScroll: {
    gap: 10,
  },
  modelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modelButtonSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  modelButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  modelButtonTextSelected: {
    color: colors.primary,
  },
  processButtonContainer: {
    marginVertical: 20,
  },
  resultCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  processingText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: colors.backgroundTertiary,
  },
  resultInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  resultTool: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ImageEditorScreen;
