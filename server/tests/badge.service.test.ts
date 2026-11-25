import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { Badge } from '../src/models/Badge';
import { UserBadge } from '../src/models/UserBadge';
import { Notification } from '../src/models/Notification';
import { User } from '../src/models/User';
import { Task } from '../src/models/Task';
import { Habit } from '../src/models/Habit';
import { INITIAL_BADGES, seedBadges } from '../src/scripts/seedBadges';
import { badgeService, checkAndAwardBadges } from '../src/services/badgeService';
import { taskService } from '../src/services/task.service';
import { habitService } from '../src/services/habit.service';
import { levelService } from '../src/services/level.service';
import { processUserStreak } from '../src/cron/streakResetJob';

function makeMockBadges() {
  return INITIAL_BADGES.map((b) => ({
    ...b,
    _id: new mongoose.Types.ObjectId()
  }));
}

describe('[US-S3-03 / TECH-S3-04] Automatic Badge Trigger Engine (badgeService)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Mở khóa huy hiệu theo điều kiện TASK_COUNT, STREAK_DAYS, LEVEL_REACH', () => {
    it('mở khóa FIRST_TASK khi hoàn thành task đầu tiên và tạo Notification loại ACHIEVEMENT', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockBadges = makeMockBadges();
      const firstTaskBadge = mockBadges.find((b) => b.code === 'FIRST_TASK')!;

      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: userId,
        current_streak: 0,
        current_level: 1
      } as any);
      jest.spyOn(Badge, 'find').mockResolvedValue(mockBadges as any);
      jest.spyOn(UserBadge, 'find').mockResolvedValue([] as any);
      jest.spyOn(Task, 'countDocuments').mockResolvedValue(1);

      const ubCreateSpy = jest.spyOn(UserBadge, 'create').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        user_id: userId,
        badge_id: firstTaskBadge._id,
        unlocked_at: new Date()
      } as any);
      const notifCreateSpy = jest.spyOn(Notification, 'create').mockResolvedValue({} as any);

      const unlocked = await checkAndAwardBadges(userId.toString());

      expect(unlocked).toHaveLength(1);
      expect(unlocked[0].code).toBe('FIRST_TASK');
      expect(ubCreateSpy).toHaveBeenCalledTimes(1);
      expect(ubCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          badge_id: firstTaskBadge._id
        })
      );
      expect(notifCreateSpy).toHaveBeenCalledTimes(1);
      expect(notifCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          title: 'Chúc mừng mở khóa huy hiệu!',
          message: `Bạn đã đạt được huy hiệu ${firstTaskBadge.title}`,
          type: 'ACHIEVEMENT',
          is_read: false
        })
      );
    });

    it('mở khóa STREAK_3 và STREAK_7 khi current_streak đạt 7 ngày (không mở STREAK_30)', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockBadges = makeMockBadges();

      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: userId,
        current_streak: 7,
        current_level: 1
      } as any);
      jest.spyOn(Badge, 'find').mockResolvedValue(mockBadges as any);
      jest.spyOn(UserBadge, 'find').mockResolvedValue([] as any);
      jest.spyOn(Task, 'countDocuments').mockResolvedValue(0);
      jest.spyOn(UserBadge, 'create').mockResolvedValue({} as any);
      const notifSpy = jest.spyOn(Notification, 'create').mockResolvedValue({} as any);

      const unlocked = await badgeService.checkAndAwardBadges(userId.toString());
      const codes = unlocked.map((b) => b.code);

      expect(codes).toEqual(['STREAK_3', 'STREAK_7']);
      expect(notifSpy).toHaveBeenCalledTimes(2);
    });

    it('mở khóa LEVEL_2 và LEVEL_5 khi current_level đạt cấp 5 (không mở LEVEL_10)', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockBadges = makeMockBadges();

      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: userId,
        current_streak: 0,
        current_level: 5
      } as any);
      jest.spyOn(Badge, 'find').mockResolvedValue(mockBadges as any);
      jest.spyOn(UserBadge, 'find').mockResolvedValue([] as any);
      jest.spyOn(Task, 'countDocuments').mockResolvedValue(0);
      jest.spyOn(UserBadge, 'create').mockResolvedValue({} as any);
      const notifSpy = jest.spyOn(Notification, 'create').mockResolvedValue({} as any);

      const unlocked = await checkAndAwardBadges(userId.toString());
      const codes = unlocked.map((b) => b.code);

      expect(codes).toEqual(['LEVEL_2', 'LEVEL_5']);
      expect(notifSpy).toHaveBeenCalledTimes(2);
    });

    it('mở khóa đồng thời nhiều loại huy hiệu (TASK_COUNT + LEVEL_REACH + STREAK_DAYS) trong 1 lần quét', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockBadges = makeMockBadges();

      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: userId,
        current_streak: 3,
        current_level: 2
      } as any);
      jest.spyOn(Badge, 'find').mockResolvedValue(mockBadges as any);
      jest.spyOn(UserBadge, 'find').mockResolvedValue([] as any);
      jest.spyOn(Task, 'countDocuments').mockResolvedValue(10);
      jest.spyOn(UserBadge, 'create').mockResolvedValue({} as any);
      jest.spyOn(Notification, 'create').mockResolvedValue({} as any);

      const unlocked = await checkAndAwardBadges(userId.toString());
      const codes = unlocked.map((b) => b.code);

      expect(codes).toEqual(['FIRST_TASK', 'TASK_10', 'STREAK_3', 'LEVEL_2']);
    });
  });

  describe('2. Cơ chế Idempotency (Chống cấp trùng huy hiệu)', () => {
    it('bỏ qua các huy hiệu user đã sở hữu trong user_badges và không tạo notification trùng', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockBadges = makeMockBadges();
      const firstTask = mockBadges.find((b) => b.code === 'FIRST_TASK')!;
      const task10 = mockBadges.find((b) => b.code === 'TASK_10')!;

      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: userId,
        current_streak: 0,
        current_level: 1
      } as any);
      jest.spyOn(Badge, 'find').mockResolvedValue(mockBadges as any);
      // User đã sở hữu FIRST_TASK và TASK_10
      jest.spyOn(UserBadge, 'find').mockResolvedValue([
        { user_id: userId, badge_id: firstTask._id },
        { user_id: userId, badge_id: task10._id }
      ] as any);
      jest.spyOn(Task, 'countDocuments').mockResolvedValue(50);

      const ubCreateSpy = jest.spyOn(UserBadge, 'create').mockResolvedValue({} as any);
      const notifCreateSpy = jest.spyOn(Notification, 'create').mockResolvedValue({} as any);

      const unlocked = await checkAndAwardBadges(userId.toString());

      expect(unlocked.map((b) => b.code)).toEqual(['TASK_50']);
      expect(ubCreateSpy).toHaveBeenCalledTimes(1);
      expect(notifCreateSpy).toHaveBeenCalledTimes(1);
    });

    it('xử lý an toàn lỗi trùng khóa E11000 từ Unique Compound Index { user_id: 1, badge_id: 1 } khi có race condition', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockBadges = makeMockBadges();

      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: userId,
        current_streak: 0,
        current_level: 1
      } as any);
      jest.spyOn(Badge, 'find').mockResolvedValue(mockBadges as any);
      jest.spyOn(UserBadge, 'find').mockResolvedValue([] as any);
      jest.spyOn(Task, 'countDocuments').mockResolvedValue(1);

      const dupError = Object.assign(new Error('E11000 duplicate key error'), { code: 11000 });
      jest.spyOn(UserBadge, 'create').mockRejectedValueOnce(dupError);
      const notifCreateSpy = jest.spyOn(Notification, 'create').mockResolvedValue({} as any);

      const unlocked = await checkAndAwardBadges(userId.toString());

      expect(unlocked).toEqual([]);
      expect(notifCreateSpy).not.toHaveBeenCalled();
    });

    it('trả về mảng rỗng khi user không tồn tại hoặc userId không hợp lệ', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(null);
      jest.spyOn(Badge, 'find').mockResolvedValue(makeMockBadges() as any);

      expect(await checkAndAwardBadges('invalid-id')).toEqual([]);
      expect(await checkAndAwardBadges(new mongoose.Types.ObjectId().toString())).toEqual([]);
    });
  });

  describe('3. Tích hợp gọi checkAndAwardBadges vào Task, Habit, Level và Streak Cronjob', () => {
    it('taskService.completeTask gọi badgeService.checkAndAwardBadges và trả về unlocked_badges', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const taskId = new mongoose.Types.ObjectId().toString();
      const mockTask: any = {
        _id: taskId,
        user_id: userId,
        title: 'Task đầu tiên',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        xp_reward: 20,
        xp_earned: 0,
        completed_at: new Date(),
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({ _id: taskId, title: 'Task đầu tiên', status: 'COMPLETED' })
      };
      const mockUser: any = {
        _id: userId,
        total_xp: 0,
        current_level: 1,
        save: jest.fn().mockResolvedValue(true)
      };
      const awardedBadge = { code: 'FIRST_TASK', title: 'Khởi đầu nan' };

      jest.spyOn(Task, 'findOneAndUpdate').mockResolvedValue(mockTask);
      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
      const badgeSpy = jest
        .spyOn(badgeService, 'checkAndAwardBadges')
        .mockResolvedValue([awardedBadge as any]);

      const result = await taskService.completeTask(userId, taskId);

      expect(badgeSpy).toHaveBeenCalledWith(userId);
      expect(result.unlocked_badges).toEqual([awardedBadge]);
    });

    it('habitService.checkInHabit gọi badgeService.checkAndAwardBadges và trả về unlocked_badges', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const habitId = new mongoose.Types.ObjectId().toString();
      const mockHabit: any = {
        _id: habitId,
        user_id: userId,
        title: 'Đọc sách 30 phút',
        is_active: true,
        current_streak: 0,
        logs: []
      };
      const mockUpdatedHabit: any = {
        ...mockHabit,
        current_streak: 1,
        logs: [{ log_date: '2026-11-25', is_completed: true, xp_earned: 15 }]
      };
      const mockUser: any = {
        _id: userId,
        total_xp: 90,
        current_level: 1,
        save: jest.fn().mockResolvedValue(true)
      };
      const awardedBadge = { code: 'LEVEL_2', title: 'Bước lên nấc thang' };

      jest.spyOn(Habit, 'findOne').mockResolvedValue(mockHabit);
      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(Task, 'find').mockReturnValue({ lean: jest.fn().mockResolvedValue([]) } as any);
      jest.spyOn(Habit, 'find').mockReturnValue({ lean: jest.fn().mockResolvedValue([]) } as any);
      jest.spyOn(Habit, 'findOneAndUpdate').mockResolvedValue(mockUpdatedHabit);
      const badgeSpy = jest
        .spyOn(badgeService, 'checkAndAwardBadges')
        .mockResolvedValue([awardedBadge as any]);

      const result = await habitService.checkInHabit(userId, habitId);

      expect(badgeSpy).toHaveBeenCalledWith(userId);
      expect(result.unlocked_badges).toEqual([awardedBadge]);
    });

    it('levelService.processXPAddition gọi badgeService.checkAndAwardBadges khi người dùng thăng cấp', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const mockUser: any = {
        _id: userId,
        total_xp: 80,
        current_level: 1,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
      const badgeSpy = jest.spyOn(badgeService, 'checkAndAwardBadges').mockResolvedValue([]);

      const result = await levelService.processXPAddition(userId, 30);

      expect(result.level_up).toBe(true);
      expect(result.new_level).toBe(2);
      expect(badgeSpy).toHaveBeenCalledWith(userId);
    });

    it('streakResetJob.processUserStreak gọi badgeService.checkAndAwardBadges khi chuỗi streak tăng lên', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser: any = {
        _id: userId,
        email: 'streak7@ptit.edu.vn',
        current_streak: 6,
        streak_freeze_count: 1,
        last_active_date: '2026-11-24',
        save: jest.fn().mockResolvedValue(true)
      };

      const badgeSpy = jest.spyOn(badgeService, 'checkAndAwardBadges').mockResolvedValue([]);

      const result = await processUserStreak(mockUser, '2026-11-24', '2026-11-25');

      expect(result.action).toBe('INCREMENT');
      expect(result.newStreak).toBe(7);
      expect(badgeSpy).toHaveBeenCalledWith(userId.toString());
    });
  });
});

const mongoUri = process.env.TEST_MONGODB_URI;
const describeWithMongo = mongoUri ? describe : describe.skip;

describeWithMongo('[TECH-S3-04] Badge Trigger Engine Integration with MongoDB', () => {
  beforeAll(async () => {
    await mongoose.connect(mongoUri!, {
      dbName: 'questline_badge_engine_test_' + randomUUID().replace(/-/g, ''),
      serverSelectionTimeoutMS: 5000
    });
    await Promise.all([
      User.init(),
      Task.init(),
      Badge.init(),
      UserBadge.init(),
      Notification.init()
    ]);
    await seedBadges();
  }, 20000);

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    } finally {
      await mongoose.disconnect();
    }
  });

  it('unlocks FIRST_TASK once and enforces idempotency across repeated calls in MongoDB', async () => {
    const user = await User.create({
      email: 'badge.e2e@example.test',
      password_hash: '$2b$10$abcdef1234567890abcdef1234567890abcdef1234567890abcde',
      full_name: 'Badge Tester',
      current_level: 1,
      current_streak: 0
    });

    await Task.create({
      user_id: user._id,
      title: 'First completed task',
      status: 'COMPLETED',
      completed_at: new Date()
    });

    const firstRun = await checkAndAwardBadges(user._id.toString());
    expect(firstRun.map((b) => b.code)).toEqual(['FIRST_TASK']);

    const secondRun = await checkAndAwardBadges(user._id.toString());
    expect(secondRun).toEqual([]);

    expect(await UserBadge.countDocuments({ user_id: user._id })).toBe(1);
    expect(await Notification.countDocuments({ user_id: user._id, type: 'ACHIEVEMENT' })).toBe(1);
  });
});
