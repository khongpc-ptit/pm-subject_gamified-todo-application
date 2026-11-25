import { Types } from 'mongoose';
import { TaskPriority } from './task.types';
import { IBadge } from './badge.types';
export * from './level.types';

export interface DailyXPCapResult {
  currentDayXP: number;
  xp_earned: number;
  is_cap_reached: boolean;
  remaining_xp: number;
}

export interface RevertXPResult {
  userId: string;
  reverted_xp: number;
  total_xp: number;
  current_level: number;
}

export interface CompleteTaskGamificationData {
  task: any;
  xp_earned: number;
  total_xp: number;
  current_level: number;
  level_up: boolean;
  next_level_xp: number;
  is_cap_reached: boolean;
  unlocked_badges?: IBadge[];
  _id?: any;
  status?: string;
  completed_at?: Date | string | null;
}
