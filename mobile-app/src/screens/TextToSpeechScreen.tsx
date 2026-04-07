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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { chatService, mediaService } from '../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, WS_BASE_URL } from '../services/config';

const voiceStyles = [
  { id: 'natural', label: 'Natural', icon: 'person' as const },
  { id: 'news', label: 'News', icon: 'newspaper' as const },
  { id: 'cheerful', label: 'Cheerful', icon: 'happy' as const },
  { id: 'calm', label: 'Calm', icon: 'leaf' as const },
];

const voiceGenders = [
  { id: 'male', label: 'Male', icon: 'man' as const },
  { id: 'female', label: 'Female', icon: 'woman' as const },
];

interface GeneratedAudio {
  id: string;
  url: string;
  text: string;
  voice: string;
  status: 'generating' | 'completed' | 'failed';
  duration?: number;
}

interface AIModel {
  id: number;
  name: string;
  model_type: string;
}

const TextToSpeechScreen: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('natural');
  const [selectedGender, setSelectedGender] = useState('female');
  const [speed, setSpeed] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    loadModels();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const loadModels = async () => {
    try {
      const response = await chatService.getModels('text_to_speech');
      const ttsModels = response.results.filter(m => m.model_type === 'text_to_speech');
      setModels(ttsModels);
      if (ttsModels.length > 0) {
        setSelectedModel(ttsModels[0].id);
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
      ws.send(JSON.stringify({
        message: text,
        voice_style: selectedStyle,
        voice_gender: selectedGender,
        speed: speed,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WS message:', data);
        
        if (data.audio_url || data.url) {
          const audioUrl = data.audio_url || data.url;
          setGeneratedAudios(prev => [
            {
              id: Date.now().toString(),
              url: audioUrl,
              text: text,
              voice: `${selectedGender} - ${selectedStyle}`,
              status: 'completed',
            },
            ...prev.filter(a => a.status !== 'generating'),
          ]);
          setIsGenerating(false);
          setText('');
          ws.close();
        } else if (data.error) {
          const errorMsg = typeof data.error === 'string' ? data.error : (data.error?.message || 'An error occurred');
          Alert.alert('Error', errorMsg);
          setGeneratedAudios(prev => prev.filter(a => a.status !== 'generating'));
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
      setGeneratedAudios(prev => prev.filter(a => a.status !== 'generating'));
      setIsGenerating(false);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };

    wsRef.current = ws;
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter text to convert');
      return;
    }
    if (!selectedModel) {
      Alert.alert('Error', 'No TTS model available');
      return;
    }

    setIsGenerating(true);
    
    setGeneratedAudios(prev => [
      {
        id: 'generating',
        url: '',
        text: text,
        voice: `${selectedGender} - ${selectedStyle}`,
        status: 'generating',
      },
      ...prev,
    ]);

    try {
      const session = await chatService.createSession(selectedModel, 'text_to_speech');
      await connectWebSocket(session.id);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate audio');
      setIsGenerating(false);
      setGeneratedAudios(prev => prev.filter(a => a.status !== 'generating'));
    }
  };

  const playAudio = async (audio: GeneratedAudio) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      if (playingId === audio.id) {
        setPlayingId(null);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audio.url },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlayingId(audio.id);

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const handleDownload = async (audio: GeneratedAudio) => {
    try {
      await mediaService.saveAudioFile(audio.url, `tts_${audio.id}.mp3`);
      Alert.alert('Success', 'Audio saved to your device');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to download audio');
    }
  };

  const handleShare = async (audio: GeneratedAudio) => {
    try {
      await mediaService.shareFile(audio.url, `tts_${audio.id}.mp3`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to share audio');
    }
  };

  const handleDelete = (audioId: string) => {
    Alert.alert(
      'Delete Audio',
      'Are you sure you want to remove this audio?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setGeneratedAudios(prev => prev.filter(a => a.id !== audioId));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Text To Speech" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Text Input */}
        <GlassCard style={styles.textCard}>
          <View style={styles.textHeader}>
            <Text style={styles.sectionTitle}>Enter Text</Text>
            <Text style={styles.charCount}>{text.length}/5000</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Type or paste the text you want to convert to speech..."
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={5000}
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

        {/* Voice Gender */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice</Text>
          <View style={styles.genderRow}>
            {voiceGenders.map((gender) => (
              <TouchableOpacity
                key={gender.id}
                onPress={() => setSelectedGender(gender.id)}
                style={[
                  styles.genderButton,
                  selectedGender === gender.id && styles.genderButtonSelected,
                ]}
              >
                <Ionicons
                  name={gender.icon}
                  size={24}
                  color={selectedGender === gender.id ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.genderButtonText,
                    selectedGender === gender.id && styles.genderButtonTextSelected,
                  ]}
                >
                  {gender.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Voice Style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Style</Text>
          <View style={styles.styleGrid}>
            {voiceStyles.map((style) => (
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

        {/* Speed Slider */}
        <View style={styles.section}>
          <View style={styles.speedHeader}>
            <Text style={styles.sectionTitle}>Speed</Text>
            <Text style={styles.speedValue}>{speed.toFixed(1)}x</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={2.0}
            step={0.1}
            value={speed}
            onValueChange={setSpeed}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>0.5x</Text>
            <Text style={styles.sliderLabel}>1.0x</Text>
            <Text style={styles.sliderLabel}>2.0x</Text>
          </View>
        </View>

        {/* Generate Button */}
        <View style={styles.generateButtonContainer}>
          <GradientButton
            title={isGenerating ? 'Generating...' : 'Generate Audio'}
            onPress={handleGenerate}
            disabled={isGenerating || !text.trim()}
            icon={isGenerating ? undefined : 'volume-high'}
          />
        </View>

        {/* Generated Audios */}
        {generatedAudios.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Generated Audio</Text>
            {generatedAudios.map((audio) => (
              <GlassCard key={audio.id} style={styles.audioCard}>
                {audio.status === 'generating' ? (
                  <View style={styles.generatingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.generatingText}>Generating audio...</Text>
                  </View>
                ) : (
                  <View style={styles.audioItem}>
                    <TouchableOpacity
                      style={styles.playButton}
                      onPress={() => playAudio(audio)}
                    >
                      <Ionicons
                        name={playingId === audio.id ? 'pause' : 'play'}
                        size={24}
                        color={colors.foreground}
                      />
                    </TouchableOpacity>
                    <View style={styles.audioInfo}>
                      <Text style={styles.audioText} numberOfLines={2}>
                        {audio.text}
                      </Text>
                      <Text style={styles.audioVoice}>{audio.voice}</Text>
                    </View>
                    <View style={styles.audioActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleShare(audio)}
                      >
                        <Ionicons name="share-outline" size={20} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDownload(audio)}
                      >
                        <Ionicons name="download-outline" size={20} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(audio.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
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
  scrollContent: { gap: spacing.lg,
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
  textCard: {
    marginBottom: spacing.lg,
  },
  textHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  textInput: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 12,
    padding: spacing.lg,
    color: colors.foreground,
    fontSize: 15,
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: {
    marginBottom: spacing.lg,
  },
  optionScroll: {
    gap: 10,
    paddingTop: spacing.md,
  },
  modelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  genderRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderButtonSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  genderButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  genderButtonTextSelected: {
    color: colors.primary,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: spacing.md,
  },
  styleButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  styleButtonSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  styleButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  styleButtonTextSelected: {
    color: colors.primary,
  },
  speedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speedValue: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: spacing.sm,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  sliderLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  generateButtonContainer: {
    marginVertical: spacing.lg,
  },
  audioCard: {
    marginBottom: spacing.md,
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
  },
  generatingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  audioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioInfo: {
    flex: 1,
  },
  audioText: {
    color: colors.foreground,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  audioVoice: {
    color: colors.textMuted,
    fontSize: 12,
  },
  audioActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    padding: spacing.sm,
  },
});

export default TextToSpeechScreen;
