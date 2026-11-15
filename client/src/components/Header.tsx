import React from 'react';

interface HeaderProps {
  xp?: number;
  streak?: number;
  freeze?: number;
  level?: number;
}

export const Header: React.FC<HeaderProps> = ({
  xp = 380,
  streak = 6,
  freeze = 1,
  level = 1
}) => {
  const nextLevelThreshold = 100 * Math.pow(level, 2);
  const currentLevelThreshold = 100 * Math.pow(level - 1, 2);
  const progressPercent = Math.min(
    100,
    Math.max(0, ((xp - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100)
  );

  return (
    <header id="header" className="topbar">
      {/* Khối Cấp độ */}
      <div className="level">
        <div className="level-icon">{level}</div>
        <div>
          <small>CẤP {level} · CHIẾN BINH</small>
          <b>Tiến bộ mỗi ngày</b>
        </div>
      </div>

      {/* Khối Tiến trình XP */}
      <div className="xp">
        <div className="xp-meta">
          <span>{xp} / {nextLevelThreshold} XP</span>
          <span>Cấp {level + 1}</span>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-label="Tiến trình lên cấp"
          aria-valuemin={currentLevelThreshold}
          aria-valuemax={nextLevelThreshold}
          aria-valuenow={xp}
        >
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Khối Daily Streak */}
      <div className="streak">
        <b>{streak} ngày</b>
        <small>DAILY STREAK</small>
      </div>

      {/* Khối Freeze Protection */}
      <div className="freeze">
        ◇ {freeze} freeze
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
