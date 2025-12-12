import apiClient from './client';

export interface Checklist {
  id: number;
  title: string;
  inspection_type: string;
  description: string;
  created_at: string;
}

export interface ChecklistElementDetail {
  checklist_element_id: number; // ID ChecklistElement (нужно для создания InspectionResult)
  element_id: number;
  element_name: string;
  category: string;
  order_index: number;
}

export interface ChecklistDetail extends Checklist {
  elements: ChecklistElementDetail[];
}

export interface CreateChecklistRequest {
  title: string;
  inspection_type: 'spring' | 'winter' | 'partial';
  description?: string;
}

export interface AddElementToChecklistRequest {
  element_id: number;
  order_index?: number;
}

export interface UpdateElementOrderRequest {
  order_index: number;
}

export const checklistsApi = {
  list: async (): Promise<Checklist[]> => {
    // Проверяем роль пользователя для определения правильного endpoint
    const role = localStorage.getItem('user_role');
    
    // Для координатора используем /tasks/checklists
    if (role === 'coordinator') {
      try {
        const response = await apiClient.get<Checklist[]>('/tasks/checklists');
        return response.data;
      } catch (err: any) {
        console.error('Error loading checklists for coordinator:', err);
        throw err;
      }
    }
    
    // Для специалиста используем /admin/checklists
    const response = await apiClient.get<Checklist[]>('/admin/checklists');
    return response.data;
  },

  get: async (id: number): Promise<ChecklistDetail> => {
    // Пробуем сначала для инспектора, потом для специалиста
    const role = localStorage.getItem('user_role');
    if (role === 'inspector') {
      try {
        const response = await apiClient.get<ChecklistDetail>(`/inspector/checklists/${id}`);
        return response.data;
      } catch (err: any) {
        // Если не получилось, пробуем обычный endpoint
        const response = await apiClient.get<ChecklistDetail>(`/admin/checklists/${id}`);
        return response.data;
      }
    }
    const response = await apiClient.get<ChecklistDetail>(`/admin/checklists/${id}`);
    return response.data;
  },

  create: async (data: CreateChecklistRequest): Promise<Checklist> => {
    const response = await apiClient.post<Checklist>('/admin/checklists', data);
    return response.data;
  },

  update: async (id: number, data: CreateChecklistRequest): Promise<Checklist> => {
    const response = await apiClient.put<Checklist>(`/admin/checklists/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    try {
      const response = await apiClient.delete(`/admin/checklists/${id}`);
      // 204 No Content - это успех, axios может вернуть response с status 204
      if (response.status === 204 || response.status === 200) {
        return;
      }
      throw new Error(`Unexpected status: ${response.status}`);
    } catch (error: any) {
      // Пробрасываем ошибку с контекстом
      if (error.response) {
        throw error; // Axios error с response.data
      }
      throw new Error(`Network error: ${error.message}`);
    }
  },

  addElement: async (checklistId: number, data: AddElementToChecklistRequest): Promise<void> => {
    await apiClient.post(`/admin/checklists/${checklistId}/elements`, data);
  },

  removeElement: async (checklistId: number, elementId: number): Promise<void> => {
    try {
      const response = await apiClient.delete(`/admin/checklists/${checklistId}/elements/${elementId}`);
      // 204 No Content - это успех
      if (response.status === 204 || response.status === 200) {
        return;
      }
      throw new Error(`Unexpected status: ${response.status}`);
    } catch (error: any) {
      // Пробрасываем ошибку с контекстом
      if (error.response) {
        throw error; // Axios error с response.data
      }
      throw new Error(`Network error: ${error.message}`);
    }
  },

  updateElementOrder: async (
    checklistId: number,
    elementId: number,
    data: UpdateElementOrderRequest
  ): Promise<void> => {
    await apiClient.put(`/admin/checklists/${checklistId}/elements/${elementId}`, data);
  },
};

