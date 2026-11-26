import { Badge } from '../models/Badge';
import { UserBadge } from '../models/UserBadge';
import { Task } from '../models/Task';
import { User } from '../models/User';
import type { BadgeConditionType, IBadgeProgress } from '../types/badge.types';

export async function listBadges(userId: string) {
  const [user, taskCount, catalog, unlocks] = await Promise.all([
    User.findById(userId).select('current_level current_streak').lean(),
    Task.countDocuments({ user_id: userId, status: 'COMPLETED' }),
    Badge.find().sort({ condition_type: 1, condition_value: 1, code: 1 }).lean(),
    UserBadge.find({ user_id: userId }).select('badge_id unlocked_at').lean()
  ]);
  if (!user) {
    throw Object.assign(new Error('Không tìm thấy người dùng'), { statusCode: 404, code: 'USER_NOT_FOUND' });
  }

  const unlockedAt = new Map(unlocks.map(item => [item.badge_id.toString(), item.unlocked_at]));
  const progress: Record<BadgeConditionType, number> = {
    TASK_COUNT: taskCount, STREAK_DAYS: user.current_streak ?? 0, LEVEL_REACH: user.current_level ?? 1
  };
  const badges: IBadgeProgress[] = catalog.map(({ _id, code, title, description, icon_url, condition_type, condition_value }) => {
    const id = _id.toString();
    const current_progress = progress[condition_type] ?? 0;
    return {
      id, code, title, description, icon_url, condition_type, condition_value, current_progress,
      target: condition_value,
      progress_percent: Math.min(100, Math.floor((current_progress / condition_value) * 1000) / 10),
      is_unlocked: unlockedAt.has(id),
      unlocked_at: unlockedAt.get(id)?.toISOString() ?? null
    };
  });
  return { total_badges: badges.length, unlocked_count: badges.filter(badge => badge.is_unlocked).length, badges };
}
