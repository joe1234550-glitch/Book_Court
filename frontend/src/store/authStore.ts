import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: number | null;
  username: string | null;
  roles: string[];
  isAuthenticated: boolean;

  login: (data: {
    accessToken: string;
    refreshToken: string;
    userId: number;
    username: string;
    roles: string[];
  }) => void;

  setTokens: (accessToken: string, refreshToken: string) => void;

  logout: () => void;

  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      username: null,
      roles: [],
      isAuthenticated: false,

      login: (data) => set({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        userId: data.userId,
        username: data.username,
        roles: data.roles || [],
        isAuthenticated: true,
      }),

      setTokens: (accessToken, refreshToken) => set({
        accessToken,
        refreshToken,
      }),

      logout: () => set({
        accessToken: null,
        refreshToken: null,
        userId: null,
        username: null,
        roles: [],
        isAuthenticated: false,
      }),

      // 修正：同時檢查 ROLE_ADMIN 與 ADMIN，避免後端字串格式不一致
      isAdmin: () => {
        const roles = get().roles || [];
        return roles.includes('ROLE_ADMIN') || roles.includes('ADMIN');
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
