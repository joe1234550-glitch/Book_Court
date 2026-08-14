import client from './client';
import { Court, CourtType, CourtStatus } from '../types';

export const courtApi = {
  // 取得開放中的球場列表
  getAvailableCourts: async (): Promise<Court[]> => {
    const res = await client.get('/v1/courts');
    return res.data?.data ?? res.data;
  },

};
