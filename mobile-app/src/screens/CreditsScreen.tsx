import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';

interface UsageStat {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}

const usageStats: UsageStat[] = [
  { icon: 'chatbubble', label: 'Chats', value: '156', color: '#10b981' },
  { icon: 'image', label: 'Images', value: '42', color: '#8b5cf6' },
  { icon: 'document-text', label: 'Words', value: '45.2K', color: '#3b82f6' },
  { icon: 'time', label: 'Hours', value: '12.5', color: '#f59e0b' },
];

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  credits: string;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    credits: '1,000 credits',
    features: ['Basic models access', '5 images per day', 'Standard support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    period: '/month',
    credits: '10,000 credits',
    features: ['All models access', 'Unlimited images', 'Priority support', 'HD exports'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$49',
    period: '/month',
    credits: 'Unlimited',
    features: ['Custom models', 'API access', 'Dedicated support', 'Team collaboration'],
  },
];

const CreditsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const currentCredits = 742;
  const totalCredits = 1000;
  const progress = currentCredits / totalCredits;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Credits</Text>
            <Text style={styles.headerSubtitle}>Manage your credits and subscription</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.foreground} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Credits Balance Card */}
        <GlassCard style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIcon}>
              <Ionicons name="wallet" size={24} color={colors.primary} />
            </View>
            <Text style={styles.balanceLabel}>Available Credits</Text>
          </View>
          <Text style={styles.balanceValue}>{currentCredits.toLocaleString()}</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              {currentCredits} / {totalCredits.toLocaleString()} credits
            </Text>
          </View>
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>Free Tier</Text>
          </View>
        </GlassCard>

        {/* Usage Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage Statistics</Text>
          <View style={styles.statsGrid}>
            {usageStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                  <Ionicons name={stat.icon} size={20} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upgrade Your Plan</Text>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, plan.popular && styles.planCardPopular]}
            >
              {plan.popular && (
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.popularBadge}
                >
                  <Ionicons name="star" size={12} color="#fff" />
                  <Text style={styles.popularBadgeText}>Popular</Text>
                </LinearGradient>
              )}
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planCredits}>{plan.credits}</Text>
                </View>
                <View style={styles.planPriceContainer}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
              </View>
              <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              {plan.id !== 'free' && (
                <GradientButton
                  title={plan.popular ? 'Get Started' : 'Choose Plan'}
                  onPress={() => navigation.navigate('SubscriptionPlans')}
                  style={styles.planButton}
                />
              )}
            </TouchableOpacity>
          ))}

          {/* View All Plans Button */}
          <TouchableOpacity
            style={styles.viewAllPlansButton}
            onPress={() => navigation.navigate('SubscriptionPlans')}
          >
            <Text style={styles.viewAllPlansText}>View All Plans</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  balanceCard: {
    padding: 20,
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  balanceLabel: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 44,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  planBadgeText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  planCardPopular: {
    borderColor: colors.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  planCredits: {
    fontSize: 14,
    color: colors.textMuted,
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  planPeriod: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 2,
  },
  planFeatures: {
    gap: 10,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  planButton: {
    marginTop: 4,
  },
  viewAllPlansButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
    gap: 8,
  },
  viewAllPlansText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default CreditsScreen;
