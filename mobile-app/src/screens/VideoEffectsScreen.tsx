import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { chatService, mediaService } from '../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, WS_BASE_URL } from '../services/config';

const { width } = Dimensions.get('window');

const effectOptions = [
  { id: 'slowmo', label: 'Slow Motion', icon: 'speedometer-outline' as const, description: '0.5x speed' },
  { id: 'reverse', label: 'Reverse', icon: 'return-down-back' as const, description: 'Play backwards' },
  { id: 'loop', label: 'Boomerang', icon: 'repeat' as const, description: 'Forward & back' },
  { id: 'timelapse', label: 'Time Lapse', icon: 'timer-outline' as const, description: '4x speed' },
  { id: 'stabilize', label: 'Stabilize', icon: 'shield-checkmark' as const, description: 'Remove shake' },
  { id: 'enhance', label: 'AI Enhance', icon: 'sparkles' as const, description: 'Improve quality' },
];

interface ProcessedVideo {
  id: string;
  url: string;
  effect: string;
  status: 'processing' | 'completed' | 'failed';
}

interface AIModel {
  id: number;
  name: string;
  model_type: string;
}

const VideoEffectsScreen: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState('slowmo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedVideos, setProcessedVideos] = useState<ProcessedVideo[]>([]);
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
      const response = await chatService.getModels('video_effect');
      const effectModels = response.results.filter(m => m.model_type === 'video_effect' || m.model_type === 'video_upscaler');
      setModels(effectModels);
      if (effectModels.length > 0) {
        setSelectedModel(effectModels[0].id);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedVideo(result.assets[0].uri);
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
        message: `Apply ${selectedEffect} effect`,
        video_url: selectedVideo,
        effect: selectedEffect,
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.video_url || data.url) {
        const videoUrl = data.video_url || data.url;
        setProcessedVideos(prev => [
          {
            id: Date.now().toString(),
            url: videoUrl,
            effect: selectedEffect,
            status: 'completed',
          },
          ...prev.filter(v => v.status !== 'processing'),
        ]);
        setIsProcessing(false);
      } else if (data.error) {
        const errorMsg = typeof data.error === 'string' ? data.error : (data.error?.message || 'An error occurred');
        Alert.alert('Error', errorMsg);
        setProcessedVideos(prev => prev.filter(v => v.status !== 'processing'));
        setIsProcessing(false);
      }
    };

    ws.onerror = () => {
      setIsProcessing(false);
    };

    wsRef.current = ws;
  };

  const handleProcess = async () => {
    if (!selectedVideo) {
      Alert.alert('Error', 'Please select a video');
      return;
    }
    if (!selectedModel) {
      Alert.alert('Error', 'No effect model available');
      return;
    }

    setIsProcessing(true);
    
    setProcessedVideos(prev => [
      {
        id: 'processing',
        url: '',
        effect: selectedEffect,
        status: 'processing',
      },
      ...prev,
    ]);

    try {
      const session = await chatService.createSession(selectedModel, 'video_effect');
      await connectWebSocket(session.id);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process video');
      setIsProcessing(false);
      setProcessedVideos(prev => prev.filter(v => v.status !== 'processing'));
    }
  };

  const handleDownload = async (video: ProcessedVideo) => {
    try {
      await mediaService.saveVideoToGallery(video.url);
      Alert.alert('Success', 'Video saved to your gallery');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to download video');
    }
  };

  const handleShare = async (video: ProcessedVideo) => {
    try {
      await mediaService.shareFile(video.url, `effect_${video.id}.mp4`);
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
            setProcessedVideos(prev => prev.filter(v => v.id !== videoId));
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
          <Text style={styles.headerTitle}>Video Effects</Text>
          <Text style={styles.headerSubtitle}>Apply AI-powered effects to your videos</Text>
        </View>

        {/* Video Selection */}
        <GlassCard style={styles.videoCard}>
          <Text style={styles.sectionTitle}>Source Video</Text>
          
          {selectedVideo ? (
            <View style={styles.selectedVideoContainer}>
              <Video
                source={{ uri: selectedVideo }}
                style={styles.selectedVideo}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
              />
              <TouchableOpacity
                style={styles.removeVideoButton}
                onPress={() => setSelectedVideo(null)}
              >
                <Ionicons name="close-circle" size={28} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={pickVideo}>
              <Ionicons name="videocam-outline" size={40} color={colors.primary} />
              <Text style={styles.uploadText}>Select Video</Text>
              <Text style={styles.uploadSubtext}>MP4, MOV up to 100MB</Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Effect Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Effect</Text>
          <View style={styles.effectGrid}>
            {effectOptions.map((effect) => (
              <TouchableOpacity
                key={effect.id}
                onPress={() => setSelectedEffect(effect.id)}
                style={[
                  styles.effectButton,
                  selectedEffect === effect.id && styles.effectButtonSelected,
                ]}
              >
                <View style={[
                  styles.effectIcon,
                  selectedEffect === effect.id && styles.effectIconSelected,
                ]}>
                  <Ionicons
                    name={effect.icon}
                    size={24}
                    color={selectedEffect === effect.id ? colors.primary : colors.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.effectLabel,
                    selectedEffect === effect.id && styles.effectLabelSelected,
                  ]}
                >
                  {effect.label}
                </Text>
                <Text style={styles.effectDescription}>{effect.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Process Button */}
        <View style={styles.processButtonContainer}>
          <GradientButton
            title={isProcessing ? 'Processing...' : 'Apply Effect'}
            onPress={handleProcess}
            disabled={isProcessing || !selectedVideo}
            icon={isProcessing ? undefined : 'color-wand'}
          />
        </View>

        {/* Processed Videos */}
        {processedVideos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Processed Videos</Text>
            {processedVideos.map((video) => (
              <GlassCard key={video.id} style={styles.resultCard}>
                {video.status === 'processing' ? (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.processingText}>Processing video...</Text>
                  </View>
                ) : (
                  <View>
                    <Video
                      source={{ uri: video.url }}
                      style={styles.resultVideo}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      isLooping
                    />
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultEffect}>
                        {effectOptions.find(e => e.id === video.effect)?.label || video.effect}
                      </Text>
                    </View>
                    <View style={styles.videoActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleShare(video)}
                      >
                        <Ionicons name="share-outline" size={20} color={colors.primary} />
                        <Text style={styles.actionButtonText}>Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDownload(video)}
                      >
                        <Ionicons name="download-outline" size={20} color={colors.primary} />
                        <Text style={styles.actionButtonText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(video.id)}
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
  videoCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 16,
    padding: 40,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  uploadText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  uploadSubtext: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  selectedVideoContainer: {
    position: 'relative',
  },
  selectedVideo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.backgroundTertiary,
  },
  removeVideoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.background,
    borderRadius: 14,
  },
  section: {
    marginBottom: 20,
  },
  effectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  effectButton: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  effectButtonSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  effectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  effectIconSelected: {
    backgroundColor: colors.primary + '30',
  },
  effectLabel: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  effectLabelSelected: {
    color: colors.primary,
  },
  effectDescription: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
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
  resultVideo: {
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
  resultEffect: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  videoActions: {
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

export default VideoEffectsScreen;
