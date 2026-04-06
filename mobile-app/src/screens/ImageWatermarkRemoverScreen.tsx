import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useDrawer, useCredits } from '../context';
import { colors, spacing, borderRadius } from '../theme';
import GradientButton from '../components/GradientButton';
import { GlassCard } from '../components/GlassCard';

const { width } = Dimensions.get('window');

type StepState = 'upload' | 'processing' | 'result' | 'options';

const ImageWatermarkRemoverScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  
  const { credits, hasEnoughCredits, deductCredits } = useCredits();
  
  const [step, setStep] = useState<StepState>('upload');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [resolution, setResolution] = useState('1080p');

  const handleUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handleGenerate = () => {
    if (!mediaUri) {
      Alert.alert('Error', 'Please upload an image first.');
      return;
    }
    if (!hasEnoughCredits(20)) {
      Alert.alert('Error', 'Insufficient balance. You need 20 coins.');
      return;
    }
    Alert.alert(
      'Confirm',
      `Generate action costs 20 coins. Proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate',
          style: 'default',
          onPress: async () => {
            await deductCredits(20, 'Image Watermark Remover');
            setStep('processing');
            setTimeout(() => {
              setResultUri('https://media.istockphoto.com/id/1321746200/photo/mockup-of-a-white-t-shirt-with-blank-copy-space.jpg?s=612x612&w=0&k=20&c=Jd24H12b4T089z_xG-yH9z4E0M2Bq-lR9Xn9V1t_MQQ=');
              setStep('result');
            }, 2500);
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={openDrawer}>
          <Ionicons name="menu-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Image Watermark</Text>
        <View style={styles.iconButton}>
          <View style={styles.coinBadge}>
             <Text style={styles.coinBadgeText}>🪙 {credits?.credits || 0}</Text>
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
          {step === 'upload' && (
            <GlassCard style={styles.uploadCard}>
              <TouchableOpacity style={styles.uploadBox} onPress={handleUpload}>
                {mediaUri ? (
                  <View style={styles.mockMedia}>
                    <Ionicons name="checkmark-circle" size={48} color="#10b981" />
                    <Text style={styles.uploadTextDark}>Media selected</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="image-outline" size={48} color="#94a3b8" />
                    <Text style={styles.uploadText}>Tap to select an image</Text>
                  </>
                )}
              </TouchableOpacity>

              
            </GlassCard>
          )}

          {step === 'processing' && (
            <GlassCard style={styles.uploadCard}>
              <View style={styles.processingBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            </GlassCard>
          )}

          {(step === 'result' || step === 'options') && (
            <GlassCard style={styles.resultCard}>
              <View style={styles.videoPreview}>
                <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
                  <View style={{ flex: 1, overflow: 'hidden' }}>
                    {mediaUri && <Image source={{ uri: mediaUri }} style={{ width: '200%', height: '100%' }} resizeMode="cover" />}
                  </View>
                  <View style={{ flex: 1, overflow: 'hidden' }}>
                    {resultUri && <Image source={{ uri: resultUri }} style={{ width: '200%', height: '100%', left: '-100%' }} resizeMode="cover" />}
                  </View>
                </View>

                {/* Overlays */}
                <View style={styles.splitLeft}>
                  <Text style={styles.splitLabel}>Original</Text>
                </View>
                <View style={styles.splitRight}>
                  <Text style={styles.splitLabelRight}>Upscaled</Text>
                </View>

                {/* Slider Handle mock */}
                <View style={styles.sliderHandle}>
                  <View style={styles.sliderLine} />
                  <View style={styles.sliderButton}>
                    <Ionicons name="swap-horizontal" size={16} color={colors.black} />
                  </View>
                </View>

                
                <View style={styles.timeBadge}><Text style={styles.timeText}>0:15</Text></View>
                <View style={styles.previewPill}><Text style={styles.previewText}>Preview</Text></View>
                <TouchableOpacity style={styles.fullscreenIcon}>
                  <Ionicons name="expand" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
              {step === 'result' && (
                <TouchableOpacity onPress={() => setStep('options')} style={styles.toggleOptions}>
                  <Text style={styles.toggleOptionsText}>Show Options</Text>
                </TouchableOpacity>
              )}
            </GlassCard>
          )}

          {step === 'options' && (
            <GlassCard style={styles.optionsCard}>      
              <Text style={styles.optionsHeader}>Options</Text>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>? Download</Text>
              </TouchableOpacity>
            </GlassCard>
          )}

        </ScrollView>

        <View style={styles.bottomBar}>
          {(step === 'upload' || step === 'processing') ? (
            
            <GradientButton
              onPress={handleGenerate}
              title="Generate"
              disabled={step === 'processing' || !mediaUri}
              loading={step === 'processing'}
              badge="20 Coins"
              style={styles.ctaButton}
            />
          ) : (
            
            <GradientButton
              onPress={() => {}}
              title="Share"
              style={styles.ctaButton}
            />
          )}
        </View>

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
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  content: { padding: spacing.lg, alignItems: 'center', flexGrow: 1 },
  
  uploadCard: {
    width: '100%',
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  uploadBox: {
    width: '100%', height: 220,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'solid', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',     
    backgroundColor: colors.surface
  },
  uploadText: { marginTop: spacing.md, color: colors.textSecondary, fontSize: 16, fontWeight: '500' },
  mockMedia: { alignItems: 'center', justifyContent: 'center' },
  uploadTextDark: { marginTop: spacing.sm, color: colors.success, fontSize: 16, fontWeight: '600' },
  
  dropdownContainer: { width: '100%', marginTop: spacing.xl },
  dropdownLabel: { color: colors.white, fontSize: 14, fontWeight: '600', marginBottom: spacing.md },
  resolutionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  resOption: { flex: 1, marginHorizontal: spacing.xs, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.backgroundTertiary, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  resOptionActive: { borderColor: colors.primary, backgroundColor: colors.cardHover },
  resText: { color: colors.textSecondary, fontWeight: '600' },
  resTextActive: { color: colors.primaryLight, fontWeight: '700' },

  processingBox: {
    width: '100%', height: 220,
    alignItems: 'center', justifyContent: 'center'
  },
  processingText: { marginTop: spacing.lg, color: colors.primary, fontSize: 16, fontWeight: '600' },

  resultCard: { width: '100%', alignItems: 'center', marginBottom: spacing.lg },
  videoPreview: {
    width: '100%', height: 250,
    backgroundColor: '#000000',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1, borderColor: colors.backgroundTertiary,
    flexDirection: 'row'
  },
    splitLeft: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-start', padding: spacing.md },
    splitRight: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-start', padding: spacing.md, alignItems: 'flex-end' },
  splitLabel: { color: colors.foreground, fontSize: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, borderRadius: 4, marginTop: 40 },
  splitLabelRight: { color: colors.foreground, fontSize: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, borderRadius: 4, marginTop: 40 },
  
  sliderHandle: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  sliderLine: { width: 2, height: '100%', backgroundColor: colors.white },
  sliderButton: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },

  playIcon: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -32 }, { translateY: -32 }], opacity: 0.8, zIndex: 20 },
  
  timeBadge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 6, zIndex: 20 },
  timeText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  previewPill: { position: 'absolute', top: 12, left: 12, backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 20, zIndex: 20 },
  previewText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  fullscreenIcon: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.4)', padding: 6, borderRadius: 8, zIndex: 20 },

  toggleOptions: { marginTop: spacing.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 20, backgroundColor: colors.backgroundTertiary },
  toggleOptionsText: { color: colors.textSecondary, fontWeight: '600' },

  optionsCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1, borderColor: colors.backgroundTertiary,
    marginTop: 10
  },
  optionsHeader: { color: colors.white, fontSize: 16, fontWeight: '600', marginBottom: spacing.lg },
  actionBtn: { backgroundColor: colors.backgroundTertiary, paddingVertical: spacing.md, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },

  bottomBar: { padding: spacing.lg, paddingBottom: 30, backgroundColor: 'transparent' },
  ctaButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, borderRadius: 28, position: 'relative'
  },
  ctaText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  badgeText: { position: 'absolute', right: 16, color: colors.warning, fontSize: 14, fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: spacing.xs, borderRadius: 12 },
  coinBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  coinBadgeText: { color: colors.warning, fontSize: 12, fontWeight: '700' },
  coinIcon: { fontSize: 12 },

  iconButton: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
});

export default ImageWatermarkRemoverScreen;
