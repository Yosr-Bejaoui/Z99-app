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
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrawer } from '../context';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { creditsService, planService, getErrorMessage } from '../services';
import type { CreditAccount, Transaction, CreditPackage } from '../services/types';
import { Skeleton } from '../components/ui/Skeleton';
import { ScreenHeader } from '../components/ui/ScreenHeader';

interface UsageStat {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}

const CreditsScreen: React.FC = () => {
  const { t } = useTranslation();
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

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [balance, txResponse, pkgs, usage, subscription] = await Promise.all([
        creditsService.getCreditBalance().catch(() => ({ credits: 0, total_credits: 0, bonus_credits: 0, usedWords: 0, isPro: false })),
        creditsService.getTransactions(1, 10).catch(() => ({ count: 0, next: null, previous: null, results: [] })),
        creditsService.getCreditPackages().catch(() => []),
        creditsService.getUsageStats().catch(() => ({ today_used: 0, week_used: 0, month_used: 0, total_used: 0 })),
        planService.getCurrentSubscription().catch(() => null),
      ]);

      setCreditAccount(balance);
      setTransactions(txResponse?.results || []);
      setPackages(pkgs || []);
      setCurrentPlan(subscription);

      setUsageStats([
        { icon: 'chatbubble', label: t('credits.usage.today'), value: usage.today_used.toString(), color: '#10b981' },
        { icon: 'calendar', label: t('credits.usage.thisWeek'), value: usage.week_used.toString(), color: '#10a37f' },
        { icon: 'document-text', label: t('credits.usage.thisMonth'), value: formatNumber(usage.month_used), color: '#9ca3af' },
        { icon: 'time', label: t('credits.usage.total'), value: formatNumber(usage.total_used), color: colors.foreground },
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
      Alert.alert(t('common.error'), t('credits.promo.emptyError'));
      return;
    }

    try {
      setIsRedeemingCode(true);
      const result = await creditsService.redeemPromoCode(promoCode.trim());
      Alert.alert('Success', result.message);
      setPromoCode('');
      fetchData(); // Refresh balance
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
    } finally {
      setIsRedeemingCode(false);
    }
  };

  const handlePurchase = (pkg: CreditPackage) => {
    Alert.alert(
      t('credits.purchase.title'),
      t('credits.purchase.message', { credits: pkg.credits, price: `${pkg.currency === 'USD' ? '$' : ''}${pkg.price}` }),
      [
        { text: t('credits.purchase.cancel'), style: 'cancel' },
        {
          text: t('credits.purchase.confirm'),
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
          <View style={{ padding: spacing.lg, gap: 16 }}>
            <Skeleton width="100%" height={160} borderRadius={16} />
            <Skeleton width="100%" height={240} borderRadius={16} />
          </View>
        </View>
      );
    }

  const currentCredits = creditAccount?.credits || creditAccount?.total_credits || 0;
  const planName = currentPlan?.plan?.name || t('credits.freeTier');
  const planCredits = (currentPlan as any)?.total_credits || 1000;

  const progress = planCredits > 0 ? Math.min(currentCredits / planCredits, 1) : 0;

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
            <Text style={styles.modalTitle}>{t('credits.transactions.title')}</Text>
            <TouchableOpacity onPress={() => setShowTransactions(false)}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          
                  </View>
            <ScrollView style={styles.transactionsList}>
            {transactions.length === 0 ? (
              <Text style={styles.noTransactions}>{t('credits.transactions.empty')}</Text>
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
        <Text style={styles.topHeaderTitle}>{t('credits.title')}</Text>
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
            <Text style={styles.balanceLabel}>{t('credits.balance.label')}</Text>
          </View>
          <Text style={styles.balanceValue}>{currentCredits.toLocaleString()}</Text>
          {creditAccount?.bonus_credits != null && creditAccount.bonus_credits > 0 ? (
            <Text style={styles.bonusCredits}>
              {t('credits.balance.bonus', { count: creditAccount.bonus_credits })}
            </Text>
          ) : null}
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
              {t('credits.balance.progress', { used: currentCredits.toLocaleString(), total: planCredits.toLocaleString() })}
            </Text>
          </View>
          <View style={styles.balanceFooter}>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{planName}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowTransactions(true)}>
              <Text style={styles.viewHistoryText}>{t('credits.balance.viewHistory')}</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Promo Code Section */}
        <GlassCard style={styles.promoCard}>
          <Text style={styles.promoTitle}>{t('credits.promo.title')}</Text>
          <View style={styles.promoRow}>
            <TextInput
              style={styles.promoInput}
              placeholder={t('credits.promo.placeholder')}
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
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.promoButtonText}>{t('credits.promo.redeem')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Usage Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('credits.usage.title')}</Text>
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
            <Text style={styles.sectionTitle}>{t('credits.packages.title')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.packagesScroll}>
              {packages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={[styles.packageCard, pkg.best_value && styles.packageCardBestValue]}
                  onPress={() => handlePurchase(pkg)}
                >
                  {pkg.best_value && (
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueText}>{t('credits.packages.bestValue')}</Text>
                    </View>
                  )}
                  <Text style={styles.packageCredits}>{pkg.credits.toLocaleString()}</Text>
                  <Text style={styles.packageCreditsLabel}>{t('credits.packages.credits')}</Text>
                  {pkg.bonus_credits != null && pkg.bonus_credits > 0 ? (
                    <Text style={styles.packageBonus}>{t('credits.packages.bonus', { count: pkg.bonus_credits })}</Text>
                  ) : null}
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
          <Text style={styles.viewAllPlansText}>{t('credits.viewPlans')}</Text>
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
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
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
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.error,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 14,
  },
  balanceCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  balanceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
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
    marginBottom: spacing.xs,
  },
  bonusCredits: {
    fontSize: 14,
    color: colors.success,
    marginBottom: spacing.lg,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  promoTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  promoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  promoInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promoButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoButtonDisabled: {
    opacity: 0.7,
  },
  promoButtonText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
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
    padding: spacing.lg,
    marginHorizontal: spacing.xs,
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
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: spacing.sm,
  },
  bestValueText: {
    color: colors.foreground,
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
    marginBottom: spacing.xs,
  },
  packageBonus: {
    fontSize: 12,
    color: colors.success,
    marginBottom: spacing.sm,
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
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
    gap: spacing.sm,
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  transactionsList: {
    paddingHorizontal: spacing.lg,
  },
  noTransactions: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: spacing.xxl,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
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
