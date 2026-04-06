import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton, GradientText, GlassCard } from '../components';
import { useTranslation } from 'react-i18next';
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

interface LandingScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Landing'>;
}

interface FeatureItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
}

interface AIModelItem {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  type: string;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();

  const features: FeatureItem[] = [
    {
      icon: 'chatbubbles-outline',
      label: t('landing.features.multiModelChat'),
      desc: t('landing.features.multiModelChatDesc'),
    },
    {
      icon: 'image-outline',
      label: t('landing.features.imageGeneration'),
      desc: t('landing.features.imageGenerationDesc'),
    },
    {
      icon: 'flash-outline',
      label: t('landing.features.creditSystem'),
      desc: t('landing.features.creditSystemDesc'),
    },
  ];

  const aiModels: AIModelItem[] = [
    { name: 'ChatGPT', icon: 'logo-react', color: '#10a37f', type: t('landing.aiModels.typeChat') },
    { name: 'Gemini', icon: 'sparkles', color: '#d1d5db', type: t('landing.aiModels.typeChat') },
    { name: 'Claude', icon: 'cube', color: '#9ca3af', type: t('landing.aiModels.typeChat') },
    { name: 'DeepSeek', icon: 'analytics', color: '#6b7280', type: t('landing.aiModels.typeChat') },
    { name: 'DALL·E', icon: 'image', color: colors.foreground, type: t('landing.aiModels.typeImage') },
    { name: 'Stable Diffusion', icon: 'color-palette', color: '#10b981', type: t('landing.aiModels.typeImage') },
  ];

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const featureAnims = useRef(
    features.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(
        100,
        featureAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          })
        )
      ),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#1a1e24', '#0f1115', '#0a0c0f']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.gradientOrb}>
        <LinearGradient
          colors={['rgba(45, 212, 191, 0.15)', 'rgba(14, 165, 233, 0.05)', 'transparent']}
          style={styles.orbGradient}
        />
      
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Title */}
        <Animated.View
          style={[
            styles.heroContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.heroTitle}>{t('landing.heroLine1')}</Text>
          <GradientText style={styles.heroTitleAccent}>{t('landing.heroLine2')}</GradientText>
        </Animated.View>

        {/* Description */}
        <Animated.Text
          style={[
            styles.description,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {t('landing.description')}
        </Animated.Text>

        {/* CTA Buttons */}
        <Animated.View
          style={[
            styles.ctaContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <GradientButton
            title={t('landing.getStarted')}
            onPress={() => navigation.navigate('Login')}
            icon={<Ionicons name="arrow-forward" size={18} color={colors.background} />}
          />

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.secondaryButtonText}>{t('landing.createAccount')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Feature Cards */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <Animated.View
              key={feature.label}
              style={[
                {
                  opacity: featureAnims[index],
                  transform: [
                    {
                      translateY: featureAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <GlassCard style={styles.featureCard}>
                <Ionicons
                  name={feature.icon}
                  size={28}
                  color={colors.primary}
                  style={styles.featureIcon}
                />
                <Text style={styles.featureLabel}>{feature.label}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </GlassCard>
            </Animated.View>
          ))}
        </View>

        {/* AI Models Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('landing.aiModels.title')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('landing.aiModels.subtitle')}
          </Text>
          <View style={styles.modelsGrid}>
            {aiModels.map((model) => (
              <View key={model.name} style={styles.modelCard}>
                <View style={[styles.modelIconContainer, { backgroundColor: model.color + '20' }]}>
                  <Ionicons name={model.icon} size={24} color={model.color} />
                </View>
                <Text style={styles.modelName}>{model.name}</Text>
                <Text style={styles.modelType}>{model.type}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <Ionicons name="sparkles" size={24} color={colors.primary} />
            <Text style={styles.footerBrandName}>{t('app.name')}</Text>
          </View>
          <Text style={styles.footerCopyright}>
            © 2026 {t('app.name')}. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradientOrb: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    overflow: 'hidden',
  },
  orbGradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: typography.fontSizes['5xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.foreground,
    textAlign: 'center',
    letterSpacing: -1,
  },
  heroTitleAccent: {
    fontSize: typography.fontSizes['5xl'],
    fontWeight: typography.fontWeights.bold,
    textAlign: 'center',
    letterSpacing: -1,
  },
  description: {
    fontSize: typography.fontSizes.lg,
    color: colors.foregroundSecondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.foreground,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
  },
  featuresContainer: {
    width: '100%',
    gap: spacing.md,
  },
  featureCard: {
    width: '100%',
  },
  featureIcon: {
    marginBottom: spacing.sm,
  },
  featureLabel: {
    color: colors.foreground,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    marginBottom: spacing.xs,
  },
  featureDesc: {
    color: colors.foregroundMuted,
    fontSize: typography.fontSizes.sm,
    lineHeight: 20,
  },
  section: {
    width: '100%',
    marginTop: spacing.xxl * 1.5,
  },
  sectionTitle: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.foregroundSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  modelCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md * 2) / 3,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modelIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  modelName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.foreground,
    textAlign: 'center',
  },
  modelType: {
    fontSize: typography.fontSizes.xs,
    color: colors.foregroundMuted,
  },
  footer: {
    width: '100%',
    marginTop: spacing.xxl * 2,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  footerBrandName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.foreground,
  },
  footerCopyright: {
    fontSize: typography.fontSizes.sm,
    color: colors.foregroundMuted,
  },
});

export default LandingScreen;
