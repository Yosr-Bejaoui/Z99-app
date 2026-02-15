import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';

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
  { id: '512', label: '512×512' },
  { id: '768', label: '768×768' },
  { id: '1024', label: '1024×1024' },
];

const model_options = [
  { id: 'dalle', name: 'DALL·E 3', color: '#10b981' },
  { id: 'stable', name: 'Stable Diff', color: '#8b5cf6' },
  { id: 'midjourney', name: 'Midjourney', color: '#f59e0b' },
  { id: 'leonardo', name: 'Leonardo', color: '#3b82f6' },
];

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
}

const ImageGenScreen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [selectedResolution, setSelectedResolution] = useState('1024');
  const [selectedModel, setSelectedModel] = useState('dalle');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([
    // Placeholder images
    { id: '1', url: 'https://picsum.photos/400/400?random=1', prompt: 'A cyberpunk city at sunset' },
    { id: '2', url: 'https://picsum.photos/400/400?random=2', prompt: 'Mountain landscape watercolor' },
    { id: '3', url: 'https://picsum.photos/400/400?random=3', prompt: 'Futuristic car design' },
    { id: '4', url: 'https://picsum.photos/400/400?random=4', prompt: 'Abstract geometric art' },
  ]);

  const handleGenerate = () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    // Simulate image generation
    setTimeout(() => {
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: `https://picsum.photos/400/400?random=${Date.now()}`,
        prompt: prompt,
      };
      setGeneratedImages((prev) => [newImage, ...prev]);
      setIsGenerating(false);
      setPrompt('');
    }, 2000);
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
          <Text style={styles.headerTitle}>Image Generation</Text>
          <Text style={styles.headerSubtitle}>Create stunning images with AI</Text>
        </View>

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
          />
        </GlassCard>

        {/* Model Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Model</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modelScroll}
          >
            {model_options.map((model) => (
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

        {/* Generate Button */}
        <GradientButton
          title={isGenerating ? 'Generating...' : 'Generate Image'}
          onPress={handleGenerate}
          style={styles.generateButton}
          disabled={isGenerating || !prompt.trim()}
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
                <TouchableOpacity key={img.id} style={styles.imageContainer}>
                  <Image
                    source={{ uri: img.url }}
                    style={styles.generatedImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.imageOverlay}
                  >
                    <Text style={styles.imagePrompt} numberOfLines={2}>
                      {img.prompt}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
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
  imagePrompt: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 14,
  },
});

export default ImageGenScreen;
