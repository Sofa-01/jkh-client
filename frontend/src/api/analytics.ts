import apiClient from './client';

export type ChartType = 'inspector_performance' | 'status_distribution' | 'failure_frequency';

export interface AnalyticsReportRequest {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  charts?: ChartType[];
  jkh_unit_ids?: number[];
  district_ids?: number[];
}

export const analyticsApi = {
  // Предпросмотр графика (возвращает PNG изображение как blob)
  previewChart: async (
    chart: ChartType,
    from: string,
    to: string
  ): Promise<Blob> => {
    const response = await apiClient.get(`/tasks/analytics/preview`, {
      params: {
        chart,
        from,
        to,
      },
      responseType: 'blob', // Важно для получения изображения
    });
    return response.data;
  },

  // Генерация PDF отчета
  generateReport: async (request: AnalyticsReportRequest): Promise<Blob> => {
    const response = await apiClient.post(`/tasks/analytics/report`, request, {
      responseType: 'blob', // Важно для получения PDF
    });
    return response.data;
  },
};

