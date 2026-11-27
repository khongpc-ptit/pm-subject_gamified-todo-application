export interface DashboardStats {
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  current_level: number;
  total_xp: number;
  current_streak: number;
  unlocked_badges_count: number;
  total_badges_count: number;
}

export interface WeeklyActivityItem {
  date: string; // YYYY-MM-DD (UTC+7)
  tasks_completed: number;
  habits_completed: number;
  xp_earned: number;
}

export interface DashboardSummaryData {
  stats: DashboardStats;
  weekly_activity: WeeklyActivityItem[];
}
