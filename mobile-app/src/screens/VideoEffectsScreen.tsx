import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
import * as LegacyFS from 'expo-file-system/legacy';

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
    
    ws.onopen = async () => {
      console.log('WebSocket connected');
      // Convert local video file to base64 for server access
      let videoData = selectedVideo;
      if (selectedVideo && selectedVideo.startsWith('file://')) {
        try {
          const base64 = await LegacyFS.readAsStringAsync(selectedVideo, {
            encoding: LegacyFS.EncodingType.Base64,
          });
          videoData = `data:video/mp4;base64,${base64}`;
        } catch (e) {
          console.error('Failed to read video as base64:', e);
        }
      }
      ws.send(JSON.stringify({
        message: `Apply ${selectedEffect} effect`,
        images: [videoData],
        effect: selectedEffect,
      }));
    };

    ws.onmessage = (event) => {
      try {
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
          ws.close();
        } else if (data.error) {
          const errorMsg = typeof data.error === 'string' ? data.error : (data.error?.message || 'An error occurred');
          Alert.alert('Error', errorMsg);
          setProcessedVideos(prev => prev.filter(v => v.status !== 'processing'));
          setIsProcessing(false);
          ws.close();
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    ws.onerror = () => {
      Alert.alert('Connection Error', 'Failed to connect to the server. Please try again.');
      setProcessedVideos(prev => prev.filter(v => v.status !== 'processing'));
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
                    <Skeleton width="100%" height={140} borderRadius={12} style={{ marginBottom: 16 }} />
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
  videoCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.md,
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
    marginTop: spacing.md,
  },
  uploadSubtext: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
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
    marginBottom: spacing.lg,
  },
  effectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  effectButton: {
    width: '48%',
    alignItems: 'center',
    padding: spacing.lg,
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
    marginBottom: spacing.sm,
  },
  effectIconSelected: {
    backgroundColor: colors.primary + '30',
  },
  effectLabel: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
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
    marginVertical: spacing.lg,
  },
  resultCard: {
    marginBottom: spacing.lg,
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
    marginTop: spacing.lg,
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
    marginTop: spacing.md,
  },
  resultEffect: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
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

export default VideoEffectsScreen;
