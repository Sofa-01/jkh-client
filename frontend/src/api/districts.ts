import apiClient from './client';

export interface District {
  id: number;
  name: string;
}

export interface CreateDistrictRequest {
  name: string;
}

export const districtsApi = {
  list: async (): Promise<District[]> => {
    const response = await apiClient.get<District[]>('/admin/districts');
    return response.data;
  },

  get: async (id: number): Promise<District> => {
    const response = await apiClient.get<District>(`/admin/districts/${id}`);
    return response.data;
  },

  create: async (data: CreateDistrictRequest): Promise<District> => {
    const response = await apiClient.post<District>('/admin/districts', data);
    return response.data;
  },

  update: async (id: number, data: CreateDistrictRequest): Promise<District> => {
    const response = await apiClient.put<District>(`/admin/districts/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/districts/${id}`);
  },
};

