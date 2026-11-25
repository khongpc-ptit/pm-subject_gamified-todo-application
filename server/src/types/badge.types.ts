import { Document, Types } from 'mongoose';

export type BadgeConditionType = 'TASK_COUNT' | 'STREAK_DAYS' | 'LEVEL_REACH';

export interface IBadge extends Document {
  _id: Types.ObjectId;
  code: string;
  title: string;
  description: string;
  icon_url: string;
  condition_type: BadgeConditionType;
  condition_value: number;
  created_at?: Date;
}

export interface IUserBadge extends Document {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  badge_id: Types.ObjectId;
  unlocked_at: Date;
}

export interface IBadgeProgress {
  id: string;
  code: string;
  title: string;
  description: string;
  icon_url: string;
  condition_type: BadgeConditionType;
  condition_value: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
  current_progress: number;
  target: number;
  progress_percent: number;
}
