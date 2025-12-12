import apiClient from './client';

export interface InspectionResult {
  task_id: number;
  checklist_element_id: number;
  element_name: string;
  element_category: string;
  order_index: number;
  condition_status: 'Исправное' | 'Удовлетворительное' | 'Неудовлетворительное' | 'Аварийное';
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface TaskResultsSummary {
  task_id: number;
  task_title: string;
  total_elements: number;
  completed_elements: number;
  results: InspectionResult[];
}

export interface CreateInspectionResultRequest {
  checklist_element_id: number;
  condition_status: 'Исправное' | 'Удовлетворительное' | 'Неудовлетворительное' | 'Аварийное';
  comment?: string;
}

export const inspectionResultsApi = {
  getTaskResults: async (taskId: number): Promise<TaskResultsSummary> => {
    // Проверяем роль пользователя для определения правильного endpoint
    const role = localStorage.getItem('user_role');
    
    // Для координатора используем /tasks/:id/results
    if (role === 'coordinator') {
      const response = await apiClient.get<TaskResultsSummary>(`/tasks/${taskId}/results`);
      return response.data;
    }
    
    // Для инспектора используем /inspector/tasks/:id/results
    const response = await apiClient.get<TaskResultsSummary>(`/inspector/tasks/${taskId}/results`);
    return response.data;
  },

  createOrUpdateResult: async (
    taskId: number,
    data: CreateInspectionResultRequest
  ): Promise<InspectionResult> => {
    const response = await apiClient.post<InspectionResult>(`/inspector/tasks/${taskId}/results`, data);
    return response.data;
  },

  deleteResult: async (taskId: number, elementId: number): Promise<void> => {
    await apiClient.delete(`/inspector/tasks/${taskId}/results/${elementId}`);
  },
};

