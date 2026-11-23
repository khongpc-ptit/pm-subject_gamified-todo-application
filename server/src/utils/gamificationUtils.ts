import { LevelProgress, LevelTitleInfo, LevelUpResult } from '../types/level.types';

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
 *
 * Mốc mẫu:
 * - Level 1: 0 – 99 XP
 * - Level 2: 100 – 399 XP
 * - Level 3: 400 – 899 XP
 * - Level 4: 900 – 1599 XP
 * - Level 5: 1600 – 2499 XP
 * - Level 6: 2500 – 3599 XP
 * - Level 7: 3600 – 4899 XP...
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
 *
 * Mốc mẫu:
 * - L = 1: (10 * 0)^2 = 0 XP
 * - L = 2: (10 * 1)^2 = 100 XP
 * - L = 3: (10 * 2)^2 = 400 XP
 * - L = 4: (10 * 3)^2 = 900 XP
 * - L = 5: (10 * 4)^2 = 1600 XP
 * - L = 6: (10 * 5)^2 = 2500 XP
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
 *
 * Mốc mẫu:
 * - L = 1: (10 * 1)^2 = 100 XP
 * - L = 2: (10 * 2)^2 = 400 XP
 * - L = 3: (10 * 3)^2 = 900 XP
 * - L = 4: (10 * 4)^2 = 1600 XP
 * - L = 5: (10 * 5)^2 = 2500 XP
 * - L = 6: (10 * 6)^2 = 3600 XP
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
 *
 * Ràng buộc:
 * - Đảm bảo chia an toàn (không chia cho 0).
 * - Giới hạn phạm vi: min 0%, max 100%.
 * - Làm tròn 2 chữ số thập phân.
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
 * Lấy thông tin danh hiệu cấp bậc tương ứng với Level
 */
export function getLevelTitle(level: number): LevelTitleInfo {
  const safeLevel = Math.max(1, Math.floor(level || 1));
  if (safeLevel >= 6) {
    return { level: safeLevel, title: 'Huyền thoại', title_en: 'Legendary' };
  }
  return LEVEL_TITLES[safeLevel] ?? { level: safeLevel, title: 'Tập sự', title_en: 'Novice' };
}

/**
 * [US-S2-05 / TECH-S2-05]
 * Kiểm tra thăng cấp tự động khi có thay đổi Total_XP:
 * - So sánh old_level và new_level = calculateLevel(newTotalXP)
 * - level_up = new_level > old_level
 * - Trả về đầy đủ thông tin cấp độ, mốc kinh nghiệm và tỷ lệ tiến trình
 */
export function checkLevelProgression(oldLevel: number, newTotalXP: number): LevelUpResult {
  const safeOldLevel = Math.max(1, Math.floor(oldLevel || 1));
  const newLevel = calculateLevel(newTotalXP);
  const levelUp = newLevel > safeOldLevel;
  const reqXP = calculateRequiredXP(newLevel);
  const nextXP = calculateNextLevelXP(newLevel);
  const progressPercent = calculateProgressPercent(newTotalXP, newLevel);
  const titleInfo = getLevelTitle(newLevel);

  return {
    old_level: safeOldLevel,
    new_level: newLevel,
    current_level: newLevel,
    level_up: levelUp,
    total_xp: Math.max(0, Math.floor(newTotalXP || 0)),
    required_xp: reqXP,
    next_level_xp: nextXP,
    progress_percent: progressPercent,
    title: titleInfo.title,
    title_en: titleInfo.title_en
  };
}
