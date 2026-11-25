export interface UserProfile {
  _id: string;
  email: string;
  full_name: string;
  current_level: number;
  total_xp: number;
  current_streak: number;
  last_active_date: string | null;
  streak_freeze_count: number;
  streak_frozen_date?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface RegisterRequestDTO {
  email: string;
  password: string;
  full_name: string;
}

export interface UpdateProfileRequestDTO {
  full_name: string;
}

export interface AuthResponseData {
  token: string;
  user: UserProfile;
}
