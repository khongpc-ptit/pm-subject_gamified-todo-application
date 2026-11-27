import { LevelBadge } from '../gamification/LevelBadge';
import { XPProgressBar } from '../gamification/XPProgressBar';
import { StreakCard, type StreakCardProps } from '../gamification/StreakCard';
import type { DashboardStats } from '../../types/dashboard.types';

interface Props {
  stats: DashboardStats;
  streakProps: StreakCardProps;
  onOpenBadges: () => void;
}

export function GamificationWidget({ stats, streakProps, onOpenBadges }: Props) {
  return (
    <section aria-label="Tổng quan tiến trình" className="dashboard-stats">
      <div className="card dashboard-stat">
        <h2>Cấp độ</h2>
        <LevelBadge level={stats.current_level} />
        <XPProgressBar xp={stats.total_xp} level={stats.current_level} />
      </div>
      <StreakCard {...streakProps} currentStreak={stats.current_streak} />
      <div className="card dashboard-stat">
        <h2>Huy hiệu</h2>
        <p className="metric">{stats.unlocked_badges_count}/{stats.total_badges_count}</p>
        <button type="button" className="small" onClick={onOpenBadges}>Xem bộ sưu tập</button>
      </div>
      <div className="card dashboard-stat">
        <h2>Tỷ lệ hoàn thành</h2>
        <p className="metric">{stats.completion_rate}%</p>
        <p>{stats.completed_tasks}/{stats.total_tasks} công việc</p>
      </div>
    </section>
  );
}
