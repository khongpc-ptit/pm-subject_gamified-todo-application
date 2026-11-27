import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from '../App';
import { apiClient } from '../services/api';
import { habitService } from '../services/habitService';
import { taskService } from '../services/task.service';
import type { UserProfile } from '../types/auth.types';
import type { Habit } from '../types/habit.types';
import type { Task } from '../types/task.types';

vi.mock('../components/dashboard/WeeklyProductivityChart', () => ({ default: () => null }));

const profile: UserProfile = {
  _id: 'sprint2-user', email: 'sprint2@example.test', full_name: 'Sprint Two',
  current_level: 1, total_xp: 0, current_streak: 0, streak_freeze_count: 1,
  last_active_date: null, created_at: '2026-11-24T00:00:00.000Z'
};
const task: Task = {
  _id: 'sprint2-task', user_id: profile._id, title: 'Finish the sprint',
  description: '', priority: 'HIGH', status: 'TODO', due_date: null,
  completed_at: null, xp_reward: 30, created_at: profile.created_at
};
const habit: Habit = {
  _id: 'sprint2-habit', user_id: profile._id, title: 'Daily reading',
  frequency: 'DAILY', target_days: 7, current_streak: 0, is_active: true,
  logs: [], created_at: profile.created_at
};
const completedTask: Task = { ...task, status: 'COMPLETED', completed_at: profile.created_at };

function startSession(total_xp: number, current_level: number) {
  localStorage.setItem('questline_jwt_token', 'sprint2-fixture');
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { data: { ...profile, total_xp, current_level } } });
  const taskList = vi.spyOn(taskService, 'getTasks').mockResolvedValue({ tasks: [task], total: 1 });
  vi.spyOn(habitService, 'getHabits').mockResolvedValue([habit]);
  render(<App />);
  return taskList;
}

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

it('shows a single level-up dialog after task completion and keeps the new XP across screens', async () => {
  const taskList = startSession(70, 1);
  vi.spyOn(taskService, 'completeTask').mockImplementation(async () => {
    taskList.mockResolvedValue({ tasks: [completedTask], total: 1 });
    return { ...completedTask, xp_earned: 30, total_xp: 100, current_level: 2, level_up: true };
  });
  const complete = await screen.findByRole('button', { name: 'Hoàn thành: Finish the sprint' });
  expect(screen.getByTestId('xp-text')).toHaveTextContent('70/100 XP · 70%');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(complete);
  const dialog = await screen.findByRole('dialog', { name: /Cấp 2/ });
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(within(dialog).getByText('100 XP')).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: /Tiếp tục chinh phục/ }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByTestId('xp-text')).toHaveTextContent('0/300 XP · 0%');
  expect(screen.getByTestId('xp-next-level')).toHaveTextContent('còn 300 XP');

  fireEvent.click(screen.getByRole('button', { name: 'Habit & Streak Management' }));
  expect(await screen.findByText(habit.title)).toBeInTheDocument();
  expect(screen.getByTestId('xp-text')).toHaveTextContent('0/300 XP');
  fireEvent.click(screen.getByRole('button', { name: 'Profile & Achievements' }));
  expect(screen.getByTestId('profile-xp')).toHaveTextContent('100');
  expect(screen.getByTestId('profile-level-badge')).toHaveTextContent('Cấp 2');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('shows the cap warning while completing a task without awarding XP or opening a modal', async () => {
  const taskList = startSession(200, 2);
  vi.spyOn(taskService, 'completeTask').mockImplementation(async () => {
    taskList.mockResolvedValue({ tasks: [completedTask], total: 1 });
    return { ...completedTask, xp_earned: 0, total_xp: 200, current_level: 2, level_up: false, is_cap_reached: true };
  });
  fireEvent.click(await screen.findByRole('button', { name: 'Hoàn thành: Finish the sprint' }));
  expect(await screen.findByText(/Đã đạt trần tối đa 200 XP hôm nay/)).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'Đã hoàn thành: Finish the sprint' })).toBeDisabled();
  expect(screen.getByTestId('xp-text')).toHaveTextContent('100/300 XP');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('updates streak, header and profile after check-in and opens the level-up dialog', async () => {
  startSession(85, 1);
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
  const checkIn = vi.spyOn(habitService, 'checkInHabit').mockResolvedValue({
    habit: { ...habit, current_streak: 1, logs: [{ log_date: today, is_completed: true, xp_earned: 15 }] },
    xp_earned: 15, total_xp: 100, current_level: 2, level_up: true, next_level_xp: 400
  });
  fireEvent.click(await screen.findByRole('button', { name: 'Habit & Streak Management' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Check-in Daily reading' }));
  const dialog = await screen.findByRole('dialog', { name: /Cấp 2/ });
  expect(within(dialog).getByText('100 XP')).toBeInTheDocument();
  fireEvent.keyDown(window, { key: 'Escape' });
  await waitFor(() => expect(dialog).not.toBeInTheDocument());
  expect(screen.getByText('Đã check-in · +15 XP')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Đã check-in hôm nay' })).toBeDisabled();
  expect(within(screen.getByRole('article', { name: 'Thói quen: Daily reading' })).getByText('1 ngày')).toBeInTheDocument();
  expect(checkIn).toHaveBeenCalledOnce();
  expect(screen.getByTestId('xp-text')).toHaveTextContent('0/300 XP');
  fireEvent.click(screen.getByRole('button', { name: 'Profile & Achievements' }));
  expect(screen.getByTestId('profile-xp')).toHaveTextContent('100');
  expect(screen.getByTestId('profile-level-badge')).toHaveTextContent('Cấp 2');
});
