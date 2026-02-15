import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton, GradientText, GlassCard } from '../components';
import {
  colors,
  gradients,
  spacing,
  borderRadius,
  typography,
} from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LandingScreenProps {
  navigation: any;
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

interface HowItWorksItem {
  step: number;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface TestimonialItem {
  name: string;
  role: string;
  text: string;
  rating: number;
}

interface PricingItem {
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}

const features: FeatureItem[] = [
  {
    icon: 'chatbubbles-outline',
    label: 'Multi-Model Chat',
    desc: 'Switch between AI models seamlessly',
  },
  {
    icon: 'image-outline',
    label: 'Image Generation',
    desc: 'Create with DALL·E & Stable Diffusion',
  },
  {
    icon: 'flash-outline',
    label: 'Credit System',
    desc: '1,000 free words to get started',
  },
];

const aiModels: AIModelItem[] = [
  { name: 'ChatGPT', icon: 'logo-react', color: '#10a37f', type: 'Chat' },
  { name: 'Gemini', icon: 'sparkles', color: '#4285f4', type: 'Chat' },
  { name: 'Claude', icon: 'cube', color: '#cc785c', type: 'Chat' },
  { name: 'DeepSeek', icon: 'analytics', color: '#0ea5e9', type: 'Chat' },
  { name: 'DALL·E', icon: 'image', color: '#ff6b6b', type: 'Image' },
  { name: 'Stable Diffusion', icon: 'color-palette', color: '#9333ea', type: 'Image' },
];

const howItWorks: HowItWorksItem[] = [
  {
    step: 1,
    title: 'Create Account',
    desc: 'Sign up in seconds with email or Google',
    icon: 'person-add-outline',
  },
  {
    step: 2,
    title: 'Choose AI Model',
    desc: 'Select from ChatGPT, Gemini, Claude & more',
    icon: 'git-branch-outline',
  },
  {
    step: 3,
    title: 'Start Creating',
    desc: 'Chat, generate images, or create videos',
    icon: 'rocket-outline',
  },
];

const testimonials: TestimonialItem[] = [
  {
    name: 'Sarah M.',
    role: 'Content Creator',
    text: 'This app changed how I create content. Having all AI models in one place is a game changer!',
    rating: 5,
  },
  {
    name: 'James K.',
    role: 'Developer',
    text: 'The image generation quality is incredible. Worth every credit!',
    rating: 5,
  },
  {
    name: 'Emily R.',
    role: 'Designer',
    text: 'I use it daily for brainstorming and creating visuals. Love the UI!',
    rating: 5,
  },
];

const pricingPlans: PricingItem[] = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['1,000 words/month', 'Basic chat models', '5 image generations', 'Email support'],
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    features: ['Unlimited words', 'All AI models', 'Unlimited images', 'Priority support', 'Video generation'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$49.99',
    period: '/month',
    features: ['Everything in Pro', 'API access', 'Custom integrations', 'Dedicated support', 'Team collaboration'],
  },
];

const LandingScreen: React.FC<LandingScreenProps> = ({ navigation }) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const featureAnims = useRef(
    features.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Stagger animations on mount
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
      Animated.timing(badgeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
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

      {/* Background gradient */}
      <LinearGradient
        colors={['#1a1e24', '#0f1115', '#0a0c0f']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative gradient orb */}
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
        {/* Badge */}
        <Animated.View
          style={[
            styles.badge,
            {
              opacity: badgeAnim,
              transform: [
                {
                  translateY: badgeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={styles.badgeText}>Multi-model AI platform</Text>
        </Animated.View>

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
          <Text style={styles.heroTitle}>One platform,</Text>
          <GradientText style={styles.heroTitleAccent}>every AI</GradientText>
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
          Chat with ChatGPT, Gemini, Claude & Mistral. Generate images with
          DALL·E & Stable Diffusion. All in one place.
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
            title="Get Started Free"
            onPress={() => navigation.navigate('Login')}
            icon={<Ionicons name="arrow-forward" size={18} color={colors.background} />}
          />

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
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
          <Text style={styles.sectionTitle}>Powered by Leading AI</Text>
          <Text style={styles.sectionSubtitle}>
            Access the world's most advanced AI models
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

        {/* How It Works Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <Text style={styles.sectionSubtitle}>
            Get started in three simple steps
          </Text>
          <View style={styles.stepsContainer}>
            {howItWorks.map((item, index) => (
              <View key={item.step} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <LinearGradient
                    colors={gradients.primary}
                    style={styles.stepNumberGradient}
                  >
                    <Text style={styles.stepNumberText}>{item.step}</Text>
                  </LinearGradient>
                </View>
                {index < howItWorks.length - 1 && <View style={styles.stepLine} />}
                <View style={styles.stepContent}>
                  <Ionicons name={item.icon} size={24} color={colors.primary} />
                  <Text style={styles.stepTitle}>{item.title}</Text>
                  <Text style={styles.stepDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* About Us Section */}
        <View style={styles.section}>
          <GlassCard style={styles.aboutCard}>
            <Ionicons name="information-circle-outline" size={32} color={colors.primary} />
            <Text style={styles.aboutTitle}>About Us</Text>
            <Text style={styles.aboutText}>
              We're on a mission to democratize AI technology. Our platform brings together 
              the world's most powerful AI models into one seamless experience, making 
              advanced AI accessible to everyone.
            </Text>
            <Text style={styles.aboutText}>
              Founded in 2024, we've helped millions of users create, innovate, and 
              transform their ideas into reality using cutting-edge AI technology.
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>1M+</Text>
                <Text style={styles.statLabel}>Users</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>50M+</Text>
                <Text style={styles.statLabel}>Generations</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>99.9%</Text>
                <Text style={styles.statLabel}>Uptime</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Testimonials Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Users Say</Text>
          <Text style={styles.sectionSubtitle}>
            Join thousands of satisfied creators
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.testimonialsScroll}
          >
            {testimonials.map((item, index) => (
              <GlassCard key={index} style={styles.testimonialCard}>
                <View style={styles.testimonialStars}>
                  {[...Array(item.rating)].map((_, i) => (
                    <Ionicons key={i} name="star" size={16} color="#fbbf24" />
                  ))}
                </View>
                <Text style={styles.testimonialText}>"{item.text}"</Text>
                <View style={styles.testimonialAuthor}>
                  <View style={styles.testimonialAvatar}>
                    <Ionicons name="person" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.testimonialName}>{item.name}</Text>
                    <Text style={styles.testimonialRole}>{item.role}</Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </ScrollView>
        </View>

        {/* Pricing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Simple Pricing</Text>
          <Text style={styles.sectionSubtitle}>
            Choose the plan that's right for you
          </Text>
          <View style={styles.pricingContainer}>
            {pricingPlans.map((plan) => (
              <GlassCard 
                key={plan.name} 
                style={[
                  styles.pricingCard,
                  plan.popular && styles.pricingCardPopular
                ]}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                  </View>
                )}
                <Text style={styles.pricingName}>{plan.name}</Text>
                <View style={styles.pricingPriceRow}>
                  <Text style={styles.pricingPrice}>{plan.price}</Text>
                  <Text style={styles.pricingPeriod}>{plan.period}</Text>
                </View>
                <View style={styles.pricingFeatures}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.pricingFeatureRow}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                      <Text style={styles.pricingFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity 
                  style={[
                    styles.pricingButton,
                    plan.popular && styles.pricingButtonPopular
                  ]}
                  onPress={() => navigation.navigate('SignUp')}
                >
                  <Text style={[
                    styles.pricingButtonText,
                    plan.popular && styles.pricingButtonTextPopular
                  ]}>
                    {plan.price === '$0' ? 'Get Started' : 'Subscribe'}
                  </Text>
                </TouchableOpacity>
              </GlassCard>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <LinearGradient
            colors={['rgba(45, 212, 191, 0.1)', 'rgba(14, 165, 233, 0.1)']}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
            <Text style={styles.ctaSubtitle}>
              Join millions of users creating with AI today
            </Text>
            <GradientButton
              title="Start Free Trial"
              onPress={() => navigation.navigate('SignUp')}
              icon={<Ionicons name="arrow-forward" size={18} color={colors.background} />}
            />
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerTop}>
            <View style={styles.footerBrand}>
              <Ionicons name="sparkles" size={28} color={colors.primary} />
              <Text style={styles.footerBrandName}>AI Platform</Text>
            </View>
            <Text style={styles.footerTagline}>
              The future of AI is here
            </Text>
          </View>

          <View style={styles.footerLinks}>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Product</Text>
              <TouchableOpacity><Text style={styles.footerLink}>Features</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Pricing</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>API</Text></TouchableOpacity>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Company</Text>
              <TouchableOpacity><Text style={styles.footerLink}>About</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Blog</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Careers</Text></TouchableOpacity>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Legal</Text>
              <TouchableOpacity><Text style={styles.footerLink}>Privacy</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Terms</Text></TouchableOpacity>
              <TouchableOpacity><Text style={styles.footerLink}>Security</Text></TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerSocial}>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-twitter" size={22} color={colors.foregroundMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-github" size={22} color={colors.foregroundMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-linkedin" size={22} color={colors.foregroundMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-discord" size={22} color={colors.foregroundMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.footerBottom}>
            <Text style={styles.footerCopyright}>
              © 2024 AI Platform. All rights reserved.
            </Text>
          </View>
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  badgeText: {
    color: colors.foregroundSecondary,
    fontSize: typography.fontSizes.sm,
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

  // Section styles
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

  // AI Models Grid
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

  // How It Works
  stepsContainer: {
    width: '100%',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  stepNumber: {
    marginRight: spacing.md,
    zIndex: 1,
  },
  stepNumberGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.background,
  },
  stepLine: {
    position: 'absolute',
    left: 17,
    top: 36,
    width: 2,
    height: 60,
    backgroundColor: colors.border,
  },
  stepContent: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  stepTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.foreground,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  stepDesc: {
    fontSize: typography.fontSizes.sm,
    color: colors.foregroundMuted,
    lineHeight: 20,
  },

  // About Section
  aboutCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  aboutTitle: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.foreground,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  aboutText: {
    fontSize: typography.fontSizes.md,
    color: colors.foregroundSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  statNumber: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.foregroundMuted,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },

  // Testimonials
  testimonialsScroll: {
    paddingHorizontal: spacing.sm,
  },
  testimonialCard: {
    width: SCREEN_WIDTH * 0.75,
    marginRight: spacing.md,
    padding: spacing.lg,
  },
  testimonialStars: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  testimonialText: {
    fontSize: typography.fontSizes.md,
    color: colors.foregroundSecondary,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  testimonialName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.foreground,
  },
  testimonialRole: {
    fontSize: typography.fontSizes.xs,
    color: colors.foregroundMuted,
  },

  // Pricing
  pricingContainer: {
    width: '100%',
    gap: spacing.md,
  },
  pricingCard: {
    padding: spacing.lg,
    position: 'relative',
  },
  pricingCardPopular: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  popularBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.background,
  },
  pricingName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  pricingPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  pricingPrice: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.foreground,
  },
  pricingPeriod: {
    fontSize: typography.fontSizes.md,
    color: colors.foregroundMuted,
    marginLeft: spacing.xs,
  },
  pricingFeatures: {
    marginBottom: spacing.lg,
  },
  pricingFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  pricingFeatureText: {
    fontSize: typography.fontSizes.sm,
    color: colors.foregroundSecondary,
  },
  pricingButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pricingButtonPopular: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pricingButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.foreground,
  },
  pricingButtonTextPopular: {
    color: colors.background,
  },

  // CTA Section
  ctaSection: {
    width: '100%',
    marginTop: spacing.xxl * 1.5,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  ctaGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  ctaTitle: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  ctaSubtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.foregroundSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // Footer
  footer: {
    width: '100%',
    marginTop: spacing.xxl * 2,
    paddingTop: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerTop: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  footerBrandName: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.foreground,
  },
  footerTagline: {
    fontSize: typography.fontSizes.sm,
    color: colors.foregroundMuted,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
  footerColumn: {
    alignItems: 'center',
  },
  footerColumnTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  footerLink: {
    fontSize: typography.fontSizes.sm,
    color: colors.foregroundMuted,
    marginBottom: spacing.sm,
  },
  footerSocial: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerBottom: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerCopyright: {
    fontSize: typography.fontSizes.sm,
    color: colors.foregroundMuted,
  },
});

export default LandingScreen;
