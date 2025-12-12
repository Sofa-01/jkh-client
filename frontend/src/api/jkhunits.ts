import apiClient from './client';

export interface JkhUnit {
  id: number;
  name: string;
  district_id: number;
  district_name: string;
}

export interface CreateJkhUnitRequest {
  name: string;
  district_id: number;
}

export const jkhUnitsApi = {
  list: async (): Promise<JkhUnit[]> => {
    const response = await apiClient.get<JkhUnit[]>('/admin/jkhunits');
    return response.data;
  },

  get: async (id: number): Promise<JkhUnit> => {
    const response = await apiClient.get<JkhUnit>(`/admin/jkhunits/${id}`);
    return response.data;
  },

  create: async (data: CreateJkhUnitRequest): Promise<JkhUnit> => {
    const response = await apiClient.post<JkhUnit>('/admin/jkhunits', data);
    return response.data;
  },

  update: async (id: number, data: CreateJkhUnitRequest): Promise<JkhUnit> => {
    const response = await apiClient.put<JkhUnit>(`/admin/jkhunits/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/jkhunits/${id}`);
  },
};

