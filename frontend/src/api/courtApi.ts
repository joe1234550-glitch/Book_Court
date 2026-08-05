import api from './client';
import { Court, CourtStatus } from '../types';

export const courtApi = {
  getAvailableCourts: () =>
    api.get<Court[]>('/v1/courts').then((res) => res.data),

  getCourtById: (id: number) =>
    api.get<Court>(`/v1/courts/${id}`).then((res) => res.data),

  createCourt: (court: Omit<Court, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<Court>('/v1/courts', court).then((res) => res.data),

  updateCourtStatus: (id: number, status: CourtStatus) =>
    api.patch<Court>(`/v1/courts/${id}/status`, null, {
      params: { status },
    }).then((res) => res.data),
};
