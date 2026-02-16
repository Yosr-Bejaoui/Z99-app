import api from './api';

export interface AIModel {
  id: number;
  name: string;
  version: string;
  provider: string;
  model_id: string;
  model_type: 'chat' | 'image_editor' | 'text_to_image' | 'image_to_video' | 'text_to_video' | 'text_or_image_to_video' | 'image_tool' | 'video_upscaler' | 'image_to_3d' | 'video_effect' | 'text_to_speech';
  description?: string;
  is_active: boolean;
  api_key?: string;
  base_url?: string;
  image?: string;
  logo?: string;
  base_cost?: number;
  created_at: string;
  updated_at: string;
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
}

export const modelsService = {
  async getModels(filters: ModelFilters = {}): Promise<AIModel[]> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.model_type) params.append('model_type', filters.model_type);
    if (filters.provider) params.append('provider', filters.provider);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    
    const response = await api.get<AIModel[] | ModelsResponse>(`/list/?${params.toString()}`);
    // Handle both array and paginated response
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  },

  async getModel(id: number): Promise<AIModel> {
    const response = await api.get<AIModel>(`/list/${id}/`);
    return response.data;
  },

  async createModel(data: Partial<AIModel>): Promise<AIModel> {
    const response = await api.post<AIModel>('/list/', data);
    return response.data;
  },

  async updateModel(id: number, data: Partial<AIModel>): Promise<AIModel> {
    const response = await api.patch<AIModel>(`/list/${id}/`, data);
    return response.data;
  },

  async deleteModel(id: number): Promise<void> {
    await api.delete(`/list/${id}/`);
  },

  async toggleModelStatus(id: number, isActive: boolean): Promise<AIModel> {
    const response = await api.patch<AIModel>(`/list/${id}/`, {
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
    // Calculate stats from models list
    const models = await this.getModels();
    const byType: Record<string, number> = {};
    const byProvider: Record<string, number> = {};
    
    models.forEach(model => {
      byType[model.model_type] = (byType[model.model_type] || 0) + 1;
      byProvider[model.provider] = (byProvider[model.provider] || 0) + 1;
    });
    
    return {
      total_models: models.length,
      active_models: models.filter(m => m.is_active).length,
      by_type: byType,
      by_provider: byProvider,
    };
  },

  async getProviders(): Promise<string[]> {
    const models = await this.getModels();
    return [...new Set(models.map(m => m.provider))];
  },
};

export default modelsService;
