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

export const LEVEL_TITLES: Record<number, LevelTitleInfo> = {
  1: { level: 1, title: 'Tập sự', title_en: 'Novice' },
  2: { level: 2, title: 'Chiến binh', title_en: 'Warrior' },
  3: { level: 3, title: 'Tinh anh', title_en: 'Elite' },
  4: { level: 4, title: 'Cao thủ', title_en: 'Master' },
  5: { level: 5, title: 'Chuyên gia', title_en: 'Expert' },
  6: { level: 6, title: 'Huyền thoại', title_en: 'Legendary' }
};

/**
 * [US-S2-05 / TECH-S2-05]
 * Công thức tính cấp độ chuẩn:
 * Level(X) = floor(sqrt(Total_XP) / 10) + 1
 */
export function calculateLevel(totalXP: number): number {
  if (typeof totalXP !== 'number' || isNaN(totalXP) || totalXP <= 0) {
    return 1;
  }
  return Math.floor(Math.sqrt(totalXP) / 10) + 1;
}

/**
 * [US-S2-05 / TECH-S2-05]
 * Điểm kinh nghiệm tối thiểu (ngưỡng) để đạt cấp Level L:
 * Required_XP(L) = (10 * (L - 1))^2
 */
export function calculateRequiredXP(level: number): number {
  if (typeof level !== 'number' || isNaN(level) || level <= 1) {
    return 0;
  }
  const safeLevel = Math.floor(level);
  return Math.pow(10 * (safeLevel - 1), 2);
}

/**
 * [US-S2-05 / TECH-S2-05]
 * Điểm kinh nghiệm cần thiết để đạt cấp kế tiếp (L + 1):
 * Next_Level_XP(L) = (10 * L)^2
 */
export function calculateNextLevelXP(level: number): number {
  if (typeof level !== 'number' || isNaN(level) || level < 1) {
    return 100;
  }
  const safeLevel = Math.floor(level);
  return Math.pow(10 * safeLevel, 2);
}

/**
 * [US-S2-05 / TECH-S2-05]
 * Tính tỷ lệ phần trăm tiến trình trong cấp hiện tại:
 * Progress_Percent = ((Total_XP - Required_XP) / (Next_Level_XP - Required_XP)) * 100%
 */
export function calculateProgressPercent(totalXP: number, level?: number): number {
  if (typeof totalXP !== 'number' || isNaN(totalXP) || totalXP <= 0) {
    return 0;
  }

  const safeLevel = level !== undefined && !isNaN(level) && level >= 1
    ? Math.floor(level)
    : calculateLevel(totalXP);

  const reqXP = calculateRequiredXP(safeLevel);
  const nextXP = calculateNextLevelXP(safeLevel);
  const range = nextXP - reqXP;

  if (range <= 0) {
    return 0;
  }

  const currentLevelXP = Math.max(0, totalXP - reqXP);
  const rawPercent = (currentLevelXP / range) * 100;
  const clamped = Math.min(100, Math.max(0, rawPercent));

  return Math.round(clamped * 100) / 100;
}

/**
 * Lấy thông tin danh hiệu cấp bậc
 */
export function getLevelTitle(level: number): LevelTitleInfo {
  const safeLevel = Math.max(1, Math.floor(level || 1));
  if (safeLevel >= 6) {
    return { level: safeLevel, title: 'Huyền thoại', title_en: 'Legendary' };
  }
  return LEVEL_TITLES[safeLevel] ?? { level: safeLevel, title: 'Tập sự', title_en: 'Novice' };
}
