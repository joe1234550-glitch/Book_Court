import dayjs from 'dayjs';
import { CourtType, CourtStatus, CheckInStatus } from '../types';

export const courtTypeLabels: Record<CourtType, string> = {
  HARD: '硬地',
  GRASS: '草地',
  CLAY: '紅土',
};

export const courtStatusLabels: Record<CourtStatus, string> = {
  AVAILABLE: '開放中',
  BOOKED: '已預約',
  MAINTENANCE: '維修中',
};

export const courtStatusColors: Record<CourtStatus, string> = {
  AVAILABLE: 'green',
  BOOKED: 'orange',
  MAINTENANCE: 'red',
};

export const checkInStatusLabels: Record<CheckInStatus, string> = {
  PENDING: '待報到',
  CHECKED_IN: '已報到',
  LATE: '遲到',
  NO_SHOW: '未到場',
};

export const checkInStatusColors: Record<CheckInStatus, string> = {
  PENDING: 'gold',
  CHECKED_IN: 'green',
  LATE: 'orange',
  NO_SHOW: 'red',
};

export const bookingStatusLabels: Record<string, string> = {
  PENDING: '待確認',
  CONFIRMED: '已確認',
  CANCELLED: '已取消',
};

export const bookingStatusColors: Record<string, string> = {
  PENDING: 'gold',
  CONFIRMED: 'green',
  CANCELLED: 'red',
};

export const formatDateTime = (dateStr: string) =>
  dayjs(dateStr).format('YYYY-MM-DD HH:mm');

export const formatDate = (dateStr: string) =>
  dayjs(dateStr).format('YYYY-MM-DD');

export const formatTime = (dateStr: string) =>
  dayjs(dateStr).format('HH:mm');

export const calculateDuration = (start: string, end: string) => {
  const duration = dayjs(end).diff(dayjs(start), 'minute');
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  return mins > 0 ? `${hours}小時${mins}分鐘` : `${hours}小時`;
};
