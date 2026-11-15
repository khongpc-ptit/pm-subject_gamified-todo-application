import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 8000
});

// Request Interceptor: đính kèm Bearer JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('questline_jwt_token') || 'demo_token_sprint1';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: xử lý phản hồi lỗi chuẩn
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('[API Client] Phiên đăng nhập hết hạn hoặc chưa xác thực (401).');
    }
    return Promise.reject(error);
  }
);
