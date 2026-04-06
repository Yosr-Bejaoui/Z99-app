import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import api from '../services/api';

interface RewardInfo {
  credits_per_ad: number;
  daily_limit: number;
  ads_watched_today: number;
  total_credits_earned: number;
  next_reset: string;
}

interface AdReward {
  id: number;
  credits_earned: number;
  watched_at: string;
  ad_type: string;
}

const AdRewardsScreen: React.FC = () => {
  const [rewardInfo, setRewardInfo] = useState<RewardInfo | null>(null);
  const [recentRewards, setRecentRewards] = useState<AdReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  useEffect(() => {
    loadRewardData();
  }, []);

  const loadRewardData = async () => {
    try {
      const [infoResponse, historyResponse] = await Promise.all([
        api.get('/ads/rewards/info/').catch(() => ({ data: null })),
        api.get('/ads/rewards/history/').catch(() => ({ data: [] })),
      ]);

      if (infoResponse.data) {
        setRewardInfo(infoResponse.data);
      } else {
        // Default values if endpoint not available
        setRewardInfo({
          credits_per_ad: 10,
          daily_limit: 5,
          ads_watched_today: 0,
          total_credits_earned: 0,
          next_reset: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      const history = historyResponse.data.results || historyResponse.data || [];
      setRecentRewards(history);
    } catch (error) {
      console.error('Failed to load reward data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRewardData();
  };

  const watchAd = useCallback(async () => {
    if (!rewardInfo || rewardInfo.ads_watched_today >= rewardInfo.daily_limit) {
      Alert.alert(
        'Daily Limit Reached',
        'You have reached your daily ad limit. Come back tomorrow for more rewards!'
      );
      return;
    }

    setIsWatchingAd(true);

    try {
      // Simulate ad watching - in production, integrate with ad SDK
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const response = await api.post('/ads/rewards/claim/');
        
        if (response.data.success) {
          Alert.alert(
            '🎉 Reward Earned!',
            `You earned ${response.data.credits_earned || rewardInfo.credits_per_ad} credits!`
          );
          loadRewardData();
        }
      } catch {
        // Backend endpoint not available — update local state as placeholder
        Alert.alert(
          'Ad Rewards',
          'Ad rewards are not yet available. This feature is coming soon!'
        );
      }
    } catch (error: any) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsWatchingAd(false);
    }
  }, [rewardInfo]);

  const formatTimeUntilReset = () => {
    if (!rewardInfo?.next_reset) return '';
    
    const now = new Date();
    const reset = new Date(rewardInfo.next_reset);
    const diff = reset.getTime() - now.getTime();
    
    if (diff <= 0) return 'Resetting soon...';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const adsRemaining = rewardInfo
    ? rewardInfo.daily_limit - rewardInfo.ads_watched_today
    : 0;
  
  const progressPercent = rewardInfo
    ? (rewardInfo.ads_watched_today / rewardInfo.daily_limit) * 100
    : 0;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ad Rewards</Text>
          <Text style={styles.headerSubtitle}>Watch ads to earn free credits</Text>
        </View>

        {/* Main Reward Card */}
        <GlassCard style={styles.mainCard}>
          <View style={styles.rewardIconContainer}>
            <Ionicons name="gift" size={48} color={colors.primary} />
          </View>
          
          <Text style={styles.creditsPerAd}>
            +{rewardInfo?.credits_per_ad || 10} Credits
          </Text>
          <Text style={styles.perAdText}>per ad watched</Text>

          <TouchableOpacity
            style={[
              styles.watchButton,
              (adsRemaining === 0 || isWatchingAd) && styles.watchButtonDisabled,
            ]}
            onPress={watchAd}
            disabled={adsRemaining === 0 || isWatchingAd}
          >
            {isWatchingAd ? (
              <>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.watchButtonText}>Watching...</Text>
              </>
            ) : (
              <>
                <Ionicons name="play-circle" size={24} color={colors.white} />
                <Text style={styles.watchButtonText}>
                  {adsRemaining > 0 ? 'Watch Ad' : 'Limit Reached'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </GlassCard>

        {/* Daily Progress */}
        <GlassCard style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Daily Progress</Text>
            <Text style={styles.progressCount}>
              {rewardInfo?.ads_watched_today || 0} / {rewardInfo?.daily_limit || 5}
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
              />
            </View>
          </View>

          <View style={styles.progressFooter}>
            <View style={styles.progressInfo}>
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <Text style={styles.progressInfoText}>
                Resets in {formatTimeUntilReset()}
              </Text>
            </View>
            <Text style={styles.adsRemainingText}>
              {adsRemaining} ads remaining
            </Text>
          </View>
        </GlassCard>

        {/* Stats */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Ionicons name="wallet-outline" size={28} color={colors.success} />
            <Text style={styles.statValue}>
              {rewardInfo?.total_credits_earned || 0}
            </Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Ionicons name="today-outline" size={28} color={colors.warning} />
            <Text style={styles.statValue}>
              {(rewardInfo?.ads_watched_today || 0) * (rewardInfo?.credits_per_ad || 10)}
            </Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </GlassCard>
        </View>

        {/* Recent Rewards */}
        {recentRewards.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Rewards</Text>
            <GlassCard style={styles.recentList}>
              {recentRewards.slice(0, 5).map((reward, index) => (
                <View
                  key={reward.id || index}
                  style={[
                    styles.recentItem,
                    index < recentRewards.slice(0, 5).length - 1 && styles.recentItemBorder,
                  ]}
                >
                  <View style={styles.recentItemLeft}>
                    <View style={styles.recentIcon}>
                      <Ionicons name="film-outline" size={18} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.recentType}>
                        {reward.ad_type || 'Video Ad'}
                      </Text>
                      <Text style={styles.recentDate}>
                        {formatDate(reward.watched_at)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.recentCredits}>
                    +{reward.credits_earned}
                  </Text>
                </View>
              ))}
            </GlassCard>
          </View>
        )}

        {/* How it Works */}
        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>How it Works</Text>
          <GlassCard style={styles.stepsCard}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Watch an Ad</Text>
                <Text style={styles.stepDesc}>
                  Tap the button to watch a short video ad
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Earn Credits</Text>
                <Text style={styles.stepDesc}>
                  Get {rewardInfo?.credits_per_ad || 10} credits for each completed ad
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Use Credits</Text>
                <Text style={styles.stepDesc}>
                  Spend credits on AI features and generations
                </Text>
              </View>
            </View>
          </GlassCard>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
  mainCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.lg,
  },
  rewardIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  creditsPerAd: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  perAdText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: 14,
    borderRadius: 25,
    minWidth: 180,
  },
  watchButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  watchButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  progressCard: {
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  progressBarContainer: {
    marginBottom: spacing.md,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressInfoText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  adsRemainingText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  recentSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  recentList: {
    padding: 0,
    overflow: 'hidden',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  recentItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentType: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: 2,
  },
  recentDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  recentCredits: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
  },
  howItWorks: {
    marginBottom: spacing.xl,
  },
  stepsCard: {
    padding: 0,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  stepDesc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
});

export default AdRewardsScreen;
