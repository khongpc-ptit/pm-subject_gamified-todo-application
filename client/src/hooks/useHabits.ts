import { useState, useEffect, useCallback } from 'react';
import type { Habit, CreateHabitRequestDTO, CheckInHabitResponseData } from '../types/habit.types';
import { habitService, INITIAL_MOCK_HABITS } from '../services/habitService';
import type { DemoState } from './useTasks';

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>(INITIAL_MOCK_HABITS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [demoState, setDemoState] = useState<DemoState>('default');

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await habitService.getHabits();
      setHabits(data);
    } catch (err: any) {
      // Khi offline / chưa có backend hoặc gặp lỗi mạng, giữ fallback data để test UI
      if (err.code === 'ERR_NETWORK' || !err.response) {
        setHabits(INITIAL_MOCK_HABITS);
      } else {
        const errorMsg =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Không thể tải danh sách thói quen';
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHabits();
  }, [fetchHabits]);

  const createHabit = async (dto: CreateHabitRequestDTO): Promise<Habit> => {
    try {
      const newHabit = await habitService.createHabit(dto);
      setHabits((prev) => [newHabit, ...prev]);
      return newHabit;
    } catch (err: any) {
      // Fallback local mock nếu backend chưa sẵn sàng
      if (err.code === 'ERR_NETWORK' || !err.response) {
        const fallbackHabit: Habit = {
          _id: 'mock-habit-' + Date.now(),
          user_id: 'user-demo-1',
          title: dto.title.trim(),
          frequency: dto.frequency || 'DAILY',
          target_days: dto.target_days || 7,
          current_streak: 0,
          is_active: true,
          logs: [],
          created_at: new Date().toISOString()
        };
        setHabits((prev) => [fallbackHabit, ...prev]);
        return fallbackHabit;
      }
      throw err;
    }
  };

  const deleteHabit = async (id: string): Promise<void> => {
    try {
      await habitService.deleteHabit(id);
      setHabits((prev) => prev.filter((h) => h._id !== id));
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        setHabits((prev) => prev.filter((h) => h._id !== id));
        return;
      }
      throw err;
    }
  };

  const checkInHabit = async (id: string): Promise<CheckInHabitResponseData> => {
    const result = await habitService.checkInHabit(id);
    setHabits(prev => prev.map(habit => habit._id === id ? result.habit : habit));
    return result;
  };

  // Áp dụng trạng thái review / demo
  const displayedHabits =
    demoState === 'empty' ? [] : demoState === 'loading' ? [] : habits;
  const isDisplayLoading = demoState === 'loading' ? true : loading;
  const displayError = demoState === 'error' ? 'Lỗi kết nối máy chủ' : error;

  return {
    habits: displayedHabits,
    allHabitsCount: habits.length,
    loading: isDisplayLoading,
    error: displayError,
    demoState,
    setDemoState,
    createHabit,
    deleteHabit,
    checkInHabit,
    refetch: fetchHabits
  };
};
