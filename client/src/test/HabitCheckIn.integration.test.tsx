import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { HabitsPage } from '../pages/HabitsPage';
import { habitService } from '../services/habitService';
import type { Habit } from '../types/habit.types';

const habit: Habit = {
  _id: 'habit-1', user_id: 'user-1', title: 'Read today', frequency: 'DAILY',
  target_days: 7, current_streak: 0, is_active: true, logs: [], created_at: '2026-11-01T00:00:00Z'
};

afterEach(() => vi.restoreAllMocks());

it('renders the saved streak, disables check-in and announces the actual XP earned', async () => {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date());
  const result = {
    habit: { ...habit, current_streak: 1, logs: [{ log_date: today, is_completed: true, xp_earned: 5 }] },
    xp_earned: 5, total_xp: 200, current_level: 2, level_up: false, next_level_xp: 400, is_cap_reached: true
  };
  vi.spyOn(habitService, 'getHabits').mockResolvedValue([habit]);
  const checkIn = vi.spyOn(habitService, 'checkInHabit').mockResolvedValue(result);
  const onToast = vi.fn();
  const onCheckInSuccess = vi.fn();
  render(<HabitsPage onToast={onToast} onCheckInSuccess={onCheckInSuccess} />);
  const button = await screen.findByRole('button', { name: 'Check-in Read today' });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(await screen.findByRole('button', { name: 'Đã check-in hôm nay' })).toBeDisabled();
  expect(checkIn).toHaveBeenCalledTimes(1);
  expect(within(screen.getByRole('article')).getByText('1 ngày')).toBeInTheDocument();
  expect(onToast).toHaveBeenCalledWith('Đã check-in · +5 XP');
  expect(onCheckInSuccess).toHaveBeenCalledWith(result);
});

it('keeps the original habit and allows retry after a network failure', async () => {
  vi.spyOn(habitService, 'getHabits').mockResolvedValue([habit]);
  vi.spyOn(habitService, 'checkInHabit').mockRejectedValue({ code: 'ERR_NETWORK' });
  const onToast = vi.fn();
  const onCheckInSuccess = vi.fn();
  render(<HabitsPage onToast={onToast} onCheckInSuccess={onCheckInSuccess} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Check-in Read today' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Check-in Read today' })).toBeEnabled());
  expect(within(screen.getByRole('article')).getByText('0 ngày')).toBeInTheDocument();
  expect(onToast).toHaveBeenCalledWith('Không thể check-in lúc này');
  expect(onCheckInSuccess).not.toHaveBeenCalled();
});
