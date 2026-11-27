import { apiClient } from './api';
import type { ApiResponse } from '../types/task.types';
import type { DashboardSummaryData } from '../types/dashboard.types';

export const dashboardService = {
  /**
   * [US-S4-01, US-S4-02 / TECH-S4-03] Lấy dữ liệu thống kê tổng quan Dashboard & hoạt động 7 ngày
   * GET /api/v1/dashboard/summary
   */
  async getDashboardSummary(): Promise<DashboardSummaryData> {
    const response = await apiClient.get<ApiResponse<DashboardSummaryData>>('/dashboard/summary');
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(
      response.data?.error?.message ||
        response.data?.message ||
        'Không thể tải dữ liệu thống kê Dashboard'
    );
  }
};

export default dashboardService;
