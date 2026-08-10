// src/api/adminApi.ts
import client from './client'; // 使用您原本專案既有的 client

export const adminApi = {
  // 取得所有使用者
  getAllUsers: async () => {
    const res = await client.get('/v1/admin/users');
    return res.data?.data ?? res.data;
  },
  // 新增使用者
  createUser: async (payload: any) => {
    const res = await client.post('/v1/admin/users', payload);
    return res.data?.data ?? res.data;
  },
  // 更新使用者
  updateUser: async (id: number, payload: any) => {
    const res = await client.put(`/v1/admin/users/${id}`, payload);
    return res.data?.data ?? res.data;
  },
  // 取得所有預約紀錄
  getAllBookings: async () => {
    const res = await client.get('/v1/admin/bookings');
    return res.data?.data ?? res.data;
  },
  // 取消預約
  cancelBooking: async (id: number) => {
    const res = await client.post(`/v1/admin/bookings/${id}/cancel`);
    return res.data?.data ?? res.data;
  },
  // 退費
  refundBooking: async (id: number) => {
    const res = await client.post(`/v1/admin/bookings/${id}/refund`);
    return res.data?.data ?? res.data;
  },
  // 更新預約
  updateBooking: async (id: number, payload: any) => {
    const res = await client.put(`/v1/admin/bookings/${id}`, payload);
    return res.data?.data ?? res.data;
  },
  // 建立預約
  createBooking: async (payload: any) => {
    const res = await client.post('/v1/admin/bookings', payload);
    return res.data?.data ?? res.data;
  },
// 🎯 補上結帳 API (請確認後端 endpoint 是否為 /v1/admin/bookings/{id}/checkout)
  checkoutBooking: async (id: number, payload: { amount: number; paymentMethod: string; invoiceType: string }) => {
    const res = await client.post(`/v1/admin/bookings/${id}/checkout`, payload);
    return res.data?.data ?? res.data;
  },
};
