import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

interface ImageUploaderProps {
  imageUri: string | null;
  onImageSelected: (uri: string) => void;
  title?: string;
  subtitle?: string;
  mediaType?: 'image' | 'video';
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageUri,
  onImageSelected,
  title = 'Upload Image',
  subtitle = 'Tap to select an image from gallery',
  mediaType = 'image',
}) => {
  const handleSelectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onImageSelected(result.assets[0].uri);
    }
  };

  if (imageUri) {
    return (
      <View style={styles.container}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
          <TouchableOpacity style={styles.removeButton} onPress={() => onImageSelected('')}>
            <Ionicons name="close" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.uploadBox} onPress={handleSelectImage} activeOpacity={0.8}>
      <View style={styles.iconCircle}>
        <Ionicons name={mediaType === 'video' ? 'videocam-outline' : 'image-outline'} size={32} color={colors.primary} />      
      </View>
      <Text style={styles.uploadTitle}>{title}</Text>
      <Text style={styles.uploadSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  uploadBox: {
    width: '100%',
    height: 220,
    backgroundColor: colors.surface + '80',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  uploadTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  uploadSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: 300,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ImageUploader;