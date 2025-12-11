import apiClient from './client';
import { User } from '../types/api';

export interface CreateUserRequest {
  email: string;
  login: string;
  password: string;
  first_name: string;
  last_name: string;
  role_name: 'Coordinator' | 'Inspector';
}

export interface UpdateUserRequest {
  email?: string;
  login?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  role_name?: 'Coordinator' | 'Inspector';
}

export const usersApi = {
  list: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/admin/users');
    return response.data;
  },

  get: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(`/admin/users/${id}`);
    return response.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<User>('/admin/users', data);
    return response.data;
  },

  update: async (id: number, data: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.put<User>(`/admin/users/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`);
  },
};

