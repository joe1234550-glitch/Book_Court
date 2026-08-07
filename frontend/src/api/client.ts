import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // 關鍵：讓 Axios 跨域或同源請求時能帶上 HttpOnly Cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 避免重試本身發出的 refresh 請求造成死迴圈
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      const state = useAuthStore.getState();
      const storedRefresh = state.refreshToken;

      // 1. 優先嘗試 Cookie 刷新 (Admin 流程)
      try {
        const resp = await axios.get('/api/auth/refresh/cookie', { withCredentials: true });
        const { accessToken, refreshToken: newRefreshToken, userId, username, roles } = resp.data;

        state.login({
          accessToken,
          refreshToken: newRefreshToken || storedRefresh,
          userId,
          username,
          roles,
        });

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (cookieErr) {
        // 2. Cookie 失敗，降級使用 Header/Body refresh token
        if (storedRefresh) {
          try {
            const response = await axios.post('/api/auth/refresh', { refreshToken: storedRefresh });
            const { accessToken, refreshToken: newRefreshToken } = response.data;

            state.setTokens(accessToken, newRefreshToken || storedRefresh);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          } catch (refreshErr) {
            state.logout();
            window.location.href = '/login'; // 強制導回登入頁
            return Promise.reject(refreshErr);
          }
        } else {
          state.logout();
          window.location.href = '/login';
          return Promise.reject(cookieErr);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
