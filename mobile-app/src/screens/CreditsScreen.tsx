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
  TextInput,
  Modal,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrawer } from '../context';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { creditsService, planService, getErrorMessage } from '../services';
import type { CreditAccount, Transaction, CreditPackage } from '../services/types';

interface UsageStat {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}

const CreditsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const [creditAccount, setCreditAccount] = useState<CreditAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [balance, txResponse, pkgs, usage, subscription] = await Promise.all([
        creditsService.getCreditBalance(),
        creditsService.getTransactions(1, 10),
        creditsService.getCreditPackages().catch(() => []),
        creditsService.getUsageStats().catch(() => ({ today_used: 0, week_used: 0, month_used: 0, total_used: 0 })),
        planService.getCurrentSubscription().catch(() => null),
      ]);

      setCreditAccount(balance);
      setTransactions(txResponse.results);
      setPackages(pkgs);
      setCurrentPlan(subscription);

      setUsageStats([
        { icon: 'chatbubble', label: 'Today', value: usage.today_used.toString(), color: '#10b981' },
        { icon: 'calendar', label: 'This Week', value: usage.week_used.toString(), color: '#8b5cf6' },
        { icon: 'document-text', label: 'This Month', value: formatNumber(usage.month_used), color: '#3b82f6' },
        { icon: 'time', label: 'Total', value: formatNumber(usage.total_used), color: '#f59e0b' },
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
      console.error('Failed to fetch credits data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleRedeemCode = async () => {
    if (!promoCode.trim()) {
      Alert.alert('Error', 'Please enter a promo code');
      return;
    }

    try {
      setIsRedeemingCode(true);
      const result = await creditsService.redeemPromoCode(promoCode.trim());
      Alert.alert('Success', result.message);
      setPromoCode('');
      fetchData(); // Refresh balance
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setIsRedeemingCode(false);
    }
  };

  const handlePurchase = (pkg: CreditPackage) => {
    Alert.alert(
      'Purchase Credits',
      `Would you like to purchase ${pkg.credits} credits for ${pkg.currency === 'USD' ? '$' : ''}${pkg.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: () => {
            // Navigate to payment flow or trigger in-app purchase
            navigation.navigate('SubscriptionPlans', { packageId: pkg.id });
          },
        },
      ]
    );
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTransactionIcon = (type: Transaction['type']): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'credit': return 'add-circle-outline';
      case 'debit': return 'remove-circle-outline';
      case 'refund': return 'refresh-outline';
      case 'reward': return 'gift-outline';
      case 'subscription': return 'card-outline';
      default: return 'swap-horizontal-outline';
    }
  };

  const getTransactionColor = (type: Transaction['type']): string => {
    switch (type) {
      case 'credit': case 'refund': case 'reward': return colors.success;
      case 'debit': return colors.error;
      default: return colors.primary;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your credits...</Text>
        </View>
      </View>
    );
  }

  const currentCredits = creditAccount?.credits || creditAccount?.total_credits || 0;
  const planName = currentPlan?.plan?.name || 'Free Tier';
  const planCredits = (currentPlan as any)?.total_credits || 1000;

  const progress = Math.min(currentCredits / planCredits, 1);

  const renderTransactionsModal = () => (
    <Modal
      visible={showTransactions}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTransactions(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Transaction History</Text>
            <TouchableOpacity onPress={() => setShowTransactions(false)}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.transactionsList}>
            {transactions.length === 0 ? (
              <Text style={styles.noTransactions}>No transactions yet</Text>
            ) : (
              transactions.map((tx) => (
                <View key={tx.id} style={styles.transactionItem}>
                  <View style={[styles.txIcon, { backgroundColor: `${getTransactionColor(tx.type)}20` }]}>
                    <Ionicons name={getTransactionIcon(tx.type)} size={20} color={getTransactionColor(tx.type)} />
                  </View>
                  <View style={styles.txContent}>
                    <Text style={styles.txDescription}>{tx.description}</Text>
                    <Text style={styles.txDate}>
                      {new Date(tx.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, { color: getTransactionColor(tx.type) }]}>
                    {tx.type === 'debit' ? '-' : '+'}{tx.amount}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity 
          style={styles.headerMenuButton} 
          onPress={openDrawer}
        >
          <Ionicons name="menu-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Credits</Text>
        <View style={styles.headerMenuButton} />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Error Banner */}
        {error && (
          <GlassCard style={styles.errorCard}>
            <Ionicons name="warning" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* Credits Balance Card */}
        <GlassCard style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIcon}>
              <Ionicons name="wallet" size={24} color={colors.primary} />
            </View>
            <Text style={styles.balanceLabel}>Available Credits</Text>
          </View>
          <Text style={styles.balanceValue}>{currentCredits.toLocaleString()}</Text>
          {creditAccount?.bonus_credits && creditAccount.bonus_credits > 0 && (
            <Text style={styles.bonusCredits}>
              + {creditAccount.bonus_credits.toLocaleString()} bonus credits
            </Text>
          )}
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
              {currentCredits.toLocaleString()} / {planCredits.toLocaleString()} credits
            </Text>
          </View>
          <View style={styles.balanceFooter}>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{planName}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowTransactions(true)}>
              <Text style={styles.viewHistoryText}>View History</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Promo Code Section */}
        <GlassCard style={styles.promoCard}>
          <Text style={styles.promoTitle}>Have a promo code?</Text>
          <View style={styles.promoRow}>
            <TextInput
              style={styles.promoInput}
              placeholder="Enter code"
              placeholderTextColor={colors.textMuted}
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.promoButton, isRedeemingCode && styles.promoButtonDisabled]}
              onPress={handleRedeemCode}
              disabled={isRedeemingCode}
            >
              {isRedeemingCode ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.promoButtonText}>Redeem</Text>
              )}
            </TouchableOpacity>
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

        {/* Credit Packages */}
        {packages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buy Credits</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.packagesScroll}>
              {packages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={[styles.packageCard, pkg.best_value && styles.packageCardBestValue]}
                  onPress={() => handlePurchase(pkg)}
                >
                  {pkg.best_value && (
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueText}>Best Value</Text>
                    </View>
                  )}
                  <Text style={styles.packageCredits}>{pkg.credits.toLocaleString()}</Text>
                  <Text style={styles.packageCreditsLabel}>credits</Text>
                  {pkg.bonus_credits && pkg.bonus_credits > 0 && (
                    <Text style={styles.packageBonus}>+{pkg.bonus_credits} bonus</Text>
                  )}
                  <Text style={styles.packagePrice}>
                    {pkg.currency === 'USD' ? '$' : ''}{pkg.price}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* View All Plans Button */}
        <TouchableOpacity
          style={styles.viewAllPlansButton}
          onPress={() => navigation.navigate('SubscriptionPlans')}
        >
          <Text style={styles.viewAllPlansText}>View Subscription Plans</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
      </ScrollView>
      
      {renderTransactionsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerMenuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
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
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.error,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 14,
  },
  balanceCard: {
    padding: 20,
    marginBottom: 16,
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
    marginBottom: 4,
  },
  bonusCredits: {
    fontSize: 14,
    color: colors.success,
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
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  viewHistoryText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  promoCard: {
    padding: 16,
    marginBottom: 24,
  },
  promoTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 12,
  },
  promoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promoInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promoButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoButtonDisabled: {
    opacity: 0.7,
  },
  promoButtonText: {
    color: '#fff',
    fontSize: 14,
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
  packagesScroll: {
    marginHorizontal: -4,
  },
  packageCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: 120,
  },
  packageCardBestValue: {
    borderColor: colors.primary,
  },
  bestValueBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 8,
  },
  bestValueText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  packageCredits: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  packageCreditsLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  packageBonus: {
    fontSize: 12,
    color: colors.success,
    marginBottom: 8,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  transactionsList: {
    paddingHorizontal: 20,
  },
  noTransactions: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: 32,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txContent: {
    flex: 1,
  },
  txDescription: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  txDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreditsScreen;
