// API Types

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  role: string;
}

export interface User {
  id: number;
  email: string;
  login: string;
  first_name: string;
  last_name: string;
  role_name: string;
}

export interface ApiError {
  error: string;
}

// Re-export для удобства
export type { User as UserResponse } from '../api/users';

