import React from 'react';
import { useGamification } from '../../context/GamificationContext';
import {
  calculateLevel,
  calculateRequiredXP,
  calculateNextLevelXP,
  calculateProgressPercent
} from '../../utils/gamificationUtils';

export interface XPProgressBarProps {
  xp?: number;
  level?: number;
  showMeta?: boolean;
  showRemaining?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  xp: propXP,
  level: propLevel,
  showMeta = true,
  showRemaining = true,
  className = '',
  size = 'md'
}) => {
  const context = useGamification();

  // Sử dụng giá trị từ props nếu có, nếu không thì lấy từ GamificationContext
  const xp = propXP !== undefined ? propXP : context.totalXP;
  const level = propLevel !== undefined ? propLevel : (propXP !== undefined ? calculateLevel(propXP) : context.currentLevel);

  const reqXP = propLevel !== undefined || propXP !== undefined ? calculateRequiredXP(level) : context.requiredXP;
  const nextXP = propLevel !== undefined || propXP !== undefined ? calculateNextLevelXP(level) : context.nextLevelXP;
  const progressPercent = propLevel !== undefined || propXP !== undefined
    ? calculateProgressPercent(xp, level)
    : context.progressPercent;

  const currentLevelXP = Math.max(0, xp - reqXP);
  const levelXPRange = Math.max(1, nextXP - reqXP);
  const remainingXP = Math.max(0, nextXP - xp);

  return (
    <div className={`xp-progress-container xp ${className}`} data-testid="xp-progress-bar">
      {showMeta && (
        <div className="xp-meta">
          <span className="xp-current" data-testid="xp-text">
            {currentLevelXP}/{levelXPRange} XP · {progressPercent}%
          </span>
          <span className="xp-next" data-testid="xp-next-level">
            Cấp {level + 1}
            {showRemaining && remainingXP > 0 && ` (còn ${remainingXP} XP)`}
          </span>
        </div>
      )}

      <div
        className={`progress progress-${size}`}
        role="progressbar"
        aria-label="Tiến trình lên cấp"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        title={`Tiến trình cấp độ: ${progressPercent}% (${currentLevelXP}/${levelXPRange} XP)`}
      >
        <span
          className="progress-fill"
          style={{
            width: `${progressPercent}%`,
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          data-testid="progress-bar-fill"
        />
      </div>
    </div>
  );
};

export default XPProgressBar;
