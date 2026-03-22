import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { chatService, mediaService } from '../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, WS_BASE_URL } from '../services/config';

const formatOptions = [
  { id: 'glb', label: 'GLB', description: 'Universal 3D format' },
  { id: 'obj', label: 'OBJ', description: 'Classic format' },
  { id: 'fbx', label: 'FBX', description: 'Animation ready' },
];

const qualityOptions = [
  { id: 'draft', label: 'Draft', time: '~30s' },
  { id: 'standard', label: 'Standard', time: '~2min' },
  { id: 'high', label: 'High', time: '~5min' },
];

interface Generated3DModel {
  id: string;
  modelUrl: string;
  previewUrl?: string;
  sourceImage: string;
  format: string;
  status: 'generating' | 'completed' | 'failed';
}

interface AIModel {
  id: number;
  name: string;
  model_type: string;
}

const ImageTo3DScreen: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState('glb');
  const [selectedQuality, setSelectedQuality] = useState('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedModels, setGeneratedModels] = useState<Generated3DModel[]>([]);
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
      const response = await chatService.getModels('image_to_3d');
      const threeDModels = response.results.filter(m => m.model_type === 'image_to_3d');
      setModels(threeDModels);
      if (threeDModels.length > 0) {
        setSelectedModel(threeDModels[0].id);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
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
      aspect: [1, 1],
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
        message: 'Convert to 3D model',
        images: [selectedImageBase64 || selectedImage],
        format: selectedFormat,
        quality: selectedQuality,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.model_url || data.url) {
          const modelUrl = data.model_url || data.url;
          setGeneratedModels(prev => [
            {
              id: Date.now().toString(),
              modelUrl: modelUrl,
              previewUrl: data.preview_url,
              sourceImage: selectedImage!,
              format: selectedFormat,
              status: 'completed',
            },
            ...prev.filter(m => m.status !== 'generating'),
          ]);
          setIsGenerating(false);
          ws.close();
        } else if (data.error) {
          const errorMsg = typeof data.error === 'string' ? data.error : (data.error?.message || 'An error occurred');
          Alert.alert('Error', errorMsg);
          setGeneratedModels(prev => prev.filter(m => m.status !== 'generating'));
          setIsGenerating(false);
          ws.close();
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    ws.onerror = () => {
      Alert.alert('Connection Error', 'Failed to connect to the server. Please try again.');
      setIsGenerating(false);
    };

    wsRef.current = ws;
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image');
      return;
    }
    if (!selectedModel) {
      Alert.alert('Error', 'No 3D model available');
      return;
    }

    setIsGenerating(true);
    
    setGeneratedModels(prev => [
      {
        id: 'generating',
        modelUrl: '',
        sourceImage: selectedImage,
        format: selectedFormat,
        status: 'generating',
      },
      ...prev,
    ]);

    try {
      const session = await chatService.createSession(selectedModel, 'image_to_3d');
      await connectWebSocket(session.id);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate 3D model');
      setIsGenerating(false);
      setGeneratedModels(prev => prev.filter(m => m.status !== 'generating'));
    }
  };

  const handleDownload = async (model: Generated3DModel) => {
    try {
      // 3D models need to be opened in browser for download
      await Linking.openURL(model.modelUrl);
    } catch (error) {
      Alert.alert('Error', 'Failed to download model');
    }
  };

  const handleShare = async (model: Generated3DModel) => {
    try {
      await mediaService.shareFile(model.modelUrl, `model_${model.id}.${model.format}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to share model');
    }
  };

  const handleDelete = (modelId: string) => {
    Alert.alert(
      'Delete Model',
      'Are you sure you want to remove this 3D model?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setGeneratedModels(prev => prev.filter(m => m.id !== modelId));
          },
        },
      ]
    );
  };

  const downloadModel = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Failed to download model');
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
          <Text style={styles.headerTitle}>Image to 3D</Text>
          <Text style={styles.headerSubtitle}>Transform images into 3D models</Text>
        </View>

        {/* Image Selection */}
        <GlassCard style={styles.imageCard}>
          <Text style={styles.sectionTitle}>Source Image</Text>
          <Text style={styles.sectionSubtitle}>Best results with clear, single-object images</Text>
          
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

        {/* Quality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quality</Text>
          <View style={styles.qualityRow}>
            {qualityOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedQuality(option.id)}
                style={[
                  styles.qualityButton,
                  selectedQuality === option.id && styles.qualityButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.qualityLabel,
                    selectedQuality === option.id && styles.qualityLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.qualityTime}>{option.time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Format */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Output Format</Text>
          <View style={styles.formatRow}>
            {formatOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedFormat(option.id)}
                style={[
                  styles.formatButton,
                  selectedFormat === option.id && styles.formatButtonSelected,
                ]}
              >
                <Ionicons
                  name="cube-outline"
                  size={24}
                  color={selectedFormat === option.id ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.formatLabel,
                    selectedFormat === option.id && styles.formatLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.formatDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <View style={styles.generateButtonContainer}>
          <GradientButton
            title={isGenerating ? 'Generating...' : 'Generate 3D Model'}
            onPress={handleGenerate}
            disabled={isGenerating || !selectedImage}
            icon={isGenerating ? undefined : 'cube'}
          />
        </View>

        {/* Generated Models */}
        {generatedModels.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Generated Models</Text>
            {generatedModels.map((model) => (
              <GlassCard key={model.id} style={styles.resultCard}>
                {model.status === 'generating' ? (
                  <View style={styles.generatingContainer}>
                    <Image source={{ uri: model.sourceImage }} style={styles.processingImage} />
                    <View style={styles.generatingOverlay}>
                      <ActivityIndicator size="large" color={colors.primary} />
                      <Text style={styles.generatingText}>Creating 3D model...</Text>
                      <Text style={styles.generatingSubtext}>This may take a few minutes</Text>
                    </View>
                  </View>
                ) : (
                  <View>
                    <View style={styles.modelPreview}>
                      {model.previewUrl ? (
                        <Image source={{ uri: model.previewUrl }} style={styles.previewImage} />
                      ) : (
                        <View style={styles.previewPlaceholder}>
                          <Ionicons name="cube" size={48} color={colors.primary} />
                          <Text style={styles.previewText}>3D Model Ready</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.resultInfo}>
                      <View>
                        <Text style={styles.resultFormat}>{model.format.toUpperCase()}</Text>
                        <Text style={styles.resultSize}>Ready to download</Text>
                      </View>
                    </View>
                    <View style={styles.modelActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleShare(model)}
                      >
                        <Ionicons name="share-outline" size={20} color={colors.primary} />
                        <Text style={styles.actionButtonText}>Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDownload(model)}
                      >
                        <Ionicons name="download-outline" size={20} color={colors.primary} />
                        <Text style={styles.actionButtonText}>Download</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(model.id)}
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
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
  optionScroll: {
    gap: 10,
    paddingTop: 8,
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
  qualityRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  qualityButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qualityButtonSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  qualityLabel: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  qualityLabelSelected: {
    color: colors.primary,
  },
  qualityTime: {
    color: colors.textMuted,
    fontSize: 11,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  formatButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formatButtonSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  formatLabel: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 2,
  },
  formatLabelSelected: {
    color: colors.primary,
  },
  formatDescription: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  generateButtonContainer: {
    marginVertical: 20,
  },
  resultCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  generatingContainer: {
    position: 'relative',
  },
  processingImage: {
    width: '100%',
    height: 180,
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
    marginTop: 12,
  },
  generatingSubtext: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  modelPreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundTertiary,
  },
  previewText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  resultInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  resultFormat: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  resultSize: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  modelActions: {
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

export default ImageTo3DScreen;
