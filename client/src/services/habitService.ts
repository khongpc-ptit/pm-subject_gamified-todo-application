import { apiClient } from './api';
import type { ApiResponse } from '../types/task.types';
import type {
  Habit,
  HabitListResponseData,
  CreateHabitRequestDTO,
  UpdateHabitRequestDTO,
  CheckInHabitResponseData
} from '../types/habit.types';

// Dữ liệu mẫu ban đầu theo wireframe Core MVP Screens.html cho chế độ offline/demo
export const INITIAL_MOCK_HABITS: Habit[] = [
  {
    _id: 'mock-habit-1',
    user_id: 'user-demo-1',
    title: 'Uống đủ 2 lít nước',
    frequency: 'DAILY',
    target_days: 7,
    current_streak: 6,
    is_active: true,
    logs: [
      { log_date: '2026-11-18', is_completed: true, xp_earned: 15 },
      { log_date: '2026-11-19', is_completed: true, xp_earned: 15 },
      { log_date: '2026-11-20', is_completed: true, xp_earned: 15 },
      { log_date: '2026-11-21', is_completed: true, xp_earned: 15 },
      { log_date: '2026-11-22', is_completed: true, xp_earned: 15 },
      { log_date: '2026-11-23', is_completed: true, xp_earned: 15 }
    ],
    created_at: '2026-11-15T08:00:00.000Z'
  },
  {
    _id: 'mock-habit-2',
    user_id: 'user-demo-1',
    title: 'Đọc sách 30 phút mỗi ngày',
    frequency: 'DAILY',
    target_days: 7,
    current_streak: 4,
    is_active: true,
    logs: [
      { log_date: '2026-11-20', is_completed: true, xp_earned: 15 },
      { log_date: '2026-11-21', is_completed: true, xp_earned: 15 },
      { log_date: '2026-11-22', is_completed: true, xp_earned: 15 },
      { log_date: '2026-11-23', is_completed: true, xp_earned: 15 }
    ],
    created_at: '2026-11-16T09:00:00.000Z'
  },
  {
    _id: 'mock-habit-3',
    user_id: 'user-demo-1',
    title: 'Chạy bộ thể dục',
    frequency: 'WEEKLY',
    target_days: 3,
    current_streak: 2,
    is_active: true,
    logs: [
      { log_date: '2026-11-21', is_completed: true, xp_earned: 15 },
      { log_date: '2026-11-23', is_completed: true, xp_earned: 15 }
    ],
    created_at: '2026-11-17T07:00:00.000Z'
  }
];

export const habitService = {
  /**
   * Lấy danh sách thói quen active
   * GET /api/v1/habits
   */
  async getHabits(): Promise<Habit[]> {
    try {
      const response = await apiClient.get<ApiResponse<HabitListResponseData>>('/habits');
      if (response.data && response.data.success && response.data.data) {
        return response.data.data.habits || [];
      }
      throw new Error(response.data?.message || 'Không thể lấy danh sách thói quen');
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        console.warn('[HabitService] Backend chưa bật, dùng dữ liệu mẫu offline');
      }
      throw err;
    }
  },

  /**
   * Tạo thói quen mới
   * POST /api/v1/habits
   */
  async createHabit(data: CreateHabitRequestDTO): Promise<Habit> {
    const response = await apiClient.post<ApiResponse<Habit>>('/habits', data);
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || response.data?.error?.message || 'Không thể tạo thói quen');
  },

  /**
   * Cập nhật thói quen
   * PUT /api/v1/habits/:id
   */
  async updateHabit(id: string, data: UpdateHabitRequestDTO): Promise<Habit> {
    const response = await apiClient.put<ApiResponse<Habit>>(`/habits/${id}`, data);
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || response.data?.error?.message || 'Không thể cập nhật thói quen');
  },

  /**
   * Xóa / Hủy theo dõi thói quen
   * DELETE /api/v1/habits/:id
   */
  async deleteHabit(id: string): Promise<{ id: string }> {
    const response = await apiClient.delete<ApiResponse<{ id: string }>>(`/habits/${id}`);
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || response.data?.error?.message || 'Không thể xóa thói quen');
  },

  /**
   * Check-in điểm danh thói quen
   * POST /api/v1/habits/:id/check-in
   */
  async checkInHabit(id: string): Promise<CheckInHabitResponseData> {
    const response = await apiClient.post<ApiResponse<CheckInHabitResponseData>>(`/habits/${id}/check-in`);
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || response.data?.error?.message || 'Không thể check-in thói quen');
  }
};
