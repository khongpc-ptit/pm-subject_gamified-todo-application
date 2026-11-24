import mongoose, { Types } from 'mongoose';
import { api, describeWithMongo, registerFixture, useSprint2Database } from './sprint2Fixture';
import { Task } from '../src/models/Task';
import { User } from '../src/models/User';

describeWithMongo('Badge showcase API', () => {
  useSprint2Database();

  it('returns the catalog with owned unlocks and progress from actual account data', async () => {
    const owner = await registerFixture();
    const other = await registerFixture();
    const db = mongoose.connection.db!;
    const unlockedAt = new Date('2026-11-24T12:00:00Z');
    const shared = { description: 'Milestone', icon_url: '/badge.webp' };
    const entries = [
      { _id: new Types.ObjectId(), code: 'FIRST_TASK', title: 'First task', condition_type: 'TASK_COUNT', condition_value: 1 },
      { _id: new Types.ObjectId(), code: 'STREAK_7', title: 'Seven days', condition_type: 'STREAK_DAYS', condition_value: 7 },
      { _id: new Types.ObjectId(), code: 'LEVEL_5', title: 'Level five', condition_type: 'LEVEL_REACH', condition_value: 5 }
    ];
    await db.collection('badges').insertMany(entries.map(entry => ({ ...shared, ...entry })));
    await db.collection('user_badges').insertMany([
      { user_id: new Types.ObjectId(owner.user._id), badge_id: entries[0]._id, unlocked_at: unlockedAt },
      { user_id: new Types.ObjectId(other.user._id), badge_id: entries[1]._id, unlocked_at: unlockedAt }
    ]);
    await Task.create([
      { user_id: owner.user._id, title: 'Owned complete', status: 'COMPLETED' },
      { user_id: owner.user._id, title: 'Owned incomplete', status: 'TODO' },
      { user_id: other.user._id, title: 'Foreign complete', status: 'COMPLETED' }
    ]);
    await User.updateOne({ _id: owner.user._id }, { current_streak: 3, current_level: 2 });
    const path = '/api/v1/gamification/badges';
    await api.get(path).expect(401);
    const result = await api.get(path).auth(owner.token, { type: 'bearer' }).expect(200);
    expect(result.body).toMatchObject({ success: true, timestamp: expect.any(String) });
    expect(result.body.data).toHaveLength(3);
    expect(result.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'FIRST_TASK', is_unlocked: true, unlocked_at: unlockedAt.toISOString(), current_progress: 1 }),
      expect.objectContaining({ code: 'STREAK_7', is_unlocked: false, unlocked_at: null, current_progress: 3, condition_value: 7 }),
      expect.objectContaining({ code: 'LEVEL_5', is_unlocked: false, unlocked_at: null, current_progress: 2, condition_value: 5 })
    ]));
  });
});
