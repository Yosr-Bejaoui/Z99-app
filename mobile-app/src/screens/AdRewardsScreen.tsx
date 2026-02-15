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
import { colors } from '../theme/colors';
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

      const response = await api.post('/ads/rewards/claim/');
      
      if (response.data.success) {
        Alert.alert(
          '🎉 Reward Earned!',
          `You earned ${response.data.credits_earned || rewardInfo.credits_per_ad} credits!`
        );
        loadRewardData();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to claim reward';
      Alert.alert('Error', message);
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
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.watchButtonText}>Watching...</Text>
              </>
            ) : (
              <>
                <Ionicons name="play-circle" size={24} color="#fff" />
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
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  mainCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  rewardIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  creditsPerAd: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  perAdText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 24,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    minWidth: 180,
  },
  watchButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  watchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressCard: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    marginBottom: 12,
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
    gap: 4,
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
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  recentList: {
    padding: 0,
    overflow: 'hidden',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  recentItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    marginBottom: 24,
  },
  stepsCard: {
    padding: 0,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
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
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
});

export default AdRewardsScreen;
