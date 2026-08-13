import axios from 'axios';

const API_BASE = 'http://localhost:8080';

// 🎯 修正 Token 抓取邏輯：解析 Zustand/Redux Persist 的 auth-storage 物件
const getAuthHeaders = () => {
  let token = '';

  // 1. 優先解析 Zustand 儲存的 auth-storage
  const authStorageStr = localStorage.getItem('auth-storage');
  if (authStorageStr) {
    try {
      const authStorage = JSON.parse(authStorageStr);
      token = authStorage?.state?.accessToken || authStorage?.state?.token || '';
    } catch (e) {
      console.error('❌ [前端 Error] 解析 auth-storage 失敗：', e);
    }
  }

  // 2. 備用方案：如果上面沒抓到，再嘗試抓單一 Key
  if (!token) {
    token =
      localStorage.getItem('token') ||
      localStorage.getItem('adminToken') ||
      localStorage.getItem('accessToken') ||
      '';
  }

  if (!token) {
    console.warn('⚠️ [前端 Warning] 依然無法抓取到有效的 Token！');
  } else {
    console.log('🔑 [前端 Log] 成功解析出 Token：', token.substring(0, 15) + '...');
  }

  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

export const adminFinancialReportApi = {
  getFinancialReport: async (startDate?: string, endDate?: string, paymentFilter?: string) => {
    const params: Record<string, any> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (paymentFilter && paymentFilter !== 'ALL') {
      params.paymentMethod = paymentFilter;
    }

    const url = `${API_BASE}/api/v1/admin/financial/financial-report`;

    const response = await axios.get(url, {
      ...getAuthHeaders(),
      params,
    });

    return response.data;
  },
};
