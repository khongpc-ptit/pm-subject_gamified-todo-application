import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Dashboard } from '../pages/Dashboard';
import { dashboardService } from '../services/dashboardService';
import { taskService } from '../services/task.service';
import { habitService } from '../services/habitService';
import { badgeService } from '../services/badgeService';
import { notificationService } from '../services/notificationService';
import type { Task } from '../types/task.types';
import type { UserProfile } from '../types/auth.types';

const account: UserProfile = {
  _id: 'owner', email: 'owner@example.test', full_name: 'Test Owner', created_at: '2026-11-24T00:00:00Z',
  total_xp: 70, current_level: 1, current_streak: 2, streak_freeze_count: 1, last_active_date: null
};
const first: Task = {
  _id: '1', user_id: account._id, title: 'Review sprint', priority: 'HIGH', status: 'TODO',
  due_date: '2026-11-26T18:00:00.000Z', completed_at: null, xp_reward: 30,
  created_at: account.created_at, description: ''
};
const tasks: Task[] = [
  first,
  { ...first, _id: '2', title: 'Review demo', status: 'COMPLETED' },
  { ...first, _id: '3', title: 'Review previous', due_date: '2026-11-26T16:00:00.000Z' },
  { ...first, _id: '4', title: 'Review notes', priority: 'LOW', due_date: null },
  { ...first, _id: '5', title: 'Plan a release' }
];

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('debounces case-insensitive title search, combines filters by Vietnam due date, and clears immediately', async () => {
  const loadTasks = vi.spyOn(taskService, 'getTasks').mockResolvedValue({ tasks, total: tasks.length });
  render(<Dashboard />);
  await screen.findByText('Review sprint');
  const search = screen.getByRole('searchbox', { name: 'Tìm theo tiêu đề' });

  vi.useFakeTimers();
  fireEvent.change(search, { target: { value: 'r' } });
  await act(async () => vi.advanceTimersByTime(250));
  fireEvent.change(search, { target: { value: 'REVIEW' } });
  await act(async () => vi.advanceTimersByTime(299));
  expect(screen.getByText('Plan a release')).toBeInTheDocument();
  await act(async () => vi.advanceTimersByTime(1));
  expect(screen.queryByText('Plan a release')).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Trạng thái'), { target: { value: 'TODO' } });
  fireEvent.change(screen.getByLabelText('Lọc ưu tiên'), { target: { value: 'HIGH' } });
  fireEvent.change(screen.getByLabelText('Hạn từ ngày'), { target: { value: '2026-11-27' } });
  fireEvent.change(screen.getByLabelText('Hạn đến ngày'), { target: { value: '2026-11-27' } });
  expect(screen.getByText('Review sprint')).toBeInTheDocument();
  for (const title of ['Review demo', 'Review previous', 'Review notes']) {
    expect(screen.queryByText(title)).not.toBeInTheDocument();
  }
  expect(loadTasks).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: 'Xóa tất cả bộ lọc' }));
  expect(search).toHaveValue('');
  expect(screen.getByLabelText('Hạn từ ngày')).toHaveValue('');
  for (const task of tasks) expect(screen.getByText(task.title)).toBeInTheDocument();
});

it('uses the summary API for all four stats and embeds task, habit and chart views', async () => {
  vi.spyOn(taskService, 'getTasks').mockResolvedValue({ tasks, total: tasks.length });
  vi.spyOn(badgeService, 'list').mockResolvedValue([]);
  vi.spyOn(notificationService, 'list').mockResolvedValue({ notifications: [], unread_count: 0, total: 0 });
  vi.spyOn(habitService, 'getHabits').mockResolvedValue([{
    _id: 'habit', user_id: account._id, title: 'Read today', frequency: 'DAILY',
    target_days: 7, current_streak: 0, is_active: true, logs: [], created_at: account.created_at
  }]);
  const summary = vi.spyOn(dashboardService, 'getDashboardSummary').mockResolvedValue({
    stats: { total_tasks: 5, completed_tasks: 2, completion_rate: 40, current_level: 1, total_xp: 70,
      current_streak: 2, unlocked_badges_count: 4, total_badges_count: 10 },
    weekly_activity: []
  });
  render(<Dashboard currentUser={account} />);
  const stats = await screen.findByRole('region', { name: 'Tổng quan tiến trình' });
  expect(within(stats).getByText('70/100 XP · 70%')).toBeInTheDocument();
  expect(within(stats).getByText('4/10')).toBeInTheDocument();
  expect(within(stats).getByText('40%')).toBeInTheDocument();
  expect(within(stats).getByTestId('streak-count')).toHaveTextContent('2 ngày');
  expect(screen.getByLabelText('Tên công việc')).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'Check-in Read today' })).toBeInTheDocument();
  expect(await screen.findByRole('region', { name: /Biểu đồ năng suất/ }, { timeout: 4000 })).toBeInTheDocument();
  expect(summary).toHaveBeenCalledOnce();
});
