const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

const mockGetErrorMessage = jest.fn((error: unknown) =>
  error instanceof Error ? error.message : 'Unknown API error'
);

const mockAsyncStorage = {
  getItem: jest.fn(),
};

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => mockApi.get(...args),
    post: (...args: unknown[]) => mockApi.post(...args),
    patch: (...args: unknown[]) => mockApi.patch(...args),
    delete: (...args: unknown[]) => mockApi.delete(...args),
  },
  get: (...args: unknown[]) => mockApi.get(...args),
  post: (...args: unknown[]) => mockApi.post(...args),
  patch: (...args: unknown[]) => mockApi.patch(...args),
  delete: (...args: unknown[]) => mockApi.delete(...args),
  getErrorMessage: (...args: unknown[]) => mockGetErrorMessage(...args),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: (...args: unknown[]) => mockAsyncStorage.getItem(...args),
  },
  getItem: (...args: unknown[]) => mockAsyncStorage.getItem(...args),
}));

import { chatService } from '../services/chatService';
import { ENDPOINTS, STORAGE_KEYS, WS_BASE_URL } from '../services/config';

describe('chatService', () => {
  const originalWebSocket = global.WebSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetErrorMessage.mockImplementation((error: unknown) =>
      error instanceof Error ? error.message : 'Unknown API error'
    );
  });

  afterAll(() => {
    global.WebSocket = originalWebSocket;
  });

  describe('getModels', () => {
    it('wraps plain arrays into a paginated result shape', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [{ id: 1, name: 'GPT' }] });

      await expect(chatService.getModels('chat')).resolves.toEqual({
        results: [{ id: 1, name: 'GPT' }],
        count: 1,
        next: null,
        previous: null,
      });
      expect(mockApi.get).toHaveBeenCalledWith(ENDPOINTS.MODELS_LIST, { params: { model_type: 'chat' } });
    });

    it('normalizes legacy {value, Count} model responses', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { value: [{ id: 2, name: 'Claude' }], Count: 9 } });

      await expect(chatService.getModels()).resolves.toEqual({
        results: [{ id: 2, name: 'Claude' }],
        count: 9,
        next: null,
        previous: null,
      });
    });

    it('passes through already-paginated model responses', async () => {
      const payload = { count: 1, results: [{ id: 3, name: 'Gemini' }] };
      mockApi.get.mockResolvedValueOnce({ data: payload });

      await expect(chatService.getModels()).resolves.toEqual(payload);
    });

    it('rethrows formatted model-loading errors', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Models unavailable'));
      await expect(chatService.getModels()).rejects.toThrow('Models unavailable');
    });
  });

  it('loads a single model by ID', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { id: 10, name: 'Single model' } });
    await expect(chatService.getModel(10)).resolves.toEqual({ id: 10, name: 'Single model' });
    expect(mockApi.get).toHaveBeenCalledWith(`${ENDPOINTS.MODELS_LIST}10/`);
  });

  describe('sessions', () => {
    it('wraps plain arrays returned by getSessions', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [{ id: 1 }] });

      await expect(chatService.getSessions()).resolves.toEqual({
        results: [{ id: 1 }],
        count: 1,
        next: null,
        previous: null,
      });
      expect(mockApi.get).toHaveBeenCalledWith(ENDPOINTS.CHAT_SESSIONS);
    });

    it('passes through paginated session responses', async () => {
      const payload = { count: 2, results: [{ id: 1 }, { id: 2 }] };
      mockApi.get.mockResolvedValueOnce({ data: payload });

      await expect(chatService.getSessions()).resolves.toEqual(payload);
    });

    it('loads a single session', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { id: 5, summary: 'chat' } });

      await expect(chatService.getSession(5)).resolves.toEqual({ id: 5, summary: 'chat' });
      expect(mockApi.get).toHaveBeenCalledWith(`${ENDPOINTS.CHAT_SESSIONS}5/`);
    });

    it('creates a chat session with the default chat type', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { id: 9 } });

      await expect(chatService.createSession(88)).resolves.toEqual({ id: 9 });
      expect(mockApi.post).toHaveBeenCalledWith(ENDPOINTS.CHAT_SESSIONS, {
        model: 88,
        session_type: 'chat',
      });
    });

    it('creates non-chat sessions with the explicit session type', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { id: 10 } });

      await chatService.createSession(88, 'image_to_video');

      expect(mockApi.post).toHaveBeenCalledWith(ENDPOINTS.CHAT_SESSIONS, {
        model: 88,
        session_type: 'image_to_video',
      });
    });

    it('updates an existing session', async () => {
      mockApi.patch.mockResolvedValueOnce({ data: { id: 7, summary: 'Updated' } });

      await expect(chatService.updateSession(7, { summary: 'Updated' } as any)).resolves.toEqual({ id: 7, summary: 'Updated' });
      expect(mockApi.patch).toHaveBeenCalledWith(`${ENDPOINTS.CHAT_SESSIONS}7/`, { summary: 'Updated' });
    });

    it('deletes a session', async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      await expect(chatService.deleteSession(7)).resolves.toBeUndefined();
      expect(mockApi.delete).toHaveBeenCalledWith(`${ENDPOINTS.CHAT_SESSIONS}7/`);
    });
  });

  describe('createWebSocket', () => {
    it('opens a websocket using the stored access token', async () => {
      const socketInstance = { readyState: 1 } as unknown as WebSocket;
      const webSocketFactory = jest.fn(() => socketInstance);
      global.WebSocket = webSocketFactory as unknown as typeof WebSocket;
      mockAsyncStorage.getItem.mockResolvedValueOnce('access-token');

      await expect(chatService.createWebSocket(123)).resolves.toBe(socketInstance);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
      expect(webSocketFactory).toHaveBeenCalledWith(`${WS_BASE_URL}/chat/123/?token=access-token`);
    });

    it('rejects websocket creation when the user is not authenticated', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      await expect(chatService.createWebSocket(123)).rejects.toThrow('Not authenticated');
    });
  });

  it('formats websocket send payloads with optional image-generation fields', () => {
    expect(
      chatService.formatSendMessage('Generate image', {
        images: ['data:image/png;base64,aaa'],
        numImages: 2,
        width: 512,
        height: 512,
      })
    ).toBe(
      JSON.stringify({
        message: 'Generate image',
        images: ['data:image/png;base64,aaa'],
        num_images: 2,
        width: 512,
        height: 512,
      })
    );
  });
});