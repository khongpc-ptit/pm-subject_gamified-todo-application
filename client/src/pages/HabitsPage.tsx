import React, { useState } from 'react';
import type { UserProfile } from '../types/auth.types';
import type { Habit, CreateHabitRequestDTO } from '../types/habit.types';
import { useHabits } from '../hooks/useHabits';
import { HabitCard } from '../components/habits/HabitCard';
import { HabitCreateModal } from '../components/habits/HabitCreateModal';

interface HabitsPageProps {
  currentUser?: UserProfile | null;
  onNavigate?: (screen: 'dashboard' | 'habits' | 'profile') => void;
  onToast?: (message: string) => void;
}

export const HabitsPage: React.FC<HabitsPageProps> = ({
  currentUser,
  onToast
}) => {
  const {
    habits,
    loading,
    error,
    createHabit,
    deleteHabit,
    checkInHabit,
    refetch
  } = useHabits();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const handleCreate = async (dto: CreateHabitRequestDTO) => {
    await createHabit(dto);
    onToast?.('Đã tạo thói quen thành công');
  };

  const handleConfirmDelete = async () => {
    if (!deletingHabit) return;
    setIsDeleting(true);
    try {
      await deleteHabit(deletingHabit._id);
      onToast?.('Đã ngừng theo dõi thói quen');
      setDeletingHabit(null);
    } catch {
      onToast?.('Lỗi khi ngừng theo dõi thói quen');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCheckIn = async (id: string) => {
    setCheckingInId(id);
    try {
      const res = await checkInHabit(id);
      const earned = res?.xp_earned ?? 15;
      if (earned > 0) {
        onToast?.(`Đã check-in · +${earned} XP`);
      } else {
        onToast?.('Đã check-in · Đạt trần XP hôm nay');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Không thể check-in lúc này';
      onToast?.(msg);
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <>
      {/* Tiêu đề trang */}
      <div className="page-title">
        <div>
          <div className="eyebrow">02 / HABIT TRACKER</div>
          <h1>Xây thói quen, giữ nhịp độ.</h1>
          <p>Một lần check-in, thêm một bước tiến.</p>
        </div>
        <button
          type="button"
          className="primary"
          onClick={() => setIsCreateModalOpen(true)}
          aria-label="Tạo thói quen mới"
        >
          ＋ Thói quen mới
        </button>
      </div>

      {/* Bố cục Grid 2 cột */}
      <div className="grid">
        {/* Cột trái: Danh sách thói quen */}
        <div>
          {loading ? (
            <div className="card" role="status" aria-label="Đang tải dữ liệu thói quen">
              <h2>Đang tải dữ liệu…</h2>
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ) : error ? (
            <div className="empty" role="alert">
              <div className="empty-icon">!</div>
              <h2>Chưa tải được dữ liệu</h2>
              <p>{error}. Hãy thử lại để tiếp tục.</p>
              <button type="button" className="primary" onClick={refetch}>
                Thử lại
              </button>
            </div>
          ) : habits.length === 0 ? (
            <div className="empty" aria-label="Chưa có thói quen nào">
              <div className="empty-icon">↻</div>
              <h2>Gieo một thói quen nhỏ</h2>
              <p>Chọn một việc bạn muốn lặp lại và bắt đầu theo dõi.</p>
              <button
                type="button"
                className="primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                ＋ Tạo thói quen
              </button>
            </div>
          ) : (
            <div className="habit-list" aria-label="Danh sách thói quen">
              {habits.map((h) => (
                <HabitCard
                  key={h._id}
                  habit={h}
                  onCheckIn={handleCheckIn}
                  onDelete={(habit) => setDeletingHabit(habit)}
                  isCheckInLoading={checkingInId === h._id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Cột phải: Thống kê Gamification */}
        <aside>
          <section className="card flat">
            <div className="eyebrow">DAILY STREAK</div>
            <div className="metric">
              {currentUser?.current_streak ?? 6}{' '}
              <span style={{ fontSize: '14px' }}>ngày</span>
            </div>
            <p>Giữ lời hứa với bản thân, từng ngày một.</p>
            <p className="helper">
              Chuỗi tài khoản được hệ thống tổng hợp theo ngày Việt Nam (UTC+7).
              Check-in giúp duy trì tính kỷ luật và nhận thêm XP mỗi ngày.
            </p>
          </section>

          <section className="card">
            <div className="eyebrow">STREAK PROTECTION</div>
            <h3>◇ {currentUser?.streak_freeze_count ?? 1} lượt đóng băng</h3>
            <p>Bảo vệ chuỗi khi bạn bỏ lỡ một ngày.</p>
            <button
              type="button"
              className="primary"
              style={{ width: '100%' }}
              onClick={() => onToast?.('Tính năng bảo vệ streak đã sẵn sàng')}
            >
              Kích hoạt bảo vệ…
            </button>
          </section>
        </aside>
      </div>

      {/* Modal Tạo thói quen mới */}
      <HabitCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Modal Xác nhận Ngừng theo dõi thói quen */}
      {deletingHabit && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingHabit(null);
          }}
        >
          <div className="modal">
            <div className="modal-head">
              <h2 id="confirm-delete-title">Ngừng theo dõi thói quen?</h2>
              <button
                type="button"
                className="quiet small"
                onClick={() => setDeletingHabit(null)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>
            <p>
              Thói quen <strong>“{deletingHabit.title}”</strong> sẽ không xuất hiện trong danh sách đang theo dõi.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="quiet"
                onClick={() => setDeletingHabit(null)}
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="primary"
                style={{ backgroundColor: '#a04438', borderColor: '#a04438' }}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Đang xử lý…' : 'Ngừng theo dõi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
