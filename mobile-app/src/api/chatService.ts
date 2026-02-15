import apiClient from './client';
import { ENDPOINTS, getWebSocketUrl } from './config';

export interface AIModel {
  id: number;
  name: string;
  model_id: string;
  description: string;
  base_cost: number;
  model_type: 'chat' | 'text_to_image' | 'image_to_image' | 'text_to_video' | 'image_to_video';
  provider: string;
}

export interface ChatMessage {
  id?: number;
  sender: 'user' | 'ai';
  content: string;
  images?: string[];
  timestamp: string;
}

export interface ChatSession {
  id: number;
  model: number;
  model_details?: AIModel;
  messages: ChatMessage[];
  session_type: string;
  summary?: string;
  created_at: string;
}

export interface CreateSessionInput {
  session_type: 'chat' | 'text_to_image' | 'image_to_image' | 'text_to_video' | 'image_to_video';
  model: number;
}

export type WebSocketMessageHandler = (message: ChatMessage) => void;
export type WebSocketErrorHandler = (error: string) => void;

class ChatWebSocket {
  private ws: WebSocket | null = null;
  private onMessage: WebSocketMessageHandler | null = null;
  private onError: WebSocketErrorHandler | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private sessionId: string | null = null;
  private token: string | null = null;

  connect(
    sessionId: string,
    token: string,
    onMessage: WebSocketMessageHandler,
    onError: WebSocketErrorHandler
  ) {
    this.sessionId = sessionId;
    this.token = token;
    this.onMessage = onMessage;
    this.onError = onError;

    const url = getWebSocketUrl(sessionId, token);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'previous_messages' && Array.isArray(data.messages)) {
          // Handle history messages
          data.messages.forEach((msg: ChatMessage) => {
            this.onMessage?.(msg);
          });
        } else if (data.type === 'new_message' && data.message) {
          // Handle new message
          this.onMessage?.(data.message);
        } else if (data.type === 'error') {
          this.onError?.(data.message || 'Unknown error');
        }
      } catch (error) {
        console.error('WebSocket parse error:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.onError?.('Connection error');
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      
      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts && this.sessionId && this.token) {
        this.reconnectAttempts++;
        setTimeout(() => {
          if (this.sessionId && this.token && this.onMessage && this.onError) {
            this.connect(this.sessionId, this.token, this.onMessage, this.onError);
          }
        }, 1000 * this.reconnectAttempts);
      }
    };
  }

  send(message: {
    message: string;
    images?: string[];
    width?: number;
    height?: number;
    num_images?: number;
    duration?: number;
    aspect_ratio?: string;
    style?: string;
    target_resolution?: string;
  }) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.onError?.('Connection not ready');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.sessionId = null;
    this.token = null;
    this.onMessage = null;
    this.onError = null;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const chatService = {
  /**
   * Get all available AI models
   */
  async getModels(modelType?: string): Promise<AIModel[]> {
    const endpoint = modelType 
      ? `${ENDPOINTS.models}?model_type=${modelType}`
      : ENDPOINTS.models;
    return apiClient.request(endpoint);
  },

  /**
   * Get chat models only
   */
  async getChatModels(): Promise<AIModel[]> {
    const models = await this.getModels();
    return models.filter(m => m.model_type === 'chat');
  },

  /**
   * Get image generation models
   */
  async getImageModels(): Promise<AIModel[]> {
    const models = await this.getModels();
    return models.filter(m => 
      m.model_type === 'text_to_image' || 
      m.model_type === 'image_to_image'
    );
  },

  /**
   * Get all chat sessions
   */
  async getSessions(): Promise<ChatSession[]> {
    return apiClient.request(ENDPOINTS.chatSessions);
  },

  /**
   * Create a new chat session
   */
  async createSession(input: CreateSessionInput): Promise<ChatSession> {
    return apiClient.request(ENDPOINTS.chatSessions, {
      method: 'POST',
      body: input,
    });
  },

  /**
   * Create a new WebSocket connection for chat
   */
  createWebSocket(): ChatWebSocket {
    return new ChatWebSocket();
  },
};

export default chatService;
