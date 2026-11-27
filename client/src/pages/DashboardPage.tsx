import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { GamificationWidget } from '../components/dashboard/GamificationWidget';
import type { StreakCardProps } from '../components/gamification/StreakCard';
import { dashboardService } from '../services/dashboardService';
import type { DashboardSummaryData } from '../types/dashboard.types';
import '../components/dashboard/dashboard.css';

const WeeklyProductivityChart = lazy(() => import('../components/dashboard/WeeklyProductivityChart'));

interface Props {
  userId?: string;
  revision: number;
  tasks: ReactNode;
  habits?: ReactNode;
  streakProps: StreakCardProps;
  onOpenBadges: () => void;
}

export function DashboardPage({ userId, revision, tasks, habits, streakProps, onOpenBadges }: Props) {
  const [summary, setSummary] = useState<DashboardSummaryData>();
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    setError(null);
    void dashboardService.getDashboardSummary(controller.signal).then(data => {
      if (!controller.signal.aborted) setSummary(data);
    }, () => {
      if (!controller.signal.aborted) setError('Không thể tải thống kê năng suất.');
    });
    return () => controller.abort();
  }, [userId, revision, retry]);

  return (
    <div className="dashboard-overview">
      <h1>Hôm nay, tiến thêm một bước.</h1>
      {summary && <GamificationWidget stats={summary.stats} streakProps={streakProps} onOpenBadges={onOpenBadges} />}
      <div className="dashboard-work">
        <section aria-label="Công việc">{tasks}</section>
        {habits && <section aria-label="Thói quen hôm nay">{habits}</section>}
      </div>
      {userId && <Suspense fallback={<p role="status">Đang tải biểu đồ…</p>}>
        <WeeklyProductivityChart
        data={summary?.weekly_activity ?? []}
        isLoading={!summary && !error}
        error={error}
        onRetry={() => setRetry(value => value + 1)}
      />
      </Suspense>}
    </div>
  );
}
