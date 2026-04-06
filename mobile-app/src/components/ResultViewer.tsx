import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';

interface ResultViewerProps {
  originalUri?: string | null;
  resultUri: string | null;
  mode?: 'single' | 'split';
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ 
  originalUri, 
  resultUri, 
  mode = 'single' 
}) => {
  const [showOriginal, setShowOriginal] = useState(false);

  if (!resultUri) return null;

  if (mode === 'split' && originalUri) {
    // Return a split slider mock for now, or toggle representation
    return (
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: showOriginal ? originalUri : resultUri }} 
            style={styles.image} 
            resizeMode="contain" 
          />
          <View style={styles.badgeLabel}>
            <Text style={styles.badgeText}>{showOriginal ? 'Original' : 'Result'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.toggleBtn}
          onPress={() => setShowOriginal(!showOriginal)}
        >
          <Ionicons name="swap-horizontal" size={20} color={colors.white} />
          <Text style={styles.toggleText}>Toggle View</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Default single image view
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: resultUri }} style={styles.image} resizeMode="contain" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeLabel: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.textMuted + '80',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  toggleText: {
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.sm,
  }
});

export default ResultViewer;