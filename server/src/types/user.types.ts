import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
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

export interface RegisterDTO {
  email: string;
  password: string;
  full_name?: string;
  fullName?: string;
}

export interface UpdateProfileDTO {
  full_name?: string;
  fullName?: string;
}

export interface UserProfileResponse {
  _id: string;
  email: string;
  full_name: string;
  current_level: number;
  total_xp: number;
  current_streak: number;
  last_active_date: string | null;
  streak_freeze_count: number;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponseData {
  token: string;
  user: UserProfileResponse;
}
