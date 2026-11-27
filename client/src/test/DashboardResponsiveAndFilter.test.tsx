import { act, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from '../pages/Dashboard';
import { dashboardService } from '../services/dashboardService';
import { taskService } from '../services/task.service';
import { habitService } from '../services/habitService';
import { badgeService } from '../services/badgeService';
import { notificationService } from '../services/notificationService';
import type { Task } from '../types/task.types';
import type { UserProfile } from '../types/auth.types';

const mockUser: UserProfile = {
  _id: 'qa-s4-user',
  email: 'qa.sprint4@ptit.edu.vn',
  full_name: 'Lê Mạnh Hùng',
  current_level: 3,
  total_xp: 450,
  current_streak: 7,
  streak_freeze_count: 1,
  last_active_date: '2026-11-27',
  created_at: '2026-11-01T00:00:00.000Z'
};

const sampleTasks: Task[] = [
  {
    _id: 't-1',
    user_id: mockUser._id,
    title: 'Benchmark Dashboard API',
    description: '',
    priority: 'HIGH',
    status: 'TODO',
    due_date: '2026-11-27T10:00:00.000Z',
    completed_at: null,
    xp_reward: 30,
    created_at: '2026-11-25T00:00:00.000Z'
  },
  {
    _id: 't-2',
    user_id: mockUser._id,
    title: 'Benchmark Mobile Layout',
    description: '',
    priority: 'LOW',
    status: 'COMPLETED',
    due_date: '2026-11-27T10:00:00.000Z',
    completed_at: '2026-11-27T08:00:00.000Z',
    xp_reward: 10,
    created_at: '2026-11-25T00:00:00.000Z'
  },
  {
    _id: 't-3',
    user_id: mockUser._id,
    title: 'Write Sprint 4 Report',
    description: '',
    priority: 'HIGH',
    status: 'TODO',
    due_date: '2026-11-29T10:00:00.000Z',
    completed_at: null,
    xp_reward: 30,
    created_at: '2026-11-25T00:00:00.000Z'
  }
];

function mockViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => {
      const maxMatch = query.match(/max-width:\s*(\d+)px/);
      const minMatch = query.match(/min-width:\s*(\d+)px/);
      let matches = true;
      if (maxMatch) matches = matches && width <= Number(maxMatch[1]);
      if (minMatch) matches = matches && width >= Number(minMatch[1]);
      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      };
    }
  });
  window.dispatchEvent(new Event('resize'));
}

function setupDashboardMocks() {
  vi.spyOn(taskService, 'getTasks').mockResolvedValue({
    tasks: sampleTasks,
    total: sampleTasks.length
  });
  vi.spyOn(badgeService, 'list').mockResolvedValue([]);
  vi.spyOn(notificationService, 'list').mockResolvedValue({
    notifications: [],
    unread_count: 0,
    total: 0
  });
  vi.spyOn(habitService, 'getHabits').mockResolvedValue([
    {
      _id: 'h-1',
      user_id: mockUser._id,
      title: 'Đọc sách 30 phút',
      frequency: 'DAILY',
      target_days: 7,
      current_streak: 5,
      is_active: true,
      logs: [],
      created_at: '2026-11-20T00:00:00.000Z'
    }
  ]);
  vi.spyOn(dashboardService, 'getDashboardSummary').mockResolvedValue({
    stats: {
      total_tasks: 3,
      completed_tasks: 1,
      completion_rate: 33.33,
      current_level: 3,
      total_xp: 450,
      current_streak: 7,
      unlocked_badges_count: 4,
      total_badges_count: 10
    },
    weekly_activity: [
      { date: '2026-11-21', tasks_completed: 1, habits_completed: 1, xp_earned: 35 },
      { date: '2026-11-22', tasks_completed: 2, habits_completed: 1, xp_earned: 55 },
      { date: '2026-11-23', tasks_completed: 0, habits_completed: 1, xp_earned: 15 },
      { date: '2026-11-24', tasks_completed: 3, habits_completed: 2, xp_earned: 90 },
      { date: '2026-11-25', tasks_completed: 2, habits_completed: 1, xp_earned: 55 },
      { date: '2026-11-26', tasks_completed: 1, habits_completed: 1, xp_earned: 35 },
      { date: '2026-11-27', tasks_completed: 1, habits_completed: 1, xp_earned: 25 }
    ]
  });
}

describe('[TECH-S4-06] Multi-Viewport Responsive Verification & Advanced Filters QA', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const viewports = [
    { name: 'iPhone 14 (390x844)', width: 390, height: 844 },
    { name: 'iPad Mini (768x1024)', width: 768, height: 1024 },
    { name: 'Desktop (1920x1080)', width: 1920, height: 1080 }
  ];

  for (const vp of viewports) {
    it(`hiển thị trọn vẹn Stats Hub, Task List, Habit Tracker và Biểu đồ tuần trên ${vp.name}`, async () => {
      mockViewport(vp.width, vp.height);
      setupDashboardMocks();

      render(<Dashboard currentUser={mockUser} />);

      const statsRegion = await screen.findByRole('region', { name: 'Tổng quan tiến trình' });
      expect(within(statsRegion).getByText('33.33%')).toBeInTheDocument();
      expect(within(statsRegion).getByText('4/10')).toBeInTheDocument();
      expect(within(statsRegion).getByTestId('streak-count')).toHaveTextContent('7 ngày');

      expect(screen.getByRole('region', { name: 'Công việc' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Thói quen hôm nay' })).toBeInTheDocument();
      expect(
        await screen.findByRole('region', { name: /Biểu đồ năng suất/ }, { timeout: 4000 })
      ).toBeInTheDocument();
    });
  }

  it('kiểm thử bộ lọc nâng cao kết hợp (Search Debounce 300ms + Status + Priority + Date range) và Xóa tất cả bộ lọc trên Mobile 390x844', async () => {
    mockViewport(390, 844);
    setupDashboardMocks();

    render(<Dashboard currentUser={mockUser} />);
    await screen.findByText('Benchmark Dashboard API');

    const searchInput = screen.getByRole('searchbox', { name: 'Tìm theo tiêu đề' });
    vi.useFakeTimers();

    fireEvent.change(searchInput, { target: { value: 'benchmark' } });
    // Trước 300ms debounce chưa lọc
    await act(async () => vi.advanceTimersByTime(250));
    expect(screen.getByText('Write Sprint 4 Report')).toBeInTheDocument();

    // Sau đúng 300ms debounce lọc không phân biệt chữ hoa/thường
    await act(async () => vi.advanceTimersByTime(50));
    expect(screen.queryByText('Write Sprint 4 Report')).not.toBeInTheDocument();
    expect(screen.getByText('Benchmark Dashboard API')).toBeInTheDocument();
    expect(screen.getByText('Benchmark Mobile Layout')).toBeInTheDocument();

    // Kết hợp Status = TODO + Priority = HIGH + Date range = 2026-11-27
    fireEvent.change(screen.getByLabelText('Trạng thái'), { target: { value: 'TODO' } });
    fireEvent.change(screen.getByLabelText('Lọc ưu tiên'), { target: { value: 'HIGH' } });
    fireEvent.change(screen.getByLabelText('Hạn từ ngày'), { target: { value: '2026-11-27' } });
    fireEvent.change(screen.getByLabelText('Hạn đến ngày'), { target: { value: '2026-11-27' } });

    expect(screen.getByText('Benchmark Dashboard API')).toBeInTheDocument();
    expect(screen.queryByText('Benchmark Mobile Layout')).not.toBeInTheDocument();

    // Bấm "Xóa tất cả bộ lọc" đưa toàn bộ danh sách về mặc định
    fireEvent.click(screen.getByRole('button', { name: 'Xóa tất cả bộ lọc' }));
    expect(searchInput).toHaveValue('');
    expect(screen.getByText('Benchmark Dashboard API')).toBeInTheDocument();
    expect(screen.getByText('Benchmark Mobile Layout')).toBeInTheDocument();
    expect(screen.getByText('Write Sprint 4 Report')).toBeInTheDocument();
  });
});
