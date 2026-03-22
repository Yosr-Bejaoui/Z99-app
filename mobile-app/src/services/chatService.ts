import api, { getErrorMessage } from './api';
import { ENDPOINTS, WS_BASE_URL, STORAGE_KEYS } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  AIModel, 
  ChatSession, 
  ChatMessage, 
  PaginatedResponse,
  ModelType 
} from './types';

export const chatService = {
  // Get all available AI models
  async getModels(modelType?: ModelType): Promise<PaginatedResponse<AIModel>> {
    try {
      const params = modelType ? { model_type: modelType } : {};
      const response = await api.get(ENDPOINTS.MODELS_LIST, { params });
      // API may return {value: [...], Count} or array or {results: [...]}
      const data = response.data;
      if (Array.isArray(data)) {
        return { results: data, count: data.length, next: null, previous: null };
      }
      if (data.value && Array.isArray(data.value)) {
        return { results: data.value, count: data.Count || data.value.length, next: null, previous: null };
      }
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Get single AI model
  async getModel(modelId: number): Promise<AIModel> {
    try {
      const response = await api.get(`${ENDPOINTS.MODELS_LIST}${modelId}/`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Get all chat sessions for current user
  async getSessions(): Promise<PaginatedResponse<ChatSession>> {
    try {
      const response = await api.get(ENDPOINTS.CHAT_SESSIONS);
      // API may return array directly (no pagination), wrap it in expected format
      const data = response.data;
      if (Array.isArray(data)) {
        return { results: data, count: data.length, next: null, previous: null };
      }
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Get single chat session
  async getSession(sessionId: number): Promise<ChatSession> {
    try {
      const response = await api.get(`${ENDPOINTS.CHAT_SESSIONS}${sessionId}/`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Create new chat session
  async createSession(modelId: number, sessionType: ModelType = 'chat'): Promise<ChatSession> {
    try {
      const response = await api.post(ENDPOINTS.CHAT_SESSIONS, {
        model: modelId,
        session_type: sessionType,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Update chat session (e.g., summary)
  async updateSession(sessionId: number, data: Partial<ChatSession>): Promise<ChatSession> {
    try {
      const response = await api.patch(`${ENDPOINTS.CHAT_SESSIONS}${sessionId}/`, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Delete chat session
  async deleteSession(sessionId: number): Promise<void> {
    try {
      await api.delete(`${ENDPOINTS.CHAT_SESSIONS}${sessionId}/`);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Create WebSocket connection for real-time chat
  async createWebSocket(sessionId: number): Promise<WebSocket> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const wsUrl = `${WS_BASE_URL}/chat/${sessionId}/?token=${token}`;
    const ws = new WebSocket(wsUrl);
    
    return ws;
  },

  // Helper to format WebSocket send message
  formatSendMessage(
    message: string,
    options?: {
      images?: string[];
      numImages?: number;
      width?: number;
      height?: number;
    }
  ): string {
    return JSON.stringify({
      message,
      images: options?.images || [],
      num_images: options?.numImages,
      width: options?.width,
      height: options?.height,
    });
  },
};

export default chatService;
