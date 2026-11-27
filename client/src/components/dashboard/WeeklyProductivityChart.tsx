import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import type { WeeklyActivityItem } from '../../types/dashboard.types';
import { formatShortDateLabel, formatFullDateLabel } from '../../utils/dashboardUtils';

export interface WeeklyProductivityChartProps {
  data: WeeklyActivityItem[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

interface TooltipPayloadEntry {
  payload?: WeeklyActivityItem;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

export const CustomProductivityTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label
}) => {
  if (!active || !payload || payload.length === 0 || !payload[0]?.payload) {
    return null;
  }

  const item = payload[0].payload;
  const displayDate = formatFullDateLabel(item.date || label || '');

  return (
    <div className="weekly-chart-tooltip" role="status">
      <div className="weekly-chart-tooltip-date">Ngày {displayDate}</div>
      <div className="weekly-chart-tooltip-row">
        <span className="weekly-chart-dot weekly-chart-dot-tasks" />
        <span>Công việc hoàn thành:</span>
        <strong>{item.tasks_completed}</strong>
      </div>
      <div className="weekly-chart-tooltip-row">
        <span className="weekly-chart-dot weekly-chart-dot-habits" />
        <span>Thói quen check-in:</span>
        <strong>{item.habits_completed}</strong>
      </div>
      <div className="weekly-chart-tooltip-xp">
        <span>XP tích lũy:</span>
        <strong>+{item.xp_earned} XP</strong>
      </div>
    </div>
  );
};

export const WeeklyProductivityChart: React.FC<WeeklyProductivityChartProps> = ({
  data,
  isLoading = false,
  error = null,
  onRetry
}) => {
  const totalTasks = data.reduce((sum, d) => sum + (d.tasks_completed || 0), 0);
  const totalHabits = data.reduce((sum, d) => sum + (d.habits_completed || 0), 0);
  const totalXP = data.reduce((sum, d) => sum + (d.xp_earned || 0), 0);
  const hasAnyActivity = totalTasks > 0 || totalHabits > 0;

  return (
    <section
      className="weekly-chart-card"
      aria-label="Biểu đồ năng suất 7 ngày gần nhất"
    >
      <div className="weekly-chart-header">
        <div>
          <h3 className="weekly-chart-title">Năng suất 7 ngày qua</h3>
          <p className="weekly-chart-subtitle">
            Thống kê theo múi giờ Việt Nam (UTC+7)
          </p>
        </div>
        {!isLoading && !error && hasAnyActivity && (
          <div className="weekly-chart-pills">
            <span className="weekly-chart-pill">{totalTasks} Tasks</span>
            <span className="weekly-chart-pill">{totalHabits} Habits</span>
            <span className="weekly-chart-pill weekly-chart-pill-xp">
              +{totalXP} XP
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div
          className="weekly-chart-skeleton"
          aria-busy="true"
          aria-label="Đang tải biểu đồ năng suất"
        >
          <div className="weekly-chart-skeleton-bars">
            {[45, 75, 55, 90, 65, 80, 50].map((heightPercent, idx) => (
              <div key={idx} className="weekly-chart-skeleton-col">
                <div
                  className="weekly-chart-skeleton-bar"
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
            ))}
          </div>
          <span className="weekly-chart-skeleton-text">
            Đang tổng hợp dữ liệu 7 ngày...
          </span>
        </div>
      ) : error ? (
        <div className="weekly-chart-empty" role="alert">
          <p className="weekly-chart-error-text">{error}</p>
          {onRetry && (
            <button type="button" onClick={onRetry} className="weekly-chart-retry-btn">
              Thử lại
            </button>
          )}
        </div>
      ) : !hasAnyActivity ? (
        <div className="weekly-chart-empty">
          <p className="weekly-chart-empty-title">
            Chưa có hoạt động nào trong 7 ngày qua
          </p>
          <p className="weekly-chart-empty-desc">
            Hoàn thành công việc hoặc điểm danh thói quen hôm nay để bắt đầu theo dõi biểu đồ năng suất.
          </p>
        </div>
      ) : (
        <div className="weekly-chart-canvas">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data}
              margin={{ top: 12, right: 12, left: -16, bottom: 4 }}
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#dde3dc" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDateLabel}
                tick={{ fill: '#737d79', fontSize: 12 }}
                axisLine={{ stroke: '#dde3dc' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#737d79', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomProductivityTooltip />}
                cursor={{ fill: '#eaf0e6', opacity: 0.6 }}
              />
              <Legend
                wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }}
              />
              <Bar
                dataKey="tasks_completed"
                name="Công việc (Tasks)"
                fill="#345b46"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
                isAnimationActive={true}
                animationDuration={500}
              />
              <Bar
                dataKey="habits_completed"
                name="Thói quen (Habits)"
                fill="#ba8135"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
                isAnimationActive={true}
                animationDuration={500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};

export default WeeklyProductivityChart;
