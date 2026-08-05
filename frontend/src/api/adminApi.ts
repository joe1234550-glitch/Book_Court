import api from './client';
import { BookingResponse, RegisterRequest, User } from '../types';

export const adminApi = {
  getAllBookings: () =>
    api.get<BookingResponse[]>('/v1/admin/bookings').then((res) => res.data),

  cancelBooking: (id: number) =>
    api.patch<void>(`/v1/admin/bookings/${id}/cancel`).then((res) => res.data),

  getAllUsers: () => api.get<User[]>('/v1/admin/users').then((res) => res.data),

  createUser: (data: RegisterRequest) =>
    api.post<User>('/v1/admin/users', data).then((res) => res.data),
};
