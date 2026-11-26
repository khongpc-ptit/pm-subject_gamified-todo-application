import React from 'react';
import { NotificationBell } from './notifications/NotificationBell';
import { LevelBadge } from './gamification/LevelBadge';
import { XPProgressBar } from './gamification/XPProgressBar';
import { useGamification } from '../context/GamificationContext';

interface HeaderProps {
  notifications?: boolean;
  notificationRefreshKey?: number;
  xp?: number;
  streak?: number;
  freeze?: number;
  level?: number;
}

export const Header: React.FC<HeaderProps> = ({
  xp: propXP,
  streak: propStreak,
  freeze: propFreeze,
  notifications = false,
  notificationRefreshKey = 0,
  level: propLevel
}) => {
  const context = useGamification();
  const xp = propXP !== undefined ? propXP : context.totalXP;
  const level = propLevel !== undefined ? propLevel : context.currentLevel;
  const streak = propStreak !== undefined ? propStreak : context.currentStreak;
  const freeze = propFreeze !== undefined ? propFreeze : context.streakFreezeCount;

  return (
    <header id="header" className="topbar">
      {/* Khối Cấp độ: LevelBadge [TECH-S2-07] */}
      <LevelBadge level={level} />
      {notifications && <NotificationBell refreshKey={notificationRefreshKey} />}

      {/* Khối Tiến trình XP: XPProgressBar [TECH-S2-07] */}
      <XPProgressBar xp={xp} level={level} />

      {/* Khối Daily Streak */}
      <div className="streak">
        <b>{streak} ngày</b>
        <small>DAILY STREAK</small>
      </div>

      {/* Khối Freeze Protection */}
      <div className="freeze">
        ❄️ {freeze} freeze
        <small>Bảo vệ chuỗi của bạn</small>
      </div>

      {/* Ngọn lửa Streak */}
      <div className="header-flame" role="img" aria-label="Ngọn lửa streak">
        <svg
          className="streak-flame"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M13 3c.5 4-3 5-3 8-1-1-1.5-2-1.5-3C6 10 5 12.2 5 15a7 7 0 0 0 14 0c0-3.5-2-6.5-6-12Z" />
          <path d="M12 13c.2 2-2 2.7-2 4.5a2 2 0 0 0 4 0c0-1.3-.7-2.5-2-4.5Z" />
        </svg>
      </div>
    </header>
  );
};

export default Header;
