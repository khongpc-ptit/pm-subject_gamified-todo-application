import React from 'react';
import type { Habit } from '../../types/habit.types';

interface HabitCardProps {
  habit: Habit;
  onCheckIn: (id: string) => void;
  onDelete: (habit: Habit) => void;
  isCheckInLoading?: boolean;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onCheckIn,
  onDelete,
  isCheckInLoading = false
}) => {
  // Lấy ngày hiện tại YYYY-MM-DD theo giờ Việt Nam
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  const isCheckedInToday = habit.logs?.some(
    (l) => l.log_date === todayStr && l.is_completed
  );

  // Chuẩn bị 7 ngày hiển thị mini weekly
  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <article className="habit-row" aria-label={`Thói quen: ${habit.title}`}>
      <div>
        <h3>{habit.title}</h3>
        <p>
          {habit.frequency === 'DAILY' ? 'Hằng ngày' : 'Hằng tuần'} · Mục tiêu{' '}
          {habit.target_days} ngày / chu kỳ
        </p>

        <div className="habit-foot">
          <span>
            <b>{habit.current_streak} ngày</b> liên tiếp
          </span>
          <div className="week" aria-label="Lịch sử tuần này">
            {daysOfWeek.map((dayLabel, idx) => {
              // Tính sơ lược trạng thái hoàn thành gần đây
              const hasCheck = (habit.logs || []).length > idx && (habit.logs || [])[idx]?.is_completed;
              return (
                <div key={dayLabel} className="day">
                  {dayLabel}
                  <i className={hasCheck ? 'on' : ''}>
                    {hasCheck ? '✓' : '–'}
                  </i>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
        <button
          type="button"
          className={isCheckedInToday ? '' : 'primary'}
          disabled={isCheckedInToday || isCheckInLoading}
          onClick={() => onCheckIn(habit._id)}
          aria-label={isCheckedInToday ? 'Đã check-in hôm nay' : `Check-in ${habit.title}`}
        >
          {isCheckedInToday ? '✓ Đã check-in' : '✓ Check-in · +15 XP'}
        </button>

        <p className="helper" style={{ margin: 0 }}>
          {isCheckedInToday ? 'Đã ghi nhận hôm nay' : 'Mỗi thói quen: 1 lần / ngày'}
        </p>

        <button
          type="button"
          className="quiet small danger"
          onClick={() => onDelete(habit)}
          aria-label={`Ngừng theo dõi ${habit.title}`}
        >
          Ngừng theo dõi
        </button>
      </div>
    </article>
  );
};
