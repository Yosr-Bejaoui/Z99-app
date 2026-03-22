import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';
import GradientButton from './GradientButton';

interface CostConfirmationModalProps {
  visible: boolean;
  actionName: string;
  cost: number;
  currentCredits: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const CostConfirmationModal: React.FC<CostConfirmationModalProps> = ({
  visible,
  actionName,
  cost,
  currentCredits,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const hasEnoughCredits = currentCredits >= cost;
  const remainingCredits = currentCredits - cost;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={[
            styles.iconContainer,
            { backgroundColor: hasEnoughCredits ? `${colors.primary}20` : '#ef444420' }
          ]}>
            <Ionicons
              name={hasEnoughCredits ? 'wallet' : 'alert-circle'}
              size={40}
              color={hasEnoughCredits ? colors.primary : '#ef4444'}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{actionName}</Text>

          {/* Cost Info */}
          <View style={styles.costCard}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Current Credits</Text>
              <Text style={styles.costValue}>{currentCredits.toLocaleString()}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Cost</Text>
              <Text style={[styles.costValue, { color: '#ef4444' }]}>
                -{cost.toLocaleString()}
              </Text>
            </View>

            {hasEnoughCredits && (
              <>
                <View style={styles.divider} />
                <View style={styles.costRow}>
                  <Text style={[styles.costLabel, { fontWeight: '600' }]}>After Action</Text>
                  <Text style={[styles.costValue, { color: colors.primary, fontWeight: '700' }]}>
                    {remainingCredits.toLocaleString()}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Message */}
          {!hasEnoughCredits && (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.warningText}>
                You don't have enough credits. Please buy more credits to continue.
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <GradientButton
              title={isLoading ? 'Processing...' : 'Confirm'}
              onPress={onConfirm}
              disabled={!hasEnoughCredits || isLoading}
              style={styles.confirmButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  costCard: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  costLabel: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  costValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  warningBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ef444415',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
  },
});

export default CostConfirmationModal;
