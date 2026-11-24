export interface LevelTitleInfo {
  level: number;
  title: string;
  title_en: string;
}

export interface LevelProgress {
  current_level: number;
  total_xp: number;
  required_xp: number;
  next_level_xp: number;
  current_level_xp: number;
  level_xp_range: number;
  progress_percent: number;
  title: string;
  title_en: string;
}

export interface LevelUpResult {
  old_level: number;
  new_level: number;
  current_level: number;
  level_up: boolean;
  total_xp: number;
  required_xp: number;
  next_level_xp: number;
  progress_percent: number;
  title: string;
  title_en: string;
}
