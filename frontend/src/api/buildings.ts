import apiClient from './client';

export interface Building {
  id: number;
  address: string;
  construction_year: number;
  description: string;
  photo_path: string;
  district_name: string;
  jkh_unit_name: string;
  inspector_name?: string;
}

export interface CreateBuildingRequest {
  address: string;
  construction_year: number;
  description?: string;
  photo_path?: string;
  district_id: number;
  jkh_unit_id: number;
  inspector_id?: number;
}

export const buildingsApi = {
  list: async (): Promise<Building[]> => {
    // Проверяем роль пользователя для определения правильного endpoint
    const role = localStorage.getItem('user_role');
    
    // Для координатора используем /tasks/buildings
    if (role === 'coordinator') {
      try {
        const response = await apiClient.get<Building[]>('/tasks/buildings');
        return response.data;
      } catch (err: any) {
        console.error('Error loading buildings for coordinator:', err);
        throw err;
      }
    }
    
    // Для специалиста используем /admin/buildings
    const response = await apiClient.get<Building[]>('/admin/buildings');
    return response.data;
  },

  get: async (id: number): Promise<Building> => {
    const response = await apiClient.get<Building>(`/admin/buildings/${id}`);
    return response.data;
  },

  create: async (data: CreateBuildingRequest): Promise<Building> => {
    const response = await apiClient.post<Building>('/admin/buildings', data);
    return response.data;
  },

  update: async (id: number, data: CreateBuildingRequest): Promise<Building> => {
    const response = await apiClient.put<Building>(`/admin/buildings/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/buildings/${id}`);
  },
};

