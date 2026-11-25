import { apiClient } from './api';
import type { ApiResponse } from '../types/task.types';

export interface FreezeStreakResponseData {
  streak_freeze_count: number;
  current_streak: number;
  is_protected?: boolean;
  frozen_date?: string;
  message?: string;
}

export const gamificationService = {
  /**
   * [US-S3-02 / TECH-S3-03] Chủ động kích hoạt đóng băng chuỗi ngày (Streak Freeze)
   * POST /api/v1/gamification/freeze-streak
   */
  async freezeStreak(): Promise<FreezeStreakResponseData> {
    const response = await apiClient.post<ApiResponse<FreezeStreakResponseData>>(
      '/gamification/freeze-streak'
    );
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(
      response.data?.error?.message ||
        response.data?.message ||
        'Không thể kích hoạt đóng băng chuỗi lúc này'
    );
  }
};

export default gamificationService;
