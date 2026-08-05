import api from './client';
import { BookingResponse, CreateBookingRequest } from '../types';

export const bookingApi = {
  createBooking: (data: CreateBookingRequest) =>
    api.post<BookingResponse>('/v1/bookings', data).then((res) => res.data),

  getMyBookings: () =>
    api.get<BookingResponse[]>('/v1/bookings/my').then((res) => res.data),

  getCourtBookingsByDate: (courtId: number, date: string) =>
    api.get<BookingResponse[]>(`/v1/bookings/court/${courtId}`, {
      params: { date },
    }).then((res) => res.data),

  checkInBooking: (id: number) =>
    api.patch<BookingResponse>(`/v1/bookings/${id}/check-in`).then((res) => res.data),

  cancelBooking: (id: number) =>
    api.patch<void>(`/v1/bookings/${id}/cancel`).then((res) => res.data),
};
