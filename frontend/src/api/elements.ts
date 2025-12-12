import apiClient from './client';

export interface Element {
  id: number;
  name: string;
  category: string;
}

export interface CreateElementRequest {
  name: string;
  category?: string;
}

export const elementsApi = {
  list: async (): Promise<Element[]> => {
    const response = await apiClient.get<Element[]>('/admin/elements');
    return response.data;
  },

  get: async (id: number): Promise<Element> => {
    const response = await apiClient.get<Element>(`/admin/elements/${id}`);
    return response.data;
  },

  create: async (data: CreateElementRequest): Promise<Element> => {
    const response = await apiClient.post<Element>('/admin/elements', data);
    return response.data;
  },

  update: async (id: number, data: CreateElementRequest): Promise<Element> => {
    const response = await apiClient.put<Element>(`/admin/elements/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/elements/${id}`);
  },
};

