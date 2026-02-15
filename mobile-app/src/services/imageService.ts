import api, { getErrorMessage } from './api';
import { ENDPOINTS } from './config';
import { 
  ImageSession, 
  PaginatedResponse,
  GeneratedImage 
} from './types';

export const imageService = {
  // Get all image sessions for current user
  async getSessions(): Promise<PaginatedResponse<ImageSession>> {
    try {
      const response = await api.get(ENDPOINTS.IMAGE_SESSIONS);
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

  // Get single image session
  async getSession(sessionId: number): Promise<ImageSession> {
    try {
      const response = await api.get(`${ENDPOINTS.IMAGE_SESSIONS}${sessionId}/`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Create new image generation session
  async createSession(modelId: number): Promise<ImageSession> {
    try {
      const response = await api.post(ENDPOINTS.IMAGE_SESSIONS, {
        model_id: modelId,
        session_type: 'image',
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Get generated images for a session
  async getGeneratedImages(sessionId: number): Promise<GeneratedImage[]> {
    try {
      const response = await api.get(`${ENDPOINTS.IMAGE_SESSIONS}${sessionId}/images/`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Delete image session
  async deleteSession(sessionId: number): Promise<void> {
    try {
      await api.delete(`${ENDPOINTS.IMAGE_SESSIONS}${sessionId}/`);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Image to 3D conversion
  async imageToModel(imageUrl: string, modelId: number): Promise<any> {
    try {
      const response = await api.post(ENDPOINTS.IMAGE_TO_3D, {
        image_url: imageUrl,
        model_id: modelId,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Image upscaling
  async upscaleImage(imageUrl: string, scale: number = 2): Promise<any> {
    try {
      const response = await api.post(ENDPOINTS.IMAGE_UPSCALER, {
        image_url: imageUrl,
        scale,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Image editing
  async editImage(imageUrl: string, prompt: string, modelId: number): Promise<any> {
    try {
      const response = await api.post(ENDPOINTS.IMAGE_EDIT, {
        image_url: imageUrl,
        prompt,
        model_id: modelId,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

export default imageService;
