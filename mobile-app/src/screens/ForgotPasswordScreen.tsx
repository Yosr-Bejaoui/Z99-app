import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import api from '../services/api';
import { ENDPOINTS } from '../services/config';

type Step = 'email' | 'otp' | 'password' | 'success';

const ForgotPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const otpRefs = useRef<(TextInput | null)[]>([]);

  const isValidEmail = (emailStr: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setError(t('forgotPassword.email.emptyError'));
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError(t('forgotPassword.email.invalidError'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post(ENDPOINTS.FORGOT_PASSWORD, { email: email.trim() });
      setStep('otp');
      Alert.alert(t('common.success'), t('forgotPassword.email.success'));
    } catch (err: any) {
      setError(err.response?.data?.error || t('forgotPassword.email.sendError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError(t('forgotPassword.otp.incompleteError'));
      return;
    }
    setError('');
    setStep('password');
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      setError(t('forgotPassword.password.emptyError'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('forgotPassword.password.lengthError'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('forgotPassword.password.mismatchError'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post(ENDPOINTS.RESET_PASSWORD, {
        email: email.trim(),
        code: otp.join(''),
        password: newPassword,
      });
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.error || t('forgotPassword.password.resetError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      await api.post(ENDPOINTS.FORGOT_PASSWORD, { email: email.trim() });
      Alert.alert(t('common.success'), t('forgotPassword.otp.resendSuccess'));
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      Alert.alert(t('common.error'), t('forgotPassword.otp.resendError'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailStep = () => (
    <>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.iconGradient}
        >
          <Ionicons name="mail" size={40} color={colors.white} />
        </LinearGradient>
      </View>

      <Text style={styles.title}>{t('forgotPassword.email.title')}</Text>
      <Text style={styles.subtitle}>
        {t('forgotPassword.email.subtitle')}
      </Text>

      <GlassCard style={styles.inputCard}>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder={t('forgotPassword.email.placeholder')}
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </GlassCard>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <GradientButton
        title={isLoading ? t('forgotPassword.email.sending') : t('forgotPassword.email.button')}
        onPress={handleSendOTP}
        disabled={isLoading}
        style={styles.button}
      />
    </>
  );

  const renderOtpStep = () => (
    <>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.iconGradient}
        >
          <Ionicons name="keypad" size={40} color={colors.white} />
        </LinearGradient>
      </View>

      <Text style={styles.title}>{t('forgotPassword.otp.title')}</Text>
      <Text style={styles.subtitle}>
        {t('forgotPassword.otp.subtitle', { email })}
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { otpRefs.current[index] = ref; }}
            style={[
              styles.otpInput,
              digit && styles.otpInputFilled,
            ]}
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <GradientButton
        title={t('forgotPassword.otp.button')}
        onPress={handleVerifyOTP}
        disabled={isLoading}
        style={styles.button}
      />

      <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
        <Text style={styles.resendText}>
          {t('forgotPassword.otp.resendText')}
          <Text style={styles.resendLink}>{t('forgotPassword.otp.resendLink')}</Text>
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderPasswordStep = () => (
    <>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.iconGradient}
        >
          <Ionicons name="lock-closed" size={40} color={colors.white} />
        </LinearGradient>
      </View>

      <Text style={styles.title}>{t('forgotPassword.password.title')}</Text>
      <Text style={styles.subtitle}>
        {t('forgotPassword.password.subtitle')}
      </Text>

      <GlassCard style={styles.inputCard}>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder={t('forgotPassword.password.newPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </GlassCard>

      <GlassCard style={[styles.inputCard, { marginTop: spacing.sm }]}>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder={t('forgotPassword.password.confirmPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
          />
        </View>
      </GlassCard>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <GradientButton
        title={isLoading ? t('forgotPassword.password.resetting') : t('forgotPassword.password.button')}
        onPress={handleResetPassword}
        disabled={isLoading}
        style={styles.button}
      />
    </>
  );

  const renderSuccessStep = () => (
    <>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={[colors.success, '#10b981']}
          style={styles.iconGradient}
        >
          <Ionicons name="checkmark-circle" size={50} color={colors.white} />
        </LinearGradient>
      </View>

      <Text style={styles.title}>{t('forgotPassword.successScreen.title')}</Text>
      <Text style={styles.subtitle}>
        {t('forgotPassword.successScreen.subtitle')}
      </Text>

      <GradientButton
        title={t('forgotPassword.successScreen.button')}
        onPress={() => navigation.navigate('Login' as never)}
        style={styles.button}
      />
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          {step !== 'success' && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (step === 'email') {
                  navigation.goBack();
                } else if (step === 'otp') {
                  setStep('email');
                } else if (step === 'password') {
                  setStep('otp');
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
          )}

          {/* Progress Indicator */}
          {step !== 'success' && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressDot, step === 'email' && styles.progressDotActive]} />
              <View style={[styles.progressLine, (step === 'otp' || step === 'password') && styles.progressLineActive]} />
              <View style={[styles.progressDot, step === 'otp' && styles.progressDotActive]} />
              <View style={[styles.progressLine, step === 'password' && styles.progressLineActive]} />
              <View style={[styles.progressDot, step === 'password' && styles.progressDotActive]} />
            </View>
          )}

          <View style={styles.content}>
            {step === 'email' && renderEmailStep()}
            {step === 'otp' && renderOtpStep()}
            {step === 'password' && renderPasswordStep()}
            {step === 'success' && renderSuccessStep()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: { gap: spacing.lg,
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  content: { gap: spacing.lg,
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  inputCard: {
    width: '100%',
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.foreground,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  button: {
    width: '100%',
    marginTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: spacing.sm,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  resendText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
