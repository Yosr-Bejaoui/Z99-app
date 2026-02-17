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
  ActivityIndicator,
} from 'react-native';
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

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post(ENDPOINTS.FORGOT_PASSWORD, { email: email.trim() });
      setStep('otp');
      Alert.alert('Success', 'A verification code has been sent to your email');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send verification code');
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
      setError('Please enter the complete verification code');
      return;
    }
    setError('');
    setStep('password');
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
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
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      await api.post(ENDPOINTS.FORGOT_PASSWORD, { email: email.trim() });
      Alert.alert('Success', 'A new verification code has been sent');
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
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
          <Ionicons name="mail" size={40} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>
        Enter your email address and we'll send you a verification code to reset your password.
      </Text>

      <GlassCard style={styles.inputCard}>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Email address"
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
        title={isLoading ? 'Sending...' : 'Send Verification Code'}
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
          <Ionicons name="keypad" size={40} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.subtitle}>
        We've sent a 6-digit code to {email}
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
        title="Verify Code"
        onPress={handleVerifyOTP}
        disabled={isLoading}
        style={styles.button}
      />

      <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
        <Text style={styles.resendText}>
          Didn't receive the code?{' '}
          <Text style={styles.resendLink}>Resend</Text>
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
          <Ionicons name="lock-closed" size={40} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Create New Password</Text>
      <Text style={styles.subtitle}>
        Your new password must be at least 8 characters long
      </Text>

      <GlassCard style={styles.inputCard}>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="New password"
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

      <GlassCard style={[styles.inputCard, { marginTop: 12 }]}>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor={colors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
          />
        </View>
      </GlassCard>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <GradientButton
        title={isLoading ? 'Resetting...' : 'Reset Password'}
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
          <Ionicons name="checkmark-circle" size={50} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Password Reset!</Text>
      <Text style={styles.subtitle}>
        Your password has been successfully reset. You can now log in with your new password.
      </Text>

      <GradientButton
        title="Back to Login"
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
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
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  iconContainer: {
    marginBottom: 24,
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
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  inputCard: {
    width: '100%',
    marginBottom: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
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
    marginTop: 12,
    marginBottom: 8,
  },
  button: {
    width: '100%',
    marginTop: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
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
    marginTop: 20,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
