import apiClient from './client';
import { User } from '../types/api';

export interface AssignInspectorRequest {
  inspector_id: number;
}

export const inspectorUnitsApi = {
  // Получить инспекторов для конкретного здания (для координатора)
  getInspectorsForBuilding: async (buildingId: number): Promise<User[]> => {
    const response = await apiClient.get<User[]>(`/tasks/buildings/${buildingId}/inspectors`);
    return response.data;
  },

  // Получить инспекторов для ЖЭУ (для специалиста)
  listInspectorsForUnit: async (jkhUnitId: number): Promise<User[]> => {
    const response = await apiClient.get<User[]>(`/admin/jkhunits/${jkhUnitId}/inspectors`);
    return response.data;
  },

  // Назначить инспектора на ЖЭУ
  assignInspector: async (jkhUnitId: number, inspectorId: number): Promise<void> => {
    await apiClient.post(`/admin/jkhunits/${jkhUnitId}/inspectors`, {
      inspector_id: inspectorId,
    });
  },

  // Открепить инспектора от ЖЭУ
  unassignInspector: async (jkhUnitId: number, inspectorId: number): Promise<void> => {
    await apiClient.delete(`/admin/jkhunits/${jkhUnitId}/inspectors/${inspectorId}`);
  },
};

