import api from './client';
import { User, UpdateUserRequest } from '../types';

export const userApi = {
  getUserById: (id: number) =>
    api.get<User>(`/v1/users/${id}`).then((res) => res.data),

  updateUser: (id: number, data: UpdateUserRequest) =>
    api.put<User>(`/v1/users/${id}`, data).then((res) => res.data),

  deleteUser: (id: number) =>
    api.delete<void>(`/v1/users/${id}`).then((res) => res.data),
};
