import apiClient from './client';

export interface Task {
  id: number;
  title: string;
  status: 'New' | 'Pending' | 'InProgress' | 'OnReview' | 'ForRevision' | 'Approved' | 'Canceled';
  priority: string;
  scheduled_date: string;
  created_at: string;
  building_address: string;
  checklist_title: string;
  inspector_name: string;
}

export interface TaskDetail {
  id: number;
  title: string;
  status: 'New' | 'Pending' | 'InProgress' | 'OnReview' | 'ForRevision' | 'Approved' | 'Canceled';
  priority: string;
  description: string;
  scheduled_date: string;
  created_at: string;
  updated_at: string;
  building: {
    id: number;
    address: string;
  };
  checklist: {
    id: number;
    title: string;
    inspection_type: string;
  };
  inspector: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreateTaskRequest {
  building_id: number;
  checklist_id: number;
  inspector_id: number;
  title: string;
  priority?: 'срочный' | 'высокий' | 'обычный' | 'низкий';
  description?: string;
  scheduled_date: string; // ISO 8601
}

export interface UpdateTaskStatusRequest {
  status: 'Pending' | 'InProgress' | 'OnReview' | 'ForRevision' | 'Approved' | 'Canceled';
}

export interface AssignInspectorRequest {
  inspector_id: number;
}

export const tasksApi = {
  list: async (status?: string): Promise<Task[]> => {
    const url = status ? `/tasks?status=${status}` : '/tasks';
    const response = await apiClient.get<Task[]>(url);
    return response.data;
  },

  get: async (id: number): Promise<TaskDetail> => {
    // Проверяем роль пользователя для определения правильного endpoint
    const role = localStorage.getItem('user_role');
    
    // Для инспектора используем /inspector/tasks/:id
    if (role === 'inspector') {
      const response = await apiClient.get<TaskDetail>(`/inspector/tasks/${id}`);
      return response.data;
    }
    
    // Для координатора и специалиста используем /tasks/:id
    const response = await apiClient.get<TaskDetail>(`/tasks/${id}`);
    return response.data;
  },

  create: async (data: CreateTaskRequest): Promise<TaskDetail> => {
    const response = await apiClient.post<TaskDetail>('/tasks/', data);
    return response.data;
  },

  updateStatus: async (id: number, status: UpdateTaskStatusRequest): Promise<void> => {
    await apiClient.put(`/tasks/${id}/status`, status);
  },

  assignInspector: async (id: number, data: AssignInspectorRequest): Promise<void> => {
    await apiClient.put(`/tasks/${id}/assign`, data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },

  // Методы для инспектора
  listMyTasks: async (status?: string): Promise<Task[]> => {
    const url = status ? `/inspector/tasks?status=${status}` : '/inspector/tasks';
    const response = await apiClient.get<Task[]>(url);
    return response.data;
  },

  acceptTask: async (id: number): Promise<void> => {
    await apiClient.post(`/inspector/tasks/${id}/accept`);
  },

  submitTask: async (id: number): Promise<void> => {
    await apiClient.post(`/inspector/tasks/${id}/submit`);
  },
};

