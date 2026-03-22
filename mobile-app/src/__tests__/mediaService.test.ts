import { Paths } from 'expo-file-system';
import * as LegacyFS from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { mediaService } from '../services/mediaService';

// Mock the expo modules
jest.mock('expo-file-system', () => ({
  Paths: {
    document: {
      uri: '/mock/document/',
    },
  },
}));

jest.mock('expo-file-system/legacy', () => ({
  downloadAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  createAssetAsync: jest.fn(),
  createAlbumAsync: jest.fn(),
  getAlbumAsync: jest.fn(),
  addAssetsToAlbumAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

describe('Media Service', () => {
  const originalError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  describe('downloadFile', () => {
    it('should download file to document directory', async () => {
      const mockDownload = LegacyFS.downloadAsync as jest.Mock;
      mockDownload.mockResolvedValueOnce({
        uri: '/mock/document/test.jpg',
        status: 200,
      });

      const result = await mediaService.downloadFile('https://example.com/image.jpg', 'test.jpg');

      expect(mockDownload).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
        '/mock/document/test.jpg'
      );
      expect(result).toEqual({ success: true, localUri: '/mock/document/test.jpg' });
    });

    it('should return an error object when download fails', async () => {
      const mockDownload = LegacyFS.downloadAsync as jest.Mock;
      mockDownload.mockRejectedValueOnce(new Error('Download failed'));

      await expect(
        mediaService.downloadFile('https://example.com/image.jpg', 'test.jpg')
      ).resolves.toEqual({ success: false, error: 'Download failed' });
    });
  });

  describe('saveImageToGallery', () => {
    it('should save image to gallery with permissions', async () => {
      const mockRequestPermissions = MediaLibrary.requestPermissionsAsync as jest.Mock;
      const mockCreateAsset = MediaLibrary.createAssetAsync as jest.Mock;
      const mockGetAlbum = MediaLibrary.getAlbumAsync as jest.Mock;
      const mockCreateAlbum = MediaLibrary.createAlbumAsync as jest.Mock;
      const mockDelete = LegacyFS.deleteAsync as jest.Mock;
      const mockDownload = LegacyFS.downloadAsync as jest.Mock;

      mockRequestPermissions.mockResolvedValueOnce({ status: 'granted' });
      mockDownload.mockResolvedValueOnce({ uri: '/mock/path/image.jpg', status: 200 });
      mockCreateAsset.mockResolvedValueOnce({ id: 'asset-123', uri: '/gallery/image.jpg' });
      mockGetAlbum.mockResolvedValueOnce(null);
      mockCreateAlbum.mockResolvedValueOnce({ id: 'album-123' });

      await expect(mediaService.saveImageToGallery('https://example.com/image.jpg')).resolves.toEqual({
        success: true,
        localUri: '/gallery/image.jpg',
      });

      expect(mockRequestPermissions).toHaveBeenCalled();
      expect(mockDownload).toHaveBeenCalled();
      expect(mockCreateAsset).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledWith('/mock/path/image.jpg', { idempotent: true });
    });

    it('should return an error object if permission is denied', async () => {
      const mockRequestPermissions = MediaLibrary.requestPermissionsAsync as jest.Mock;
      mockRequestPermissions.mockResolvedValueOnce({ status: 'denied' });

      await expect(
        mediaService.saveImageToGallery('https://example.com/image.jpg')
      ).resolves.toEqual({ success: false, error: 'Gallery permission not granted' });
    });
  });

  describe('shareFile', () => {
    it('should share file when sharing is available', async () => {
      const mockIsAvailable = Sharing.isAvailableAsync as jest.Mock;
      const mockShare = Sharing.shareAsync as jest.Mock;
      const mockDownload = LegacyFS.downloadAsync as jest.Mock;

      mockIsAvailable.mockResolvedValueOnce(true);
      mockDownload.mockResolvedValueOnce({ uri: '/mock/path/file.jpg', status: 200 });
      mockShare.mockResolvedValueOnce(undefined);

      await expect(mediaService.shareFile('https://example.com/file.jpg', 'file.jpg')).resolves.toEqual({ success: true });

      expect(mockIsAvailable).toHaveBeenCalled();
      expect(mockDownload).toHaveBeenCalled();
      expect(mockShare).toHaveBeenCalledWith('/mock/path/file.jpg', {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share from MultiAI',
      });
    });

    it('should return an error object if sharing is not available', async () => {
      const mockIsAvailable = Sharing.isAvailableAsync as jest.Mock;
      mockIsAvailable.mockResolvedValueOnce(false);

      await expect(
        mediaService.shareFile('https://example.com/file.jpg', 'file.jpg')
      ).resolves.toEqual({ success: false, error: 'Sharing is not available on this device' });
    });
  });
});
