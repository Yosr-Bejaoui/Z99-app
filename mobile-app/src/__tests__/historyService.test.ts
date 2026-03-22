import { historyService } from '../services/historyService';
import api from '../services/api';

// Mock the API
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    delete: jest.fn(),
  },
  getErrorMessage: (error: Error) => error.message,
}));

describe('History Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHistory', () => {
    it('should fetch history with correct parameters', async () => {
      const mockData = {
        count: 2,
        results: [
          {
            id: 1,
            session_type: 'chat',
            created_at: '2024-01-15T10:00:00Z',
            messages: [{ content: 'Hello' }],
          },
          {
            id: 2,
            session_type: 'text_to_image',
            created_at: '2024-01-14T10:00:00Z',
            messages: [{ content: 'Generate image' }],
          },
        ],
      };

      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

      const result = await historyService.getHistory();

      expect(api.get).toHaveBeenCalledWith('/chat/session/list/?');
      expect(result).toEqual({
        count: 2,
        next: undefined,
        previous: undefined,
        results: [
          expect.objectContaining({ id: 1, type: 'chat', title: 'Chat 1' }),
          expect.objectContaining({ id: 2, type: 'image', title: 'Image 2' }),
        ],
      });
    });

    it('should filter history by type', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { count: 1, results: [] },
      });

      await historyService.getHistory({ type: 'image' });

      expect(api.get).toHaveBeenCalledWith('/chat/session/list/?session_type=image');
    });

    it('should handle search query', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { count: 0, results: [] },
      });

      await historyService.getHistory({ search: 'test query' });

      expect(api.get).toHaveBeenCalledWith('/chat/session/list/?search=test+query');
    });
  });

  describe('deleteHistoryItem', () => {
    it('should delete history item by ID', async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

      await historyService.deleteHistoryItem(123);

      expect(api.delete).toHaveBeenCalledWith('/chat/session/list/123/');
    });
  });
});
