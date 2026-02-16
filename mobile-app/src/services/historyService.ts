import api, { getErrorMessage } from './api';
import type { HistoryItem } from './types';

export type { HistoryItem };

export interface HistoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: HistoryItem[];
}

export interface HistoryFilters {
  type?: 'chat' | 'image' | 'video' | 'audio' | '3d' | 'all';
  search?: string;
  date_from?: string;
  date_to?: string;
  model_id?: number;
  page?: number;
  page_size?: number;
}

export const historyService = {
  /**
   * Get user's history (chat sessions, image generations, etc.)
   */
  async getHistory(filters: HistoryFilters = {}): Promise<HistoryResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.type && filters.type !== 'all') {
        params.append('session_type', filters.type);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.date_from) {
        params.append('created_at__gte', filters.date_from);
      }
      if (filters.date_to) {
        params.append('created_at__lte', filters.date_to);
      }
      if (filters.model_id) {
        params.append('model', filters.model_id.toString());
      }
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      if (filters.page_size) {
        params.append('page_size', filters.page_size.toString());
      }

      const response = await api.get(`/chat/session/list/?${params.toString()}`);
      const data = response.data;

      // Transform API response to HistoryItem format
      if (Array.isArray(data)) {
        const items = data.map(transformToHistoryItem);
        return {
          count: items.length,
          next: null,
          previous: null,
          results: items,
        };
      }

      return {
        count: data.count || 0,
        next: data.next,
        previous: data.previous,
        results: (data.results || []).map(transformToHistoryItem),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get a single history item details
   */
  async getHistoryItem(id: number): Promise<HistoryItem> {
    try {
      const response = await api.get(`/chat/session/list/${id}/`);
      return transformToHistoryItem(response.data);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Delete a history item
   */
  async deleteHistoryItem(id: number): Promise<void> {
    try {
      await api.delete(`/chat/session/list/${id}/`);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get chat messages for a session
   */
  async getChatMessages(sessionId: number): Promise<any[]> {
    try {
      const response = await api.get(`/chat/session/list/${sessionId}/messages/`);
      return response.data.results || response.data || [];
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get generated images for a session
   */
  async getSessionImages(sessionId: number): Promise<any[]> {
    try {
      const response = await api.get(`/chat/session/list/${sessionId}/images/`);
      return response.data.results || response.data || [];
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Search history
   */
  async searchHistory(query: string, limit: number = 20): Promise<HistoryItem[]> {
    try {
      const response = await this.getHistory({
        search: query,
        page_size: limit,
      });
      return response.results;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number = 10): Promise<HistoryItem[]> {
    try {
      const response = await this.getHistory({
        page_size: limit,
      });
      return response.results;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

/**
 * Transform API session data to HistoryItem format
 */
function transformToHistoryItem(data: any): HistoryItem {
  const sessionType = data.session_type || data.type || 'chat';
  
  // Determine type based on session_type
  let type: HistoryItem['type'] = 'chat';
  if (sessionType.includes('image') || sessionType === 'text_to_image') {
    type = 'image';
  } else if (sessionType.includes('video')) {
    type = 'video';
  } else if (sessionType.includes('speech') || sessionType === 'text_to_speech') {
    type = 'audio';
  } else if (sessionType.includes('3d')) {
    type = '3d';
  }

  return {
    id: data.id,
    type,
    title: data.summary || data.title || `${capitalize(type)} ${data.id}`,
    model: data.ai_model?.name || data.model_name || 'Unknown Model',
    model_id: data.ai_model?.id || data.model_id || 0,
    preview_url: data.preview_url || data.thumbnail,
    content_url: data.content_url || data.url,
    prompt: data.prompt || data.last_message,
    words_used: data.words_used || data.total_words || 0,
    date: data.created_at || new Date().toISOString(),
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default historyService;
