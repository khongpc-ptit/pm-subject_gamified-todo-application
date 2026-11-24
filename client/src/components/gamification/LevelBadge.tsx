import React from 'react';
import { useGamification } from '../../context/GamificationContext';
import { getLevelTitle } from '../../utils/gamificationUtils';

export interface LevelBadgeProps {
  level?: number;
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconOnly?: boolean;
}

export const LEVEL_SYMBOLS: Record<number, string> = {
  1: '♟', // Tập sự (Novice)
  2: '♞', // Chiến binh (Warrior)
  3: '♝', // Tinh anh (Elite)
  4: '♜', // Cao thủ (Master)
  5: '♛', // Chuyên gia (Expert)
  6: '♚'  // Huyền thoại (Legendary)
};

export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level: propLevel,
  title: propTitle,
  subtitle = 'Tiến bộ mỗi ngày',
  showTitle = true,
  size = 'md',
  className = '',
  iconOnly = false
}) => {
  const context = useGamification();
  const level = propLevel !== undefined ? propLevel : context.currentLevel;
  const titleInfo = getLevelTitle(level);
  const title = propTitle || titleInfo.title;
  const symbol = LEVEL_SYMBOLS[Math.min(6, Math.max(1, level))] || '★';

  return (
    <div
      className={`level level-badge-wrapper level-badge-${size} ${className}`}
      data-testid="level-badge"
      title={`Cấp độ ${level}: ${title} (${titleInfo.title_en})`}
    >
      {/* Biểu tượng khiên cấp độ */}
      <div className="level-icon" data-testid="level-badge-icon" aria-label={`Cấp ${level}`}>
        <span className="level-number">{level}</span>
      </div>

      {/* Thông tin danh hiệu đi kèm */}
      {showTitle && !iconOnly && (
        <div className="level-info" data-testid="level-badge-info">
          <small className="level-title-tag">
            <span className="level-symbol" aria-hidden="true" style={{ marginRight: '4px' }}>
              {symbol}
            </span>
            CẤP {level} · {title.toUpperCase()}
          </small>
          <b className="level-subtitle">{subtitle}</b>
        </div>
      )}
    </div>
  );
};

export default LevelBadge;
