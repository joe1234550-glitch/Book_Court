export type CourtType = 'HARD' | 'GRASS' | 'CLAY';

export type CourtStatus = 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE';

export interface Court {
  id: number;
  name: string;
  type: CourtType;
  status: CourtStatus;
  description: string;
  hourlyRate: number;
  createdAt: string;
  updatedAt: string;
}

export type CheckInStatus = 'PENDING' | 'CHECKED_IN' | 'LATE' | 'NO_SHOW';

export interface BookingResponse {
  id: number;
  userId: number;
  username: string;
  courtId: number;
  courtName: string;
  startTime: string;
  endTime: string;
  totalFee: number;
  status: string;
  checkedIn: boolean;
  checkInTime: string | null;
  checkInStatus: CheckInStatus;
  createdAt: string;
}

export interface CreateBookingRequest {
  courtId: number;
  startTime: string;
  endTime: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  enabled: boolean;
  roles: Role[];
  createdAt: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  username: string;
  roles: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
}
