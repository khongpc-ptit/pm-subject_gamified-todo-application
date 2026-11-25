import { Document, Types } from 'mongoose';
import { IBadge } from './badge.types';

export type HabitFrequency = 'DAILY' | 'WEEKLY';

export interface IHabitLog {
  log_date: string; // Format: YYYY-MM-DD
  is_completed: boolean;
  xp_earned: number;
}

export interface IHabit extends Document {
  user_id: Types.ObjectId;
  title: string;
  frequency: HabitFrequency;
  target_days: number;
  current_streak: number;
  is_active: boolean;
  logs: IHabitLog[];
  created_at: Date;
}

export interface CreateHabitDTO {
  title: string;
  frequency?: HabitFrequency;
  target_days?: number;
}

export interface UpdateHabitDTO {
  title?: string;
  frequency?: HabitFrequency;
  target_days?: number;
  is_active?: boolean;
}

export interface HabitListResponseData {
  habits: IHabit[];
  total: number;
}

export interface CheckInHabitResponseData {
  habit: IHabit;
  xp_earned: number;
  total_xp: number;
  current_level: number;
  level_up: boolean;
  next_level_xp: number;
  is_cap_reached?: boolean;
  unlocked_badges?: IBadge[];
}
