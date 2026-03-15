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

interface LoginScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setError(t('login.error.loginFailed'));
    }
  }, [response]);

  const handleGoogleAuthSuccess = async (idToken: string) => {
    setIsLoading(true);
    setError('');
    try {
      await googleLogin(idToken);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err: any) {
      setError(err.message || t('login.error.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    // Validate inputs
    if (!email.trim()) {
      setError(t('login.error.emailRequired'));
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError(t('login.error.emailInvalid'));
      return;
    }
    if (!password) {
      setError(t('login.error.passwordRequired'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await login({ email: email.trim(), password: password.trim() });
      // Navigate to main screen after successful login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err: any) {
      setError(err.message || t('login.error.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (request && isGoogleConfigured) {
      promptAsync();
    } else {
      Alert.alert(
        t('login.googleTitle'),
        'Google Sign-In is not configured yet. Please set up OAuth Client IDs.',
        [{ text: t('common.ok') }]
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
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <View style={styles.logo}>
                    <Ionicons name="sparkles" size={32} color={colors.primary} />
                  </View>
                </View>
                <Text style={styles.title}>{t('login.title')}</Text>
                <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
              </View>

              {/* Login Form */}
              <GlassCard style={styles.formCard}>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('login.emailLabel')}</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('login.emailPlaceholder')}
                      placeholderTextColor={colors.textMuted}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (error) setError('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="off"
                      textContentType="none"
                      selectionColor={colors.primary}
                      underlineColorAndroid="transparent"
                      accessibilityLabel={t('login.a11y.email')}
                      accessibilityHint={t('login.a11y.emailHint')}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('login.passwordLabel')}</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('login.passwordPlaceholder')}
                      placeholderTextColor={colors.textMuted}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (error) setError('');
                      }}
                      secureTextEntry={!showPassword}
                      autoCorrect={false}
                      autoComplete="off"
                      textContentType="none"
                      selectionColor={colors.primary}
                      underlineColorAndroid="transparent"
                      accessibilityLabel={t('login.a11y.password')}
                      accessibilityHint={t('login.a11y.passwordHint')}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      accessibilityLabel={showPassword ? t('login.a11y.hidePassword') : t('login.a11y.showPassword')}
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

                {/* Forgot Password */}
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => navigation.navigate('ForgotPassword')}
                  accessibilityLabel={t('login.a11y.forgotPassword')}
                  accessibilityRole="link"
                >
                  <Text style={styles.forgotPasswordText}>{t('login.forgotPassword')}</Text>
                </TouchableOpacity>

                {/* Error Message */}
                {error ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={18} color="#ff6b6b" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Login Button */}
                <GradientButton
                  title={isLoading ? t('login.signingIn') : t('login.signInButton')}
                  onPress={handleLogin}
                  style={styles.loginButton}
                  disabled={isLoading}
                />

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>{t('login.divider')}</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Login */}
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleGoogleLogin}
                  accessibilityLabel={t('login.a11y.googleSignIn')}
                  accessibilityRole="button"
                >
                  <Ionicons name="logo-google" size={20} color={colors.textPrimary} />
                  <Text style={styles.socialButtonText}>{t('login.google')}</Text>
                </TouchableOpacity>
              </GlassCard>

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>{t('login.noAccount')}</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('SignUp')}
                  accessibilityLabel={t('login.a11y.signUp')}
                  accessibilityRole="link"
                >
                  <Text style={styles.signUpLink}>{t('login.signUpLink')}</Text>
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
    justifyContent: 'center',
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
  },
  formCard: {
    padding: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    height: 52,
  },
  input: {
    flex: 1,
    height: 50,
    color: colors.textPrimary,
    marginLeft: spacing.md,
    fontSize: 16,
    paddingVertical: 0,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginLeft: spacing.sm,
    flex: 1,
  },
  loginButton: {
    marginBottom: spacing.xl,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 14,
    marginHorizontal: spacing.lg,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: spacing.md,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  signUpText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  signUpLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
