import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../theme';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { authService, getErrorMessage } from '../services';
import { useAuth } from '../context';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

interface DeleteAccountScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DeleteAccount'>;
}

const DeleteAccountScreen: React.FC<DeleteAccountScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const CONFIRMATION_TEXT = 'DELETE MY ACCOUNT';

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!password.trim()) {
      newErrors.password = 'Password is required to confirm deletion';
    }

    if (!confirmText.trim()) {
      newErrors.confirmText = `Please type "${CONFIRMATION_TEXT}" to confirm`;
    } else if (confirmText !== CONFIRMATION_TEXT) {
      newErrors.confirmText = `Text must match exactly: "${CONFIRMATION_TEXT}"`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!validateForm()) {
              return;
            }

            try {
              setIsLoading(true);
              await authService.deleteAccount(password);

              Alert.alert(
                'Account Deleted',
                'Your account has been successfully deleted.',
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      try {
                        await logout();
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Landing' }],
                        });
                      } catch (error) {
                        console.error('Error logging out:', error);
                      }
                    },
                  },
                ]
              );
            } catch (error) {
              const errorMessage = getErrorMessage(error);
              setErrors({ submit: errorMessage });
              Alert.alert('Error', errorMessage);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delete Account</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Warning Card */}
          <GlassCard style={styles.warningCard}>
            <View style={styles.warningIconContainer}>
              <Ionicons name="warning" size={40} color="#ef4444" />
            </View>
            <Text style={styles.warningTitle}>Permanent Deletion</Text>
            <Text style={styles.warningText}>
              Deleting your account is a permanent action. You will lose access to all your data, projects, and subscription benefits.
            </Text>
          </GlassCard>

          {/* Important Points */}
          <GlassCard style={styles.pointsCard}>
            <Text style={styles.pointsTitle}>What will happen:</Text>
            <View style={styles.point}>
              <Ionicons name="close-circle" size={18} color="#ef4444" />
              <Text style={styles.pointText}>All your projects and data will be deleted</Text>
            </View>
            <View style={styles.point}>
              <Ionicons name="close-circle" size={18} color="#ef4444" />
              <Text style={styles.pointText}>Your account will no longer be accessible</Text>
            </View>
            <View style={styles.point}>
              <Ionicons name="close-circle" size={18} color="#ef4444" />
              <Text style={styles.pointText}>Subscription will be cancelled immediately</Text>
            </View>
            <View style={styles.point}>
              <Ionicons name="close-circle" size={18} color="#ef4444" />
              <Text style={styles.pointText}>This action cannot be reversed or recovered</Text>
            </View>
          </GlassCard>

          {/* Form */}
          <GlassCard style={styles.formCard}>
            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Your Password</Text>
              <View style={[
                styles.inputContainer,
                errors.password && styles.inputError,
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors({ ...errors, password: '' });
                    }
                  }}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Confirmation Text */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Type <Text style={styles.confirmationTextHighlight}>"{CONFIRMATION_TEXT}"</Text> to confirm
              </Text>
              <View style={[
                styles.inputContainer,
                errors.confirmText && styles.inputError,
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder="Type confirmation text"
                  placeholderTextColor={colors.textMuted}
                  value={confirmText}
                  onChangeText={(text) => {
                    setConfirmText(text.toUpperCase());
                    if (errors.confirmText) {
                      setErrors({ ...errors, confirmText: '' });
                    }
                  }}
                  editable={!isLoading}
                  autoCapitalize="characters"
                />
              </View>
              {errors.confirmText && (
                <Text style={styles.errorText}>{errors.confirmText}</Text>
              )}
            </View>
          </GlassCard>

          {/* Submit Error */}
          {errors.submit && (
            <View style={styles.submitErrorCard}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.submitErrorText}>{errors.submit}</Text>
            </View>
          )}

          {/* Buttons */}
          <TouchableOpacity
            style={[styles.deleteButton, isLoading && styles.deleteButtonDisabled]}
            onPress={handleDeleteAccount}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color={colors.white} />
                <Text style={styles.deleteButtonText}>Delete My Account</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          {/* Help Text */}
          <Text style={styles.helpText}>
            Need help? Contact our support team before deleting your account.
          </Text>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  warningCard: {
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
    backgroundColor: '#ef444410',
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  warningIconContainer: {
    marginBottom: spacing.md,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: spacing.sm,
  },
  warningText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  pointsCard: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  pointText: {
    flex: 1,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  formCard: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  confirmationTextHighlight: {
    color: '#ef4444',
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingRight: spacing.sm,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  eyeButton: {
    padding: spacing.sm,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  submitErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef444415',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  submitErrorText: {
    flex: 1,
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  helpText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default DeleteAccountScreen;
