import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';
import GradientButton from '../components/GradientButton';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../context';
import { useTranslation } from 'react-i18next';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

interface SignUpScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SignUp'>;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { register, googleLogin } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const isGoogleConfigured =
    (Platform.OS === 'android' && !!googleAndroidClientId) ||
    (Platform.OS === 'ios' && !!googleIosClientId) ||
    (Platform.OS === 'web' && !!googleWebClientId);

  // Google OAuth setup
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    // Expo's Google provider requires platform client IDs to be defined.
    // Use harmless placeholders so missing env vars don't crash the app at startup.
    androidClientId: googleAndroidClientId || 'placeholder-android.apps.googleusercontent.com',
    iosClientId: googleIosClientId || 'placeholder-ios.apps.googleusercontent.com',
    webClientId: googleWebClientId || 'placeholder-web.apps.googleusercontent.com',
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        handleGoogleAuthSuccess(id_token);
      }
    } else if (response?.type === 'error') {
      setError(t('signUp.error.registrationFailed'));
    }
  }, [response]);

  const handleGoogleAuthSuccess = async (idToken: string) => {
    setIsLoading(true);
    setError('');
    try {
      await googleLogin(idToken);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      });
    } catch (err: any) {
      setError(err.message || t('signUp.error.registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignUp = async () => {
    // Validate inputs
    if (!fullName.trim()) {
      setError(t('signUp.error.nameRequired'));
      return;
    }
    if (!email.trim()) {
      setError(t('signUp.error.emailRequired'));
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError(t('signUp.error.emailInvalid'));
      return;
    }
    if (!password) {
      setError(t('signUp.error.passwordRequired'));
      return;
    }
    if (password.length < 8) {
      setError(t('signUp.error.passwordLength'));
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError(t('signUp.error.passwordUppercase'));
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError(t('signUp.error.passwordNumber'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('signUp.error.passwordMismatch'));
      return;
    }
    if (!agreeToTerms) {
      setError(t('signUp.error.termsRequired'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await register({
        email: email.trim(),
        password,
        password2: confirmPassword,
        name: fullName.trim(),
      });
      // Navigate to OTP verification screen
      navigation.navigate('OTPVerification', { email: email.trim() });
    } catch (err: any) {
      setError(err.message || t('signUp.error.registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    if (request && isGoogleConfigured) {
      promptAsync();
    } else {
      Alert.alert(
        t('signUp.googleTitle'),
        'Google Sign-Up is not configured yet. Please set up OAuth Client IDs.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Back Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
              </TouchableOpacity>

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <View style={styles.logoGradient}>
                    <Ionicons name="sparkles" size={32} color={colors.primary} />
                  </View>
                </View>
                <Text style={styles.title}>{t('signUp.title')}</Text>
                <Text style={styles.subtitle}>{t('signUp.subtitle')}</Text>
              </View>

              {/* Sign Up Form */}
              <GlassCard style={styles.formCard}>
                {/* Full Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('signUp.fullNameLabel')}</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color={colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('signUp.fullNamePlaceholder')}
                      placeholderTextColor={colors.textMuted}
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                      accessibilityLabel="Full name"
                    />
                  </View>
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('signUp.emailLabel')}</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('signUp.emailPlaceholder')}
                      placeholderTextColor={colors.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      accessibilityLabel="Email address"
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('signUp.passwordLabel')}</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('signUp.passwordPlaceholder')}
                      placeholderTextColor={colors.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      accessibilityLabel="Password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('signUp.confirmPasswordLabel')}</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('signUp.confirmPasswordPlaceholder')}
                      placeholderTextColor={colors.textMuted}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      accessibilityLabel="Confirm password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Terms Checkbox */}
                <TouchableOpacity
                  style={styles.termsContainer}
                  onPress={() => setAgreeToTerms(!agreeToTerms)}
                  accessibilityLabel={agreeToTerms ? 'Agreed to terms and conditions' : 'Agree to terms and conditions'}
                  accessibilityRole="checkbox"
                >
                  <View
                    style={[
                      styles.checkbox,
                      agreeToTerms && styles.checkboxChecked,
                    ]}
                  >
                    {agreeToTerms && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.termsText}>
                    {t('signUp.termsText')}
                    <Text style={styles.termsLink}>{t('signUp.termsOfService')}</Text>{t('signUp.and')}
                    <Text style={styles.termsLink}>{t('signUp.privacyPolicy')}</Text>
                  </Text>
                </TouchableOpacity>

                {/* Error Message */}
                {error ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={18} color="#ff6b6b" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Sign Up Button */}
                <GradientButton
                  title={isLoading ? t('signUp.creating') : t('signUp.createButton')}
                  onPress={handleSignUp}
                  style={styles.signUpButton}
                  disabled={isLoading}
                />

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>{t('signUp.divider')}</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Sign Up */}
                <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignUp}>
                  <Ionicons name="logo-google" size={20} color={colors.textPrimary} />
                  <Text style={styles.socialButtonText}>{t('signUp.google')}</Text>
                </TouchableOpacity>
              </GlassCard>

              {/* Sign In Link */}
              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>{t('signUp.hasAccount')}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.signInLink}>{t('signUp.signInLink')}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
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
    padding: 24,
    paddingTop: 60,
  },
  content: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 8,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 24,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  formCard: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    height: 50,
    color: colors.textPrimary,
    marginLeft: 12,
    fontSize: 16,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  signUpButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 14,
    marginHorizontal: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  signInText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  signInLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SignUpScreen;
