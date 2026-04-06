import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrawer, useCredits } from '../context';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import api from '../services/api';
import { getErrorMessage } from '../services';

const DonateScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { credits, refreshCredits } = useCredits();
  
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDonate = async () => {
    if (!email.trim() || !amount.trim()) {
      Alert.alert('Error', 'Please enter a valid email and amount.');
      return;
    }

    const nAmount = parseInt(amount, 10);
    if (isNaN(nAmount) || nAmount <= 0) {
       Alert.alert('Error', 'Amount must be a positive number.');
       return;
    }

    if (!credits || (credits.credits ?? 0) < nAmount) {
       Alert.alert('Error', 'Insufficient credits to donate this amount.');
       return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/accounts/donations/', {
        recipient_email: email.trim(),
        amount: nAmount,
        message: message.trim(),
      });
      
      Alert.alert('Success', `Successfully donated ${nAmount} credits to ${email}!`);
      setEmail('');
      setAmount('');
      setMessage('');
      refreshCredits();
    } catch (err) {
      Alert.alert('Donation Failed', getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={openDrawer}>
          <Ionicons name="menu-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Donate Credits</Text>
          <View style={styles.headerButton}>
            <View style={styles.coinBadge}>
              <Text style={styles.coinIcon}>{"\uD83E\uDE99"}</Text>
              <Text style={styles.coinBadgeText}>{credits?.credits || 0}</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <GlassCard style={styles.card}>
                <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
                   <Ionicons name="gift-outline" size={48} color={colors.primary} />
                </View>
            <Text style={styles.title}>Send Credits to a Friend</Text>
            <Text style={styles.desc}>Enter their email address to instantly transfer AI credits.</Text>
            
            <View style={styles.balanceContainer}>
                <Text style={styles.balanceText}>Your Balance:</Text>
                <Text style={styles.balanceValue}>{credits?.credits ?? 0} Credits</Text>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Recipient Email</Text>
                <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="friend@example.com"
                        placeholderTextColor={colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Amount to Send</Text>
                <View style={styles.inputWrapper}>
                    <Ionicons name="diamond-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 100"
                        placeholderTextColor={colors.textMuted}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Message (Optional)</Text>
                <View style={styles.inputWrapper}>
                    <Ionicons name="chatbubble-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Say hello!"
                        placeholderTextColor={colors.textMuted}
                        value={message}
                        onChangeText={setMessage}
                    />
                </View>
            </View>

            <GradientButton
                title={isSubmitting ? "Sending..." : "Send Credits"}
                onPress={handleDonate}
                disabled={isSubmitting || !email.trim() || !amount.trim()}
                style={{ marginTop: spacing.xl }}
            />
         </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary },    coinBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
    coinBadgeText: { color: colors.warning, fontSize: 12, fontWeight: '700' },
  coinIcon: { fontSize: 12 },  scrollContent: { padding: spacing.lg },
  card: { padding: spacing.xl, alignItems: 'center' },
  iconContainer: {
      width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(16, 185, 129, 0.1)',
      alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg
  },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.xs },
  desc: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
  balanceContainer: {
      flexDirection: 'row', justifyContent: 'space-between', width: '100%',
      backgroundColor: colors.backgroundSecondary, padding: spacing.md,
      borderRadius: borderRadius.md, marginBottom: spacing.xl
  },
  balanceText: { color: colors.textSecondary, fontSize: 16 },
  balanceValue: { color: colors.primary, fontWeight: 'bold', fontSize: 16 },
  inputContainer: { width: '100%', marginBottom: spacing.lg },
  inputLabel: { color: colors.textSecondary, fontSize: 14, marginBottom: spacing.xs, fontWeight: '500' },
  inputWrapper: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: spacing.md
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, color: colors.textPrimary, paddingVertical: spacing.md, fontSize: 16 },
});
export default DonateScreen;
