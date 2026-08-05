import api from './client';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data).then((res) => res.data),

  register: (data: RegisterRequest) =>
    api.post<string>('/auth/register', data).then((res) => res.data),

  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }).then((res) => res.data),

  logout: (refreshToken: string) =>
    api.post<string>('/auth/logout', { refreshToken }).then((res) => res.data),
};
