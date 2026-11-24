import mongoose, { Types } from 'mongoose';
import { Task } from '../models/Task';
import { User } from '../models/User';

type Condition = 'TASK_COUNT' | 'STREAK_DAYS' | 'LEVEL_REACH';

interface CatalogBadge {
  _id: Types.ObjectId;
  code: string;
  title: string;
  description: string;
  icon_url: string;
  condition_type: Condition;
  condition_value: number;
}

export async function listBadges(userId: string) {
  const db = mongoose.connection.db!;
  const owner = new Types.ObjectId(userId);
  const [user, completed, catalog, unlocks] = await Promise.all([
    User.findById(owner).select('current_level current_streak').lean(),
    Task.countDocuments({ user_id: owner, status: 'COMPLETED' }),
    db.collection<CatalogBadge>('badges').find().sort({ condition_type: 1, condition_value: 1, code: 1 }).toArray(),
    db.collection<{ user_id: Types.ObjectId; badge_id: Types.ObjectId; unlocked_at: Date }>('user_badges')
      .find({ user_id: owner }).toArray()
  ]);
  if (!user) {
    throw Object.assign(new Error('Không tìm thấy người dùng'), { statusCode: 404, code: 'USER_NOT_FOUND' });
  }
  const unlockedAt = new Map(unlocks.map(item => [item.badge_id.toString(), item.unlocked_at]));
  const progress: Record<Condition, number> = {
    TASK_COUNT: completed,
    STREAK_DAYS: user.current_streak,
    LEVEL_REACH: user.current_level
  };
  return catalog.map(badge => {
    const { _id, code, title, description, icon_url, condition_type, condition_value } = badge;
    const date = unlockedAt.get(_id.toString());
    return {
      _id, code, title, description, icon_url, condition_type, condition_value,
      current_progress: progress[condition_type] ?? 0,
      is_unlocked: unlockedAt.has(_id.toString()),
      unlocked_at: date ?? null
    };
  });
}
