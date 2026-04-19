import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, Image, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { changeLanguage, SUPPORTED_LANGUAGES } from '../i18n';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState('en');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    if (step === 0) {
      const timer = setTimeout(() => handleNextStep(1), 2500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleNextStep = (nextStep: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_complete', 'true');
      navigation.replace('Landing');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      navigation.replace('Landing');
    }
  };

  const renderSplash = () => (
    <Animated.View style={[styles.fullScreen, { opacity: fadeAnim, backgroundColor: '#020015' }]}>
      <StatusBar hidden />
      {/* Huge subtle glow backgrounds instead of small dots */}
      <LinearGradient colors={['#B451C640', 'transparent']} style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: 200 }} />
      <LinearGradient colors={['#00E5FF30', 'transparent']} style={{ position: 'absolute', bottom: -100, left: -50, width: 350, height: 350, borderRadius: 175 }} />
      <LinearGradient colors={['#B451C620', 'transparent']} style={{ position: 'absolute', top: '30%', left: '10%', width: 200, height: 200, borderRadius: 100 }} />
      
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={styles.logoContainer}>
          {/* Main Logo rendering */}
          <Text style={[styles.logoTextMain, styles.logoShadowBg]}>Z99</Text>
          <Text style={[styles.logoTextMain, {color: '#FFF', position: 'absolute'}]}>Z99</Text>
        </View>
        <Text style={{ color: '#B7BFD9', marginTop: 16, fontSize: 16, letterSpacing: 1 }}>Z99 Ai Platform</Text>
      </View>
    </Animated.View>
  );

  const renderLanguageSelection = () => (
    <Animated.View style={[styles.fullScreen, styles.darkBg, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" hidden={false} />
      <View style={styles.languageContainer}>
        <Text style={styles.title}>Choose the language</Text>
        <Text style={styles.subtitle}>Select your preferred language below. This helps us serve you better.</Text>
        <Text style={styles.sectionHeader}>Select a language</Text>
        <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
          {SUPPORTED_LANGUAGES.map((langObj, index) => {
            const isSelected = selectedLanguageCode === langObj.code;
            return (
              <TouchableOpacity key={langObj.code} style={[styles.languageOption, index === SUPPORTED_LANGUAGES.length - 1 && styles.lastOption]} onPress={() => setSelectedLanguageCode(langObj.code)}>
                <Text style={styles.languageText}>{langObj.nativeName} ({langObj.name})</Text>
                {isSelected && <View style={styles.checkboxSelected}><Ionicons name="checkmark" size={14} color="#FFF" /></View>}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
        <TouchableOpacity 
          style={styles.buttonWrapper} 
          onPress={async () => {
            await changeLanguage(selectedLanguageCode as any);
            handleNextStep(2);
          }}>
          <LinearGradient colors={['#B451C6', '#8B61F2', '#8AB9CE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
            <Text style={styles.gradientButtonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderSlide = (title: string, subtitle: string, imageSource: any, isLast: boolean) => (
    <Animated.View style={[styles.fullScreen, styles.darkBg, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" hidden={false}/>
      <TouchableOpacity style={styles.skipButtonTop} onPress={completeOnboarding}>
        <LinearGradient colors={['#B451C6', '#8B61F2', '#8AB9CE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.skipGradient}>
          <Text style={styles.skipTextTop}>Skip</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.imageWrapper}>
        <Image source={imageSource} style={styles.slideImage} resizeMode="cover" />
        <LinearGradient colors={['transparent', '#121212']} style={styles.imageGradientFade} />
      </View>

      <View style={styles.slideContent}>
        <Text style={styles.slideTitle}>{title}</Text>
        <Text style={styles.slideSubtitle}>{subtitle}</Text>
        <View style={styles.pagination}>
          <View style={[styles.dot, step === 2 ? styles.dotActive : styles.dotInactive]} />
          <View style={[styles.dot, step === 3 ? styles.dotActive : styles.dotInactive]} />
        </View>
        <TouchableOpacity style={styles.buttonWrapper} onPress={() => isLast ? completeOnboarding() : handleNextStep(3)}>
          <LinearGradient colors={['#B451C6', '#8B61F2', '#8AB9CE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
            <Text style={styles.gradientButtonText}>{isLast ? "Get Start" : "Continue"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.wrapper}>
      {step === 0 && renderSplash()}
      {step === 1 && renderLanguageSelection()}
      {step === 2 && renderSlide("Switch Models. Keep the Flow.", "Move between different AI models instantly while your conversation and context stay intact.", require('../../assets/onboard1.png'), false)}
      {step === 3 && renderSlide("Fast & Smart Generation", "Experience lightning-fast content creation powered by intelligent AI technology.", require('../../assets/get start.png'), true)}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#121212' },
  fullScreen: { flex: 1 },
  darkBg: { backgroundColor: '#121212' },
  
  logoContainer: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  logoTextMain: { fontSize: 86, fontWeight: '900', fontStyle: 'italic', zIndex: 2 },
  logoShadowBg: { textShadowColor: '#B451C6', textShadowOffset: { width: 4, height: 4 }, textShadowRadius: 30, color: 'transparent', zIndex: 1 },
  languageContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  title: { color: '#FFF', fontSize: 24, fontWeight: '700', marginTop: 20 },
  subtitle: { color: '#B7BFD9', fontSize: 16, marginTop: 12, marginBottom: 30, lineHeight: 24 },
  sectionHeader: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  languageList: { flex: 1, marginBottom: 20 },
  languageOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#232840' },
  lastOption: { borderBottomWidth: 0 },
  languageText: { color: '#FFF', fontSize: 16 },
  checkboxSelected: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#8B61F2', justifyContent: 'center', alignItems: 'center' },
  skipButtonTop: { position: 'absolute', top: 50, right: 20, zIndex: 10, borderRadius: 20, overflow: 'hidden' },
  skipGradient: { paddingHorizontal: 16, paddingVertical: 6 },
  skipTextTop: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  imageWrapper: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.55, position: 'relative' },
  slideImage: { width: '100%', height: '100%' },
  imageGradientFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  slideContent: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, justifyContent: 'space-between' },
  slideTitle: { color: '#F2F2F7', fontSize: 22, fontWeight: '700', textAlign: 'center', marginHorizontal: 20 },
  slideSubtitle: { color: '#F2F2F7', fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 24, opacity: 0.8 },
  pagination: { flexDirection: 'row', gap: 8, marginVertical: 24 },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 24, backgroundColor: '#8B61F2' },
  dotInactive: { width: 8, backgroundColor: '#EFEFEF', opacity: 0.5 },
  buttonWrapper: { width: '100%', height: 56, borderRadius: 28, overflow: 'hidden', marginTop: 'auto' },
  gradientButton: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gradientButtonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
});

export default OnboardingScreen;
