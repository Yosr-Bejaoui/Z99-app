import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Toast, { useToast, ToastType } from './Toast';

export const GlobalToast = () => {
  const [toast, setToast] = useState<{message: string, type: ToastType, visible: boolean}>({ message: '', type: 'info', visible: false });

  useToast((t) => {
    if (t) {
      setToast({ message: t.message, type: t.type, visible: true });
    } else {
      setToast(prev => ({ ...prev, visible: false }));
    }
  });

  if (!toast.visible) return null;

  return (
    <View style={styles.container}>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
  }
});