import api from './api';

export interface AIModel {
  id: number;
  name: string;
  provider: string;
  model_type: 'chat' | 'image' | 'video' | 'audio' | 'text_to_speech' | 'speech_to_text';
  description?: string;
  is_active: boolean;
  is_premium: boolean;
  api_key?: string;
  base_url?: string;
  max_tokens?: number;
  temperature?: number;
  created_at: string;
  updated_at: string;
  usage_count?: number;
}

export interface ModelsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AIModel[];
}

export interface ModelFilters {
  page?: number;
  page_size?: number;
  search?: string;
  model_type?: string;
  provider?: string;
  is_active?: boolean;
  is_premium?: boolean;
}

export const modelsService = {
  async getModels(filters: ModelFilters = {}): Promise<ModelsResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.model_type) params.append('model_type', filters.model_type);
    if (filters.provider) params.append('provider', filters.provider);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters.is_premium !== undefined) params.append('is_premium', filters.is_premium.toString());
    
    const response = await api.get<ModelsResponse>(`/ai/admin/models/?${params.toString()}`);
    return response.data;
  },

  async getModel(id: number): Promise<AIModel> {
    const response = await api.get<AIModel>(`/ai/admin/models/${id}/`);
    return response.data;
  },

  async createModel(data: Partial<AIModel>): Promise<AIModel> {
    const response = await api.post<AIModel>('/ai/admin/models/', data);
    return response.data;
  },

  async updateModel(id: number, data: Partial<AIModel>): Promise<AIModel> {
    const response = await api.patch<AIModel>(`/ai/admin/models/${id}/`, data);
    return response.data;
  },

  async deleteModel(id: number): Promise<void> {
    await api.delete(`/ai/admin/models/${id}/`);
  },

  async toggleModelStatus(id: number, isActive: boolean): Promise<AIModel> {
    const response = await api.patch<AIModel>(`/ai/admin/models/${id}/`, {
      is_active: isActive,
    });
    return response.data;
  },

  async getModelStats(): Promise<{
    total_models: number;
    active_models: number;
    by_type: Record<string, number>;
    by_provider: Record<string, number>;
  }> {
    const response = await api.get('/ai/admin/models/stats/');
    return response.data;
  },

  async getProviders(): Promise<string[]> {
    const response = await api.get<string[]>('/ai/admin/providers/');
    return response.data;
  },
};

export default modelsService;
