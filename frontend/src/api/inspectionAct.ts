import apiClient from './client';

export const inspectionActApi = {
  downloadAct: async (taskId: number): Promise<Blob> => {
    // Проверяем роль пользователя для определения правильного endpoint
    const role = localStorage.getItem('user_role');
    
    // Для координатора используем /tasks/:id/act
    if (role === 'coordinator') {
      const response = await apiClient.get(`/tasks/${taskId}/act`, {
        responseType: 'blob',
      });
      return response.data;
    }
    
    // Для инспектора используем /inspector/tasks/:id/act
    const response = await apiClient.get(`/inspector/tasks/${taskId}/act`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

