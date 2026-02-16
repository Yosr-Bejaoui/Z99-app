import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { mediaService } from '../services/mediaService';

// Mock the expo modules
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/document/',
  downloadAsync: jest.fn(),
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadFile', () => {
    it('should download file to document directory', async () => {
      const mockDownload = FileSystem.downloadAsync as jest.Mock;
      mockDownload.mockResolvedValueOnce({
        uri: '/mock/document/test.jpg',
        status: 200,
      });

      const result = await mediaService.downloadFile('https://example.com/image.jpg', 'test.jpg');

      expect(mockDownload).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
        '/mock/document/test.jpg'
      );
      expect(result).toBe('/mock/document/test.jpg');
    });

    it('should handle download failure', async () => {
      const mockDownload = FileSystem.downloadAsync as jest.Mock;
      mockDownload.mockRejectedValueOnce(new Error('Download failed'));

      await expect(
        mediaService.downloadFile('https://example.com/image.jpg', 'test.jpg')
      ).rejects.toThrow('Download failed');
    });
  });

  describe('saveImageToGallery', () => {
    it('should save image to gallery with permissions', async () => {
      const mockRequestPermissions = MediaLibrary.requestPermissionsAsync as jest.Mock;
      const mockCreateAsset = MediaLibrary.createAssetAsync as jest.Mock;
      const mockGetAlbum = MediaLibrary.getAlbumAsync as jest.Mock;
      const mockCreateAlbum = MediaLibrary.createAlbumAsync as jest.Mock;
      const mockDownload = FileSystem.downloadAsync as jest.Mock;

      mockRequestPermissions.mockResolvedValueOnce({ status: 'granted' });
      mockDownload.mockResolvedValueOnce({ uri: '/mock/path/image.jpg', status: 200 });
      mockCreateAsset.mockResolvedValueOnce({ id: 'asset-123' });
      mockGetAlbum.mockResolvedValueOnce(null);
      mockCreateAlbum.mockResolvedValueOnce({ id: 'album-123' });

      await mediaService.saveImageToGallery('https://example.com/image.jpg');

      expect(mockRequestPermissions).toHaveBeenCalled();
      expect(mockDownload).toHaveBeenCalled();
      expect(mockCreateAsset).toHaveBeenCalled();
    });

    it('should throw error if permission denied', async () => {
      const mockRequestPermissions = MediaLibrary.requestPermissionsAsync as jest.Mock;
      mockRequestPermissions.mockResolvedValueOnce({ status: 'denied' });

      await expect(
        mediaService.saveImageToGallery('https://example.com/image.jpg')
      ).rejects.toThrow('Media library permission denied');
    });
  });

  describe('shareFile', () => {
    it('should share file when sharing is available', async () => {
      const mockIsAvailable = Sharing.isAvailableAsync as jest.Mock;
      const mockShare = Sharing.shareAsync as jest.Mock;
      const mockDownload = FileSystem.downloadAsync as jest.Mock;

      mockIsAvailable.mockResolvedValueOnce(true);
      mockDownload.mockResolvedValueOnce({ uri: '/mock/path/file.jpg', status: 200 });
      mockShare.mockResolvedValueOnce(undefined);

      await mediaService.shareFile('https://example.com/file.jpg', 'file.jpg');

      expect(mockIsAvailable).toHaveBeenCalled();
      expect(mockDownload).toHaveBeenCalled();
      expect(mockShare).toHaveBeenCalledWith('/mock/path/file.jpg');
    });

    it('should throw error if sharing not available', async () => {
      const mockIsAvailable = Sharing.isAvailableAsync as jest.Mock;
      mockIsAvailable.mockResolvedValueOnce(false);

      await expect(
        mediaService.shareFile('https://example.com/file.jpg', 'file.jpg')
      ).rejects.toThrow('Sharing is not available on this device');
    });
  });
});
