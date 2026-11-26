export type HabitFrequency = 'DAILY' | 'WEEKLY';

export interface HabitLog {
  log_date: string; // Format: YYYY-MM-DD (UTC+7)
  is_completed: boolean;
  xp_earned: number;
}

export interface Habit {
  _id: string;
  user_id: string;
  title: string;
  frequency: HabitFrequency;
  target_days: number;
  current_streak: number;
  is_active: boolean;
  logs: HabitLog[];
  created_at: string;
}

export interface HabitListResponseData {
  habits: Habit[];
  total: number;
}

export interface CreateHabitRequestDTO {
  title: string;
  frequency?: HabitFrequency;
  target_days?: number;
}

export interface UpdateHabitRequestDTO {
  title?: string;
  frequency?: HabitFrequency;
  target_days?: number;
  is_active?: boolean;
}

export interface CheckInHabitResponseData {
  habit: Habit;
  xp_earned: number;
  total_xp: number;
  current_level: number;
  level_up: boolean;
  next_level_xp: number;
  is_cap_reached?: boolean;
  unlocked_badges?: { _id: string }[];
}
