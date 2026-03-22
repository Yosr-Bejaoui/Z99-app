import { Paths } from 'expo-file-system';
import * as LegacyFS from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

export interface DownloadResult {
  success: boolean;
  localUri?: string;
  error?: string;
}

export interface ShareResult {
  success: boolean;
  error?: string;
}

export const mediaService = {
  /**
   * Download a file from URL to local storage
   */
  async downloadFile(url: string, filename?: string): Promise<DownloadResult> {
    try {
      // Generate filename from URL if not provided
      const fileName = filename || url.split('/').pop() || `download_${Date.now()}`;
      const fileUri = Paths.document.uri + fileName;

      // Download the file using legacy API
      const downloadResult = await LegacyFS.downloadAsync(url, fileUri);

      if (downloadResult.status !== 200) {
        return {
          success: false,
          error: `Download failed with status ${downloadResult.status}`,
        };
      }

      return {
        success: true,
        localUri: downloadResult.uri,
      };
    } catch (error: any) {
      console.error('Download error:', error);
      return {
        success: false,
        error: error.message || 'Failed to download file',
      };
    }
  },

  /**
   * Save image to device gallery
   */
  async saveImageToGallery(imageUrl: string): Promise<DownloadResult> {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        return {
          success: false,
          error: 'Gallery permission not granted',
        };
      }

      // Download image first
      const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
      const filename = `image_${Date.now()}.${extension}`;
      const downloadResult = await this.downloadFile(imageUrl, filename);

      if (!downloadResult.success || !downloadResult.localUri) {
        return downloadResult;
      }

      // Save to gallery
      const asset = await MediaLibrary.createAssetAsync(downloadResult.localUri);
      
      // Create album if needed
      const album = await MediaLibrary.getAlbumAsync('MultiAI');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('MultiAI', asset, false);
      }

      // Clean up temp file
      await LegacyFS.deleteAsync(downloadResult.localUri, { idempotent: true });

      return {
        success: true,
        localUri: asset.uri,
      };
    } catch (error: any) {
      console.error('Save to gallery error:', error);
      return {
        success: false,
        error: error.message || 'Failed to save image',
      };
    }
  },

  /**
   * Save video to device gallery
   */
  async saveVideoToGallery(videoUrl: string): Promise<DownloadResult> {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        return {
          success: false,
          error: 'Gallery permission not granted',
        };
      }

      // Download video first
      const extension = videoUrl.split('.').pop()?.split('?')[0] || 'mp4';
      const filename = `video_${Date.now()}.${extension}`;
      const downloadResult = await this.downloadFile(videoUrl, filename);

      if (!downloadResult.success || !downloadResult.localUri) {
        return downloadResult;
      }

      // Save to gallery
      const asset = await MediaLibrary.createAssetAsync(downloadResult.localUri);
      
      // Create album if needed
      const album = await MediaLibrary.getAlbumAsync('MultiAI');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('MultiAI', asset, false);
      }

      // Clean up temp file
      await LegacyFS.deleteAsync(downloadResult.localUri, { idempotent: true });

      return {
        success: true,
        localUri: asset.uri,
      };
    } catch (error: any) {
      console.error('Save video error:', error);
      return {
        success: false,
        error: error.message || 'Failed to save video',
      };
    }
  },

  /**
   * Share a file (image, video, audio, etc.)
   */
  async shareFile(url: string, filename?: string): Promise<ShareResult> {
    try {
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Sharing is not available on this device',
        };
      }

      // Download file first
      const downloadResult = await this.downloadFile(url, filename);
      if (!downloadResult.success || !downloadResult.localUri) {
        return {
          success: false,
          error: downloadResult.error || 'Failed to download file for sharing',
        };
      }

      // Share the file
      await Sharing.shareAsync(downloadResult.localUri, {
        mimeType: this.getMimeType(url),
        dialogTitle: 'Share from MultiAI',
      });

      // Clean up temp file after a delay
      setTimeout(async () => {
        if (downloadResult.localUri) {
          await LegacyFS.deleteAsync(downloadResult.localUri, { idempotent: true });
        }
      }, 5000);

      return { success: true };
    } catch (error: any) {
      console.error('Share error:', error);
      return {
        success: false,
        error: error.message || 'Failed to share file',
      };
    }
  },

  /**
   * Save audio file to device
   */
  async saveAudioFile(audioUrl: string, filename?: string): Promise<DownloadResult> {
    try {
      const extension = audioUrl.split('.').pop()?.split('?')[0] || 'mp3';
      const name = filename || `audio_${Date.now()}.${extension}`;
      
      return await this.downloadFile(audioUrl, name);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to save audio',
      };
    }
  },

  /**
   * Get MIME type from URL
   */
  getMimeType(url: string): string {
    const extension = url.split('.').pop()?.split('?')[0]?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      // Videos
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      webm: 'video/webm',
      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      m4a: 'audio/mp4',
      // 3D
      glb: 'model/gltf-binary',
      obj: 'text/plain',
      fbx: 'application/octet-stream',
    };
    return mimeTypes[extension || ''] || 'application/octet-stream';
  },

  /**
   * Show save/share action sheet
   */
  showMediaActions(
    mediaUrl: string,
    mediaType: 'image' | 'video' | 'audio' | '3d',
    onSuccess?: () => void
  ) {
    const actions = [
      { text: 'Cancel', style: 'cancel' as const },
    ];

    if (mediaType === 'image') {
      actions.unshift(
        {
          text: 'Save to Gallery',
          style: 'default' as const,
          onPress: async () => {
            const result = await this.saveImageToGallery(mediaUrl);
            if (result.success) {
              Alert.alert('Success', 'Image saved to gallery');
              onSuccess?.();
            } else {
              Alert.alert('Error', result.error || 'Failed to save image');
            }
          },
        } as any,
        {
          text: 'Share',
          style: 'default' as const,
          onPress: async () => {
            const result = await this.shareFile(mediaUrl);
            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to share');
            }
          },
        } as any
      );
    } else if (mediaType === 'video') {
      actions.unshift(
        {
          text: 'Save to Gallery',
          style: 'default' as const,
          onPress: async () => {
            const result = await this.saveVideoToGallery(mediaUrl);
            if (result.success) {
              Alert.alert('Success', 'Video saved to gallery');
              onSuccess?.();
            } else {
              Alert.alert('Error', result.error || 'Failed to save video');
            }
          },
        } as any,
        {
          text: 'Share',
          style: 'default' as const,
          onPress: async () => {
            const result = await this.shareFile(mediaUrl);
            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to share');
            }
          },
        } as any
      );
    } else if (mediaType === 'audio') {
      actions.unshift(
        {
          text: 'Download',
          style: 'default' as const,
          onPress: async () => {
            const result = await this.saveAudioFile(mediaUrl);
            if (result.success) {
              Alert.alert('Success', 'Audio file downloaded');
              onSuccess?.();
            } else {
              Alert.alert('Error', result.error || 'Failed to download');
            }
          },
        } as any,
        {
          text: 'Share',
          style: 'default' as const,
          onPress: async () => {
            const result = await this.shareFile(mediaUrl);
            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to share');
            }
          },
        } as any
      );
    } else {
      // 3D model
      actions.unshift(
        {
          text: 'Download',
          style: 'default' as const,
          onPress: async () => {
            const result = await this.downloadFile(mediaUrl);
            if (result.success) {
              Alert.alert('Success', 'File downloaded');
              onSuccess?.();
            } else {
              Alert.alert('Error', result.error || 'Failed to download');
            }
          },
        } as any,
        {
          text: 'Share',
          style: 'default' as const,
          onPress: async () => {
            const result = await this.shareFile(mediaUrl);
            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to share');
            }
          },
        } as any
      );
    }

    Alert.alert('Options', 'What would you like to do?', actions);
  },
};

export default mediaService;
