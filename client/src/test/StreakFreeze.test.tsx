import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StreakCard } from '../components/gamification/StreakCard';
import { gamificationService } from '../services/gamificationService';
import { apiClient } from '../services/api';
import { HabitsPage } from '../pages/HabitsPage';
import { habitService } from '../services/habitService';
import { GamificationProvider } from '../context/GamificationContext';
import type { UserProfile } from '../types/auth.types';

describe('Frontend: [US-S3-02 / TECH-S3-03] StreakCard & Streak Freeze Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. gamificationService.freezeStreak API Client', () => {
    it('gọi POST /gamification/freeze-streak và trả về dữ liệu phản hồi chuẩn', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            streak_freeze_count: 0,
            current_streak: 7,
            is_protected: true,
            message: 'Kích hoạt đóng băng chuỗi thành công!'
          },
          message: 'Đã sử dụng 1 lượt đóng băng chuỗi',
          timestamp: '2026-11-25T05:00:00.000Z'
        }
      });

      const result = await gamificationService.freezeStreak();

      expect(postSpy).toHaveBeenCalledWith('/gamification/freeze-streak');
      expect(result).toMatchObject({
        streak_freeze_count: 0,
        current_streak: 7,
        is_protected: true
      });
    });
  });

  describe('2. StreakCard Component Rendering & Confirmation Dialog', () => {
    it('hiển thị số ngày streak, ngọn lửa rực sáng, số lượt đóng băng kèm icon bông tuyết ❄️ và nút kích hoạt khẩn cấp', () => {
      render(<StreakCard currentStreak={7} streakFreezeCount={1} />);

      expect(screen.getByTestId('streak-card')).toBeInTheDocument();
      expect(screen.getByTestId('streak-count')).toHaveTextContent('7');
      expect(screen.getByLabelText(/Ngọn lửa streak/i)).toBeInTheDocument();
      expect(screen.getByTestId('freeze-count')).toHaveTextContent('❄️');
      expect(screen.getByTestId('freeze-count')).toHaveTextContent('1 lượt đóng băng');
      expect(
        screen.getByRole('button', { name: /Kích hoạt đóng băng khẩn cấp/i })
      ).toBeEnabled();
    });

    it('mở Confirmation Dialog khi bấm nút kích hoạt đóng băng khẩn cấp và cho phép đóng hủy', () => {
      render(<StreakCard currentStreak={6} streakFreezeCount={1} />);

      fireEvent.click(screen.getByRole('button', { name: /Kích hoạt đóng băng khẩn cấp/i }));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(within(dialog).getByText(/Xác nhận đóng băng chuỗi/i)).toBeInTheDocument();
      expect(within(dialog).getByText(/1 lượt còn lại → 0 lượt/i)).toBeInTheDocument();

      fireEvent.click(within(dialog).getByRole('button', { name: /Hủy/i }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('hiển thị loading state, gọi API freezeStreak, cập nhật số lượt về 0 và bắn Toast thành công', async () => {
      let resolveFreeze!: (value: any) => void;
      const freezeSpy = vi.spyOn(gamificationService, 'freezeStreak').mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFreeze = resolve;
          })
      );
      const onToast = vi.fn();
      const onFreezeSuccess = vi.fn();

      render(
        <StreakCard
          currentStreak={8}
          streakFreezeCount={1}
          onToast={onToast}
          onFreezeSuccess={onFreezeSuccess}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Kích hoạt đóng băng khẩn cấp/i }));
      const dialog = screen.getByRole('dialog');
      const confirmBtn = within(dialog).getByRole('button', { name: /Xác nhận đóng băng/i });

      // Click xác nhận và thử double click khi đang loading
      fireEvent.click(confirmBtn);
      fireEvent.click(confirmBtn);

      expect(freezeSpy).toHaveBeenCalledTimes(1);
      expect(confirmBtn).toBeDisabled();
      expect(confirmBtn).toHaveTextContent(/Đang kích hoạt/i);

      resolveFreeze({
        streak_freeze_count: 0,
        current_streak: 8,
        is_protected: true,
        message: 'Đã sử dụng 1 lượt đóng băng chuỗi thành công!'
      });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('freeze-count')).toHaveTextContent('0 lượt đóng băng');
      expect(onFreezeSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          streak_freeze_count: 0,
          current_streak: 8,
          is_protected: true
        })
      );
      expect(onToast).toHaveBeenCalledWith(
        expect.stringMatching(/đóng băng|bảo vệ/i)
      );
    });

    it('hiển thị Toast lỗi khi API trả về 400 Bad Request ("Bạn không còn lượt đóng băng chuỗi")', async () => {
      vi.spyOn(gamificationService, 'freezeStreak').mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            success: false,
            error: {
              code: 'NO_FREEZE_REMAINING',
              message: 'Bạn không còn lượt đóng băng chuỗi nào để sử dụng.'
            }
          }
        }
      });
      const onToast = vi.fn();

      render(<StreakCard currentStreak={5} streakFreezeCount={1} onToast={onToast} />);

      fireEvent.click(screen.getByRole('button', { name: /Kích hoạt đóng băng khẩn cấp/i }));
      const dialog = screen.getByRole('dialog');
      fireEvent.click(within(dialog).getByRole('button', { name: /Xác nhận đóng băng/i }));

      await waitFor(() => {
        expect(onToast).toHaveBeenCalledWith(
          'Bạn không còn lượt đóng băng chuỗi nào để sử dụng.'
        );
      });
    });

    it('vô hiệu hóa nút kích hoạt khi streakFreezeCount <= 0', () => {
      render(<StreakCard currentStreak={4} streakFreezeCount={0} />);

      expect(screen.getByTestId('freeze-count')).toHaveTextContent('0 lượt đóng băng');
      const triggerBtn = screen.getByTestId('freeze-trigger-btn');
      expect(triggerBtn).toBeDisabled();
    });
  });

  describe('3. Tích hợp StreakCard trong HabitsPage', () => {
    it('kích hoạt đóng băng chuỗi trực tiếp từ HabitsPage và hiển thị Toast phản hồi', async () => {
      const mockUser: UserProfile = {
        _id: 'u-1',
        email: 'hung.lm@ptit.edu.vn',
        full_name: 'Lê Mạnh Hùng',
        current_level: 2,
        total_xp: 200,
        current_streak: 6,
        last_active_date: '2026-11-24',
        streak_freeze_count: 1,
        created_at: '2026-11-01T00:00:00.000Z'
      };

      vi.spyOn(habitService, 'getHabits').mockResolvedValue([]);
      vi.spyOn(gamificationService, 'freezeStreak').mockResolvedValueOnce({
        streak_freeze_count: 0,
        current_streak: 6,
        is_protected: true
      });
      const onToast = vi.fn();

      render(
        <GamificationProvider currentUser={mockUser}>
          <HabitsPage currentUser={mockUser} onToast={onToast} />
        </GamificationProvider>
      );

      const triggerBtn = await screen.findByRole('button', {
        name: /Kích hoạt đóng băng khẩn cấp/i
      });
      fireEvent.click(triggerBtn);

      const dialog = screen.getByRole('dialog');
      fireEvent.click(within(dialog).getByRole('button', { name: /Xác nhận đóng băng/i }));

      await waitFor(() => {
        expect(onToast).toHaveBeenCalledWith(expect.stringMatching(/đóng băng|bảo vệ/i));
      });
      expect(screen.getByTestId('freeze-count')).toHaveTextContent('0 lượt đóng băng');
    });
  });
});
