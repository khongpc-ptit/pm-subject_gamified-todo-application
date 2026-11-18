import { apiClient } from './api';
import type { ApiResponse } from '../types/task.types';
import type { RegisterRequestDTO, AuthResponseData, UserProfile } from '../types/auth.types';

export const authService = {
  /**
   * [US-S1-05 / TECH-S1-08] Đăng ký tài khoản người dùng
   * POST /api/v1/auth/register
   */
  async register(data: RegisterRequestDTO): Promise<AuthResponseData> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/register', data);
      if (response.data && response.data.success && response.data.data) {
        const authData = response.data.data;
        // Lưu token và thông tin người dùng vào LocalStorage
        localStorage.setItem('questline_jwt_token', authData.token);
        localStorage.setItem('questline_user', JSON.stringify(authData.user));
        return authData;
      }
      throw new Error(response.data?.message || 'Đăng ký tài khoản thất bại.');
    } catch (err: any) {
      if (err.response?.data?.error) {
        const serverError = new Error(err.response.data.error.message || 'Lỗi đăng ký') as any;
        serverError.code = err.response.data.error.code;
        serverError.status = err.response.status;
        throw serverError;
      }
      throw err;
    }
  },

  /**
   * Lấy thông tin người dùng đã lưu trong LocalStorage
   */
  getStoredUser(): UserProfile | null {
    try {
      const stored = localStorage.getItem('questline_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /**
   * Đăng xuất xóa phiên làm việc
   */
  logout(): void {
    localStorage.removeItem('questline_jwt_token');
    localStorage.removeItem('questline_user');
  }
};

export default authService;
