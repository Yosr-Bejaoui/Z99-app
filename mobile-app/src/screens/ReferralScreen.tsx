import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import api from '../services/api';
import { useDrawer } from '../context/DrawerContext';

interface ReferralData {
  code: string;
  total_referrals: number;
  total_credits_earned: number;
  reward_credits: number;
  referee_credits: number;
}

const ReferralScreen: React.FC = () => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [codeToApply, setCodeToApply] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const { navigateTo, openDrawer } = useDrawer();

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await api.get('/accounts/referral/');
      setReferralData(response.data);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyCode = async () => {
    if (!codeToApply.trim()) return;
    setIsApplying(true);
    try {
      const response = await api.post('/accounts/referral/apply/', {
        code: codeToApply.trim(),
      });
      if (response.data.success) {
        Alert.alert('Success', `You earned ${response.data.earned} credits!`);
        setCodeToApply('');
        fetchReferralData();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to apply code.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsApplying(false);
    }
  };

  const copyToClipboard = async () => {
    if (referralData) {
      await Clipboard.setStringAsync(referralData.code);
      Alert.alert('Copied', 'Referral code copied to clipboard');
    }
  };

  const shareCode = async () => {
    if (referralData) {
      try {
        await Share.share({
          message: `Join me on Z99! Use my referral code ${referralData.code} to get ${referralData.referee_credits} free credits when you sign up!`,
        });
      } catch (error: any) {
        Alert.alert('Error', error.message);
      }
    }
  };

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
      <View style={styles.topHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => openDrawer()}
        >
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Invite a Friend</Text>
          <Text style={styles.headerSubtitle}>
            Share your code to earn free credits
          </Text>
        </View>

        {/* Share Code Card */}
        <GlassCard style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="people" size={48} color={colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Your Referral Code</Text>
          <Text style={styles.cardDesc}>
            Give your friends {referralData?.referee_credits} credits and earn {referralData?.reward_credits} credits when they join.
          </Text>
          
          <TouchableOpacity style={styles.codeContainer} onPress={copyToClipboard}>
            <Text style={styles.codeText}>{referralData?.code || '------'}</Text>
            <Ionicons name="copy-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.primaryButton} onPress={shareCode}>
            <Ionicons name="share-outline" size={20} color={colors.white} />
            <Text style={styles.primaryButtonText}>Share Code</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Stats */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Ionicons name="people-outline" size={28} color={colors.warning} />
            <Text style={styles.statValue}>
              {referralData?.total_referrals || 0}
            </Text>
            <Text style={styles.statLabel}>Friends Invited</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Ionicons name="wallet-outline" size={28} color={colors.success} />
            <Text style={styles.statValue}>
              {(referralData?.total_credits_earned || 0).toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Credits Earned</Text>
          </GlassCard>
        </View>

        {/* Apply Code Section */}
        <GlassCard style={styles.card}>
          <View style={styles.iconContainerSmall}>
            <Ionicons name="gift-outline" size={32} color={colors.warning} />
          </View>
          <Text style={styles.cardTitle}>Have a referral code?</Text>
          <Text style={styles.cardDesc}>
            Enter your friend's code below to receive free bonus credits.
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter referral code"
              placeholderTextColor={colors.textMuted}
              value={codeToApply}
              onChangeText={setCodeToApply}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[
                styles.applyButton,
                (!codeToApply.trim() || isApplying) && styles.applyButtonDisabled
              ]}
              onPress={applyCode}
              disabled={!codeToApply.trim() || isApplying}
            >
              {isApplying ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.applyButtonText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? spacing.xl : spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  card: {
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainerSmall: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  cardDesc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    width: '100%',
    gap: spacing.md,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: colors.textPrimary,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    width: '100%',
    gap: spacing.sm,
  },
  primaryButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  applyButton: {
    height: 50,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  applyButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReferralScreen;

