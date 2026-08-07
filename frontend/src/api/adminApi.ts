import api from './client';
import { BookingResponse, RegisterRequest, User } from '../types';

export interface CreateBookingRequest {
  courtId: number;
  userId?: number;
  startTime: string; // 格式需為 YYYY-MM-DDTHH:mm:ss
  endTime: string;   // 格式需為 YYYY-MM-DDTHH:mm:ss
  note?: string;
}

export const adminApi = {
  // 注意：若後端 API 路徑沒有 /api 前綴，baseURL 的 '/api' 需與此處協調
  getAllBookings: () =>
    api.get<BookingResponse[]>('/v1/admin/bookings').then((res) => res.data),

  cancelBooking: (id: number) =>
    api.patch<void>(`/v1/admin/bookings/${id}/cancel`).then((res) => res.data),

  getAllUsers: () =>
    api.get<User[]>('/v1/admin/users').then((res) => res.data),

  createUser: (data: RegisterRequest) =>
    api.post<User>('/v1/admin/users', data).then((res) => res.data),

  updateUser: (id: number, data: Partial<User>) =>
    api.put<User>(`/v1/admin/users/${id}`, data).then((res) => res.data),

  getAllCourts: () =>
    api.get('/v1/admin/courts').then((res) => res.data),

  deleteCourt: (id: number) =>
    api.delete<void>(`/v1/admin/courts/${id}`).then((res) => res.data),

  createBooking: (data: CreateBookingRequest) =>
    api.post<BookingResponse>('/v1/admin/bookings', data).then((res) => res.data),

  updateBooking: (id: number, data: Partial<CreateBookingRequest>) =>
    api.put<BookingResponse>(`/v1/admin/bookings/${id}`, data).then((res) => res.data),
};
