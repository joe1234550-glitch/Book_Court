import client from './client';
import { Court, CourtStatus, CourtType } from '../types';

export const adminCourtApi = {
  // [後台] 取得所有球場 (包含維修中、已關閉)
  getAllCourts: async (): Promise<Court[]> => {
    const res = await client.get('/v1/admin/courts');
    return res.data?.data ?? res.data ?? [];
  },

  // [後台] 新增球場
  createCourt: async (data: {
    name: string;
    type: CourtType;
    status: CourtStatus;
    description: string;
    hourlyRate: number;
  }): Promise<Court> => {
    const res = await client.post('/v1/admin/courts', data);
    return res.data?.data ?? res.data;
  },

  // [後台] 更新球場狀態 (透過 Request Parameter 傳送 status)
  updateCourtStatus: async (id: number, status: CourtStatus): Promise<Court> => {
    const res = await client.patch(`/v1/admin/courts/${id}/status`, null, {
      params: { status },
    });
    return res.data?.data ?? res.data;
  },

  // [後台] 刪除球場
  deleteCourt: async (id: number): Promise<void> => {
    await client.delete(`/v1/admin/courts/${id}`);
  },
};
