import { apiClient } from './api';
import type { ApiResponse } from '../types/task.types';

export interface Badge {
  _id: string;
  code: string;
  title: string;
  description: string;
  icon_url: string;
  condition_type: 'TASK_COUNT' | 'STREAK_DAYS' | 'LEVEL_REACH';
  condition_value: number;
  current_progress: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
}

export const badgeService = {
  async list(signal?: AbortSignal): Promise<Badge[]> {
    const { data } = await apiClient.get<ApiResponse<Badge[]>>('/gamification/badges', { signal });
    if (!data.success || !Array.isArray(data.data)) throw new Error('Không thể tải huy hiệu');
    return data.data;
  }
};
