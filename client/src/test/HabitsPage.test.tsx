import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HabitsPage } from '../pages/HabitsPage';
import { HabitCreateModal } from '../components/habits/HabitCreateModal';
import { HabitCard } from '../components/habits/HabitCard';
import { habitService } from '../services/habitService';
import type { Habit } from '../types/habit.types';
import type { UserProfile } from '../types/auth.types';

const mockUser: UserProfile = {
  _id: 'user-test-1',
  email: 'test@example.com',
  full_name: 'Khổng Phú Cường',
  current_level: 2,
  total_xp: 450,
  current_streak: 7,
  last_active_date: '2026-11-23',
  streak_freeze_count: 2,
  created_at: '2026-11-01T10:00:00.000Z'
};

const mockHabits: Habit[] = [
  {
    _id: 'habit-1',
    user_id: 'user-test-1',
    title: 'Uống đủ 2L nước',
    frequency: 'DAILY',
    target_days: 7,
    current_streak: 5,
    is_active: true,
    logs: [
      { log_date: '2026-11-21', is_completed: true, xp_earned: 15 },
      { log_date: '2026-11-22', is_completed: true, xp_earned: 15 }
    ],
    created_at: '2026-11-15T00:00:00.000Z'
  },
  {
    _id: 'habit-2',
    user_id: 'user-test-1',
    title: 'Chạy bộ 3km',
    frequency: 'WEEKLY',
    target_days: 3,
    current_streak: 2,
    is_active: true,
    logs: [],
    created_at: '2026-11-16T00:00:00.000Z'
  }
];

describe('Frontend: [TECH-S2-03] Habits Page & Habit Tracker Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Hiển thị đúng tiêu đề trang và danh sách các thẻ thói quen', async () => {
    vi.spyOn(habitService, 'getHabits').mockResolvedValue(mockHabits);

    render(<HabitsPage currentUser={mockUser} />);

    expect(screen.getByText('02 / HABIT TRACKER')).toBeInTheDocument();
    expect(screen.getByText('Xây thói quen, giữ nhịp độ.')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Uống đủ 2L nước')).toBeInTheDocument();
      expect(screen.getByText('Chạy bộ 3km')).toBeInTheDocument();
    });

    expect(screen.getByText('5 ngày')).toBeInTheDocument();
    expect(screen.getAllByText(/liên tiếp/i)).toHaveLength(2);
  });

  it('2. Hiển thị Empty State khi người dùng chưa có thói quen nào', async () => {
    vi.spyOn(habitService, 'getHabits').mockResolvedValue([]);

    render(<HabitsPage currentUser={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('Gieo một thói quen nhỏ')).toBeInTheDocument();
      expect(screen.getByText('Chọn một việc bạn muốn lặp lại và bắt đầu theo dõi.')).toBeInTheDocument();
    });
  });

  it('3. HabitCard hiển thị chính xác chu kỳ và nút check-in', () => {
    const handleCheckIn = vi.fn();
    const handleDelete = vi.fn();

    render(
      <HabitCard
        habit={mockHabits[0]}
        onCheckIn={handleCheckIn}
        onDelete={handleDelete}
      />
    );

    expect(screen.getByText('Uống đủ 2L nước')).toBeInTheDocument();
    expect(screen.getByText(/Hằng ngày · Mục tiêu 7 ngày \/ chu kỳ/i)).toBeInTheDocument();

    const checkInBtn = screen.getByRole('button', { name: /Check-in Uống đủ 2L nước/i });
    expect(checkInBtn).toBeInTheDocument();
    fireEvent.click(checkInBtn);
    expect(handleCheckIn).toHaveBeenCalledWith('habit-1');

    const deleteBtn = screen.getByRole('button', { name: /Ngừng theo dõi Uống đủ 2L nước/i });
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(mockHabits[0]);
  });

  it('4. HabitCreateModal kiểm tra validation phía Client (chặn submit rỗng)', async () => {
    const handleSubmit = vi.fn();
    const handleClose = vi.fn();

    render(
      <HabitCreateModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    );

    const submitBtn = screen.getByRole('button', { name: 'Tạo thói quen' });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Vui lòng nhập tên thói quen.')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('5. HabitCreateModal gửi dữ liệu hợp lệ khi submit form', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <HabitCreateModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    );

    const titleInput = screen.getByLabelText(/Tên thói quen/i);
    fireEvent.change(titleInput, { target: { value: '   Đọc sách 30 phút   ' } });

    const freqSelect = screen.getByLabelText('Chu kỳ');
    fireEvent.change(freqSelect, { target: { value: 'WEEKLY' } });

    const targetInput = screen.getByLabelText(/Mục tiêu số ngày/i);
    fireEvent.change(targetInput, { target: { value: '4' } });

    const submitBtn = screen.getByRole('button', { name: 'Tạo thói quen' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        title: 'Đọc sách 30 phút',
        frequency: 'WEEKLY',
        target_days: 4
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('6. Hiển thị modal xác nhận và gọi API khi bấm "Ngừng theo dõi"', async () => {
    vi.spyOn(habitService, 'getHabits').mockResolvedValue(mockHabits);
    const deleteSpy = vi.spyOn(habitService, 'deleteHabit').mockResolvedValue({ id: 'habit-1' });

    render(<HabitsPage currentUser={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('Uống đủ 2L nước')).toBeInTheDocument();
    });

    const stopTrackingButtons = screen.getAllByText('Ngừng theo dõi');
    fireEvent.click(stopTrackingButtons[0]);

    expect(screen.getByText('Ngừng theo dõi thói quen?')).toBeInTheDocument();
    expect(screen.getByText(/Thói quen.*sẽ không xuất hiện trong danh sách/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Ngừng theo dõi' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('habit-1');
    });
  });
});
