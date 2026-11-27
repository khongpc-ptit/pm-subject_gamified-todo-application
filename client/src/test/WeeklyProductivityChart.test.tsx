import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { apiClient } from '../services/api';
import { dashboardService } from '../services/dashboardService';
import {
  WeeklyProductivityChart,
  CustomProductivityTooltip
} from '../components/dashboard/WeeklyProductivityChart';
import { formatShortDateLabel, formatFullDateLabel } from '../utils/dashboardUtils';
import type { DashboardSummaryData, WeeklyActivityItem } from '../types/dashboard.types';

describe('[TECH-S4-03] WeeklyProductivityChart & dashboardService', () => {
  beforeAll(() => {
    // Recharts ResponsiveContainer requires ResizeObserver in jsdom
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. dashboardService.getDashboardSummary', () => {
    it('fetches GET /dashboard/summary and returns DashboardSummaryData', async () => {
      const mockData: DashboardSummaryData = {
        stats: {
          total_tasks: 12,
          completed_tasks: 9,
          completion_rate: 75,
          current_level: 2,
          total_xp: 240,
          current_streak: 4,
          unlocked_badges_count: 3,
          total_badges_count: 10
        },
        weekly_activity: [
          { date: '2026-11-27', tasks_completed: 3, habits_completed: 2, xp_earned: 90 }
        ]
      };

      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          data: mockData,
          message: 'OK',
          timestamp: '2026-11-27T06:00:00.000Z'
        }
      });

      const result = await dashboardService.getDashboardSummary();
      expect(getSpy).toHaveBeenCalledWith('/dashboard/summary');
      expect(result).toEqual(mockData);
    });

    it('throws descriptive error when API responds with success: false', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Phiên đăng nhập hết hạn' },
          timestamp: '2026-11-27T06:00:00.000Z'
        }
      });

      await expect(dashboardService.getDashboardSummary()).rejects.toThrow(
        'Phiên đăng nhập hết hạn'
      );
    });
  });

  describe('2. Date formatting helpers', () => {
    it('formats YYYY-MM-DD to DD/MM and DD/MM/YYYY', () => {
      expect(formatShortDateLabel('2026-11-27')).toBe('27/11');
      expect(formatFullDateLabel('2026-11-27')).toBe('27/11/2026');
    });
  });

  describe('3. WeeklyProductivityChart States', () => {
    it('renders Skeleton loading state when isLoading is true', () => {
      render(<WeeklyProductivityChart data={[]} isLoading={true} />);

      expect(screen.getByLabelText('Đang tải biểu đồ năng suất')).toHaveAttribute(
        'aria-busy',
        'true'
      );
      expect(screen.getByText('Đang tổng hợp dữ liệu 7 ngày...')).toBeInTheDocument();
    });

    it('renders Error state and invokes onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(
        <WeeklyProductivityChart
          data={[]}
          error="Không thể kết nối máy chủ"
          onRetry={onRetry}
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Không thể kết nối máy chủ');
      fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('renders Empty State when all 7 days have 0 tasks and 0 habits', () => {
      const emptyWeek: WeeklyActivityItem[] = [
        { date: '2026-11-21', tasks_completed: 0, habits_completed: 0, xp_earned: 0 },
        { date: '2026-11-22', tasks_completed: 0, habits_completed: 0, xp_earned: 0 }
      ];

      render(<WeeklyProductivityChart data={emptyWeek} />);

      expect(
        screen.getByText('Chưa có hoạt động nào trong 7 ngày qua')
      ).toBeInTheDocument();
    });

    it('renders summary pills and chart container when activity exists', () => {
      const activeWeek: WeeklyActivityItem[] = [
        { date: '2026-11-25', tasks_completed: 2, habits_completed: 1, xp_earned: 55 },
        { date: '2026-11-26', tasks_completed: 1, habits_completed: 2, xp_earned: 50 },
        { date: '2026-11-27', tasks_completed: 3, habits_completed: 1, xp_earned: 85 }
      ];

      render(<WeeklyProductivityChart data={activeWeek} />);

      expect(screen.getByText('Năng suất 7 ngày qua')).toBeInTheDocument();
      expect(screen.getByText('6 Tasks')).toBeInTheDocument();
      expect(screen.getByText('4 Habits')).toBeInTheDocument();
      expect(screen.getByText('+190 XP')).toBeInTheDocument();
    });
  });

  describe('4. CustomProductivityTooltip', () => {
    it('renders detailed tooltip with date, tasks, habits and XP when active', () => {
      const sampleItem: WeeklyActivityItem = {
        date: '2026-11-27',
        tasks_completed: 3,
        habits_completed: 2,
        xp_earned: 90
      };

      render(
        <CustomProductivityTooltip
          active={true}
          label="2026-11-27"
          payload={[{ payload: sampleItem }]}
        />
      );

      expect(screen.getByText('Ngày 27/11/2026')).toBeInTheDocument();
      expect(screen.getByText('Công việc hoàn thành:')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Thói quen check-in:')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('+90 XP')).toBeInTheDocument();
    });

    it('returns null when inactive or payload is empty', () => {
      const { container } = render(
        <CustomProductivityTooltip active={false} payload={[]} />
      );
      expect(container).toBeEmptyDOMElement();
    });
  });
});
