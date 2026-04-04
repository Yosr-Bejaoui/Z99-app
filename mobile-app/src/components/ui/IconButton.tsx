// AUDIT FIX 3 - Create shared IconButton component
import React from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  color = '#ececec',
  size = 24,
  style,
}) => {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? 'rgba(255, 255, 255, 0.1)' : 'transparent' },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
});

export default IconButton;
