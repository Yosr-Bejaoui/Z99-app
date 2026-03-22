import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let toastQueue: ToastMessage[] = [];
let listeners: ((toast: ToastMessage | null) => void)[] = [];

export const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
  const id = Math.random().toString(36).substr(2, 9);
  const toast: ToastMessage = { id, message, type, duration };
  
  // Clear existing toasts and show new one
  toastQueue = [toast];
  notifyListeners(toast);
  
  if (duration > 0) {
    setTimeout(() => {
      if (toastQueue[0]?.id === id) {
        toastQueue = [];
        notifyListeners(null);
      }
    }, duration);
  }
};

const notifyListeners = (toast: ToastMessage | null) => {
  listeners.forEach(listener => listener(toast));
};

export const useToast = (callback: (toast: ToastMessage | null) => void) => {
  React.useEffect(() => {
    listeners.push(callback);
    return () => {
      listeners = listeners.filter(l => l !== callback);
    };
  }, [callback]);
};

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, type, visible }) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#10b98120';
      case 'error':
        return '#ef444420';
      case 'warning':
        return '#f59e0b20';
      default:
        return `${colors.primary}20`;
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return colors.primary;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <Text style={[styles.icon, { color: getTextColor() }]}>
        {getIcon()}
      </Text>
      <Text style={[styles.message, { color: getTextColor() }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});

export default Toast;
