import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { planService, Plan } from '../services/planService';

const { width } = Dimensions.get('window');

const SubscriptionPlansScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const fetchedPlans = await planService.getPlans();
      setPlans(fetchedPlans);
      if (fetchedPlans.length > 0 && !selectedPlan) {
        // Select the middle plan (usually the "popular" one)
        const middleIndex = Math.floor(fetchedPlans.length / 2);
        setSelectedPlan(fetchedPlans[middleIndex] || fetchedPlans[0]);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      Alert.alert(t('subscription.purchase.error'), t('subscription.purchase.errorMessage'));
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlans();
    setRefreshing(false);
  }, []);

  const handlePurchase = async () => {
    if (!selectedPlan) return;

    // In-app purchases require a native payment sheet (Google Play Billing / Apple IAP).
    // Sending a fabricated token to the checkout endpoint is a security risk — the server
    // could award credits without real payment if validation is not strict.
    // Show an informational message until the payment SDK is integrated.
    Alert.alert(
      t('subscription.comingSoon.title') || 'Coming Soon',
      t('subscription.comingSoon.message') ||
        'In-app purchases are not yet available in this version. Please contact support to purchase credits.',
    );
  };

  const formatCredits = (credits: number): string => {
    if (credits >= 1000000) {
      return `${(credits / 1000000).toFixed(1)}M`;
    } else if (credits >= 1000) {
      return `${(credits / 1000).toFixed(0)}K`;
    }
    return credits.toString();
  };

  const getPlanFeatures = (plan: Plan): string[] => {
    const baseFeatures = [t('subscription.features.allModels'), t('subscription.features.prioritySupport')];
    const credits = plan.words_or_credits;
    
    if (credits >= 500000) {
      return [...baseFeatures, t('subscription.features.unlimitedImage'), t('subscription.features.videoGen'), t('subscription.features.apiAccess'), t('subscription.features.customModels')];
    } else if (credits >= 100000) {
      return [...baseFeatures, t('subscription.features.advancedImage'), t('subscription.features.limitedVideo'), t('subscription.features.priorityQueue')];
    } else {
      return [...baseFeatures, t('subscription.features.basicImage'), t('subscription.features.standardQueue')];
    }
  };

  const isPopular = (plan: Plan, index: number, total: number): boolean => {
    // Mark middle plan as popular
    return index === Math.floor(total / 2);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('subscription.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{t('subscription.header.title')}</Text>
            <Text style={styles.headerSubtitle}>
              {t('subscription.header.subtitle')}
            </Text>
          </View>
        </View>

        {/* Plans List */}
        <View style={styles.plansContainer}>
          {plans.map((plan, index) => {
            const popular = isPopular(plan, index, plans.length);
            const isSelected = selectedPlan?.id === plan.id;
            const features = getPlanFeatures(plan);

            return (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.8}
                onPress={() => setSelectedPlan(plan)}
              >
                <GlassCard
                  style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected,
                    popular && styles.planCardPopular,
                  ]}
                >
                  {popular && (
                    <LinearGradient
                      colors={[colors.primary, colors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.popularBadge}
                    >
                      <Ionicons name="star" size={12} color={colors.white} />
                      <Text style={styles.popularText}>{t('subscription.mostPopular').toUpperCase()}</Text>
                    </LinearGradient>
                  )}

                  <View style={styles.planHeader}>
                    <View>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planCredits}>
                        {t('subscription.credits', { count: Number(plan.words_or_credits || 0) })}
                      </Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.currency}>$</Text>
                      <Text style={styles.price}>{plan.amount}</Text>
                      <Text style={styles.period}>{t('subscription.perMonth')}</Text>
                    </View>
                  </View>

                  {plan.description && (
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  )}

                  <View style={styles.divider} />

                  <View style={styles.featuresContainer}>
                    {features.map((feature, idx) => (
                      <View key={idx} style={styles.featureRow}>
                        <LinearGradient
                          colors={[colors.primary, colors.secondary]}
                          style={styles.checkIcon}
                        >
                          <Ionicons name="checkmark" size={12} color={colors.white} />
                        </LinearGradient>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    </View>
                  )}
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Empty State */}
        {plans.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>{t('subscription.emptyState.title')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('subscription.emptyState.subtitle')}
            </Text>
          </View>
        )}

        {/* Bottom CTA */}
        {selectedPlan && (
          <View style={styles.ctaContainer}>
            <View style={styles.ctaSummary}>
              <Text style={styles.ctaLabel}>{t('subscription.cta.selectedPlan')}</Text>
              <Text style={styles.ctaValue}>
                {t('subscription.cta.planSummary', { name: selectedPlan.name, amount: selectedPlan.amount })}
              </Text>
            </View>

            <GradientButton
              title={t('subscription.cta.subscribeNow')}
              onPress={handlePurchase}
              style={styles.ctaButton}
            />

            <Text style={styles.ctaDisclaimer}>
              {t('subscription.cta.disclaimer')}
            </Text>
          </View>
        )}

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>{t('subscription.benefits.title')}</Text>
          <View style={styles.benefitsGrid}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="flash" size={24} color={colors.primary} />
              </View>
              <Text style={styles.benefitLabel}>{t('subscription.benefits.fasterResponse')}</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="infinite" size={24} color={colors.secondary} />
              </View>
              <Text style={styles.benefitLabel}>{t('subscription.benefits.moreCredits')}</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="star" size={24} color={colors.warning} />
              </View>
              <Text style={styles.benefitLabel}>{t('subscription.benefits.premiumModels')}</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="headset" size={24} color={colors.success} />
              </View>
              <Text style={styles.benefitLabel}>{t('subscription.benefits.prioritySupport')}</Text>
            </View>
          </View>
        </View>
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
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: 16,
    color: colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  plansContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  planCard: {
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'visible',
  },
  planCardSelected: {
    borderColor: colors.primary,
  },
  planCardPopular: {
    borderColor: colors.secondary,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.xs,
  },
  popularText: {
    color: colors.foreground,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
  },
  planCredits: {
    fontSize: 14,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  currency: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  price: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.foreground,
  },
  period: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  planDescription: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  featuresContainer: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: colors.foreground,
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  ctaContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  ctaSummary: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  ctaLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ctaValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: spacing.xs,
  },
  ctaButton: {
    marginBottom: spacing.md,
  },
  ctaDisclaimer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  benefitsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  benefitItem: {
    width: (width - 52) / 2,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'center',
  },
});

export default SubscriptionPlansScreen;
