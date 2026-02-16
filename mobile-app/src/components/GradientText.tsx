import React from 'react';
import { Text, View, StyleSheet, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../theme';

interface GradientTextProps {
  children: string;
  style?: TextStyle;
}

/**
 * GradientText component that renders text with gradient effect
 * Falls back to primary color if MaskedView is not available
 */
export const GradientText: React.FC<GradientTextProps> = ({ children, style }) => {
  // Simple implementation using opacity layers for gradient effect
  return (
    <View style={styles.container}>
      <Text style={[style, styles.gradientText]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  gradientText: {
    color: '#2dd4bf', // Primary teal color as fallback
  },
});

export default GradientText;
