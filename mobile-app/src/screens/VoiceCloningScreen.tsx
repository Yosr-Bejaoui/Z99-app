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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { useCredits, useDrawer } from '../context';

const LANGUAGES = [
  'Auto Detect', 'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'
];

export default function VoiceCloningScreen() {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { credits, deductCredits } = useCredits();

  const [voiceSample, setVoiceSample] = useState<any>(null);
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('Auto Detect');
  const [stability, setStability] = useState(50);
  const [similarity, setSimilarity] = useState(75);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      if (result.assets && result.assets.length > 0) {
        setVoiceSample(result.assets[0]);
      }
    } catch (err) {
      console.log('Error picking audio', err);
    }
  };

  const removeSample = () => {
    setVoiceSample(null);
  };

  const generateVoice = async () => {
    if (!voiceSample) {
      Alert.alert('Missing Voice Sample', 'Please upload a voice sample first.');
      return;
    }
    if (text.trim().length === 0) {
      Alert.alert('Missing Text', 'Please enter text for the voice to say.');
      return;
    }
    if (!credits || credits.credits < 50) {
      Alert.alert('Insufficient Credits', 'You need 50 coins to generate a cloned voice.');
      return;
    }

    setIsGenerating(true);
    setGeneratedAudio(null);

    // Simulate API call
    setTimeout(() => {
      deductCredits(50, 'Voice cloning generation');
      setGeneratedAudio({
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Dummy generated audio
        duration: 212,
      });
      setIsGenerating(false);
    }, 3000);
  };

  const toggleSound = async () => {
    if (!generatedAudio) return;

    if (isPlaying) {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
      setIsPlaying(false);
    } else {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync({ uri: generatedAudio.url }, { shouldPlay: true });
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
            sound.setPositionAsync(0);
          }
        });
      } else {
        await soundRef.current.playAsync();
      }
      setIsPlaying(true);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={openDrawer}
          accessibilityRole="button"
          accessibilityLabel="Open Menu"
        >
          <Ionicons name="menu-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Voice Cloning</Text>
        
        <View style={styles.headerButton}>
          <View style={styles.coinBadge}>
            <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.coinBadgeText}>{credits?.credits || 0}</Text>
          
      </View>
      </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 1: Upload */}
          <Text style={styles.sectionTitle}>Voice Sample</Text>
        <GlassCard style={styles.card}>
          {!voiceSample ? (
            <TouchableOpacity style={styles.uploadArea} onPress={pickAudio}>
              <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
              <Text style={styles.uploadText}>Upload a voice sample</Text>
              <Text style={styles.uploadSubtext}>Best results with 30–60 seconds of clear speech</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.fileCard}>
              <View style={styles.fileInfo}>
                <Ionicons name="document-text" size={24} color={colors.primary} />
                <View style={styles.fileTextContainer}>
                  <Text style={styles.fileName} numberOfLines={1}>{voiceSample.name}</Text>
                  <Text style={styles.fileSize}>{(voiceSample.size / 1024 / 1024).toFixed(2)} MB</Text>
                </View>
              </View>
              <TouchableOpacity onPress={removeSample} style={styles.removeBtn}>
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </GlassCard>

        {/* Step 2: Text Input */}
        <Text style={styles.sectionTitle}>Speech Text</Text>
        <GlassCard style={styles.card}>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={5}
            placeholder="Type your script here..."
            placeholderTextColor={colors.textSecondary + '80'}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
          />
          <Text style={styles.charCounter}>{text.length} chars</Text>
        </GlassCard>

        {/* Step 3: Settings */}
        <Text style={styles.sectionTitle}>Language Settings</Text>

        <Text style={styles.subSectionTitle}>Language</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={styles.chipContainer}>
          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang}
              style={[styles.chip, language === lang && styles.chipActive]}
              onPress={() => setLanguage(lang)}>
              <Text style={[styles.chipText, language === lang && styles.chipTextActive]}>
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <GlassCard style={styles.card}>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.settingLabel}>Stability</Text>
              <Text style={styles.settingValue}>{stability}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={stability}
              onValueChange={setStability}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.settingLabel}>Similarity</Text>
              <Text style={styles.settingValue}>{similarity}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={similarity}
              onValueChange={setSimilarity}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>
        </GlassCard>

        {/* Result Audio Player */}
        {generatedAudio && (
          <GlassCard style={styles.resultCard}>
            <Text style={styles.resultTitle}>Cloned Voice Generated</Text>
            <View style={styles.playerRow}>
              <TouchableOpacity onPress={toggleSound} style={styles.playButton}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={colors.white} />
              </TouchableOpacity>
              <View style={styles.playerControls}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '0%' }]} />
                </View>
                <Text style={styles.durationLabel}>0:00 / {Math.floor(generatedAudio.duration / 60)}:{(generatedAudio.duration % 60).toString().padStart(2, '0')}</Text>
              </View>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="download-outline" size={20} color={colors.primary} />
                <Text style={styles.actionText}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={20} color={colors.primary} />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <GradientButton
          title={isGenerating ? "Cloning voice..." : "Clone & Generate"}
          onPress={generateVoice}
          disabled={isGenerating}
          icon={isGenerating ? <ActivityIndicator color={colors.white} size="small" /> : undefined}
          badge="🪙 50"
        />
      </View>
    </View>
  );
}

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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  uploadArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface + '40',
  },
  uploadText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    marginTop: spacing.sm,
  },
  uploadSubtext: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface + '80',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileTextContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  fileName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  removeBtn: {
    padding: spacing.xs,
  },
  textInput: {
    color: colors.textPrimary,
    fontSize: 16,
    minHeight: 120,
  },
  charCounter: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  horizontalScroll: { flexGrow: 0 },
  chipContainer: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xs, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: 'rgba(16, 163, 127, 0.12)',
    borderColor: 'rgba(16, 163, 127, 0.3)',
    borderWidth: 1,
  },
  chipText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  subSectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    marginLeft: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sliderContainer: {
    marginBottom: spacing.md,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  settingLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  settingValue: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  resultCard: {
    padding: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface + 'CC',
    borderColor: colors.primary + '40',
    borderWidth: 1,
  },
  resultTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  playerControls: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  durationLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  bottomContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  coinBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flexShrink: 0,
  },
  coinBadgeText: { color: colors.warning, fontSize: 12, fontWeight: '700' },
  coinIcon: { fontSize: 12 },
});
