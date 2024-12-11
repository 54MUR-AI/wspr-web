import axios from 'axios';
import { API_BASE_URL } from '../config';

interface SearchParams {
  term?: string;
  type?: string;
  filters?: string[];
  page?: number;
  limit?: number;
}

class MediaService {
  private baseUrl = `${API_BASE_URL}/media`;

  async uploadMedia(file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${this.baseUrl}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  getMediaUrl(mediaId: string) {
    return `${this.baseUrl}/view/${mediaId}`;
  }

  getThumbnailUrl(mediaId: string) {
    return `${this.baseUrl}/thumbnail/${mediaId}`;
  }

  async deleteMedia(mediaId: string) {
    await axios.delete(`${this.baseUrl}/${mediaId}`);
  }

  async searchMedia({
    term = '',
    type,
    filters = [],
    page = 1,
    limit = 20,
  }: SearchParams = {}) {
    const params = new URLSearchParams({
      term,
      page: page.toString(),
      limit: limit.toString(),
    });

    if (type) {
      params.append('type', type);
    }

    filters.forEach(filter => {
      params.append('filters[]', filter);
    });

    const response = await axios.get(`${this.baseUrl}/search`, { params });
    return response.data;
  }

  async getMediaMetadata(mediaId: string) {
    const response = await axios.get(`${this.baseUrl}/metadata/${mediaId}`);
    return response.data;
  }

  async updateMediaMetadata(mediaId: string, metadata: Record<string, any>) {
    const response = await axios.patch(`${this.baseUrl}/metadata/${mediaId}`, metadata);
    return response.data;
  }
}

export const mediaService = new MediaService();
