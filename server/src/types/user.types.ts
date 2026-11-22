import { Document } from 'mongoose';

export interface IUser extends Document {
  reset_password_hash?: string;
  reset_password_expires?: Date;
  email: string;
  password_hash: string;
  full_name: string;
  current_level: number;
  total_xp: number;
  current_streak: number;
  last_active_date: string | null;
  streak_freeze_count: number;
  created_at: Date;
  updated_at: Date;
}
