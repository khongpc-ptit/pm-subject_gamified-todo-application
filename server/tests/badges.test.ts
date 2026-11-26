import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { Badge } from '../src/models/Badge';
import { UserBadge } from '../src/models/UserBadge';
import { Notification } from '../src/models/Notification';
import { Task } from '../src/models/Task';
import { User } from '../src/models/User';
import { INITIAL_BADGES, seedBadges } from '../src/scripts/seedBadges';
import { badgeService, checkAndAwardBadges } from '../src/services/badgeService';
import { taskService } from '../src/services/task.service';
import { processUserStreak, runStreakScan } from '../src/cron/streakResetJob';

function buildMockCatalog() {
  return INITIAL_BADGES.map((item) => ({
    ...item,
    _id: new mongoose.Types.ObjectId()
  }));
}

describe('[TECH-S3-08] Automated Integration Tests — Badges & Unlock Engine', () => {
  const JWT_SECRET = 'test-secret-sprint3-badges-suite';

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Mở khóa huy hiệu FIRST_TASK ngay lần đầu hoàn thành task', () => {
    it('tự động mở khóa FIRST_TASK khi hoàn thành công việc đầu tiên và tạo thông báo ACHIEVEMENT', async () => {
      const userId = new mongoose.Types.ObjectId();
      const taskId = new mongoose.Types.ObjectId();
      const catalog = buildMockCatalog();
      const firstTaskBadge = catalog.find((b) => b.code === 'FIRST_TASK')!;

      const mockTask: any = {
        _id: taskId,
        user_id: userId,
        title: 'Công việc đầu tiên',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        xp_reward: 20,
        xp_earned: 0,
        completed_at: new Date(),
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({ _id: taskId, title: 'Công việc đầu tiên', status: 'COMPLETED' })
      };
      const mockUser: any = {
        _id: userId,
        total_xp: 0,
        current_level: 1,
        current_streak: 0,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(Task, 'findOneAndUpdate').mockResolvedValue(mockTask);
      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(Badge, 'find').mockResolvedValue(catalog as any);
      jest.spyOn(UserBadge, 'find').mockResolvedValue([] as any);
      jest.spyOn(Task, 'countDocuments').mockResolvedValue(1);

      const createUserBadgeSpy = jest.spyOn(UserBadge, 'create').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        user_id: userId,
        badge_id: firstTaskBadge._id,
        unlocked_at: new Date()
      } as any);
      const createNotifSpy = jest.spyOn(Notification, 'create').mockResolvedValue({} as any);

      const completed = await taskService.completeTask(userId.toString(), taskId.toString());

      expect(completed.unlocked_badges.map((b: any) => b.code)).toEqual(['FIRST_TASK']);
      expect(createUserBadgeSpy).toHaveBeenCalledTimes(1);
      expect(createUserBadgeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: userId, badge_id: firstTaskBadge._id })
      );
      expect(createNotifSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          type: 'ACHIEVEMENT',
          title: 'Chúc mừng mở khóa huy hiệu!',
          message: `Bạn đã đạt được huy hiệu ${firstTaskBadge.title}`
        })
      );
    });
  });

  describe('2. Mở khóa huy hiệu STREAK_7 khi đạt chuỗi 7 ngày liên tục', () => {
    it('tự động mở khóa STREAK_7 khi Cronjob tăng chuỗi từ 6 lên 7 ngày', async () => {
      const userId = new mongoose.Types.ObjectId();
      const catalog = buildMockCatalog();
      const streak3 = catalog.find((b) => b.code === 'STREAK_3')!;
      const streak7 = catalog.find((b) => b.code === 'STREAK_7')!;

      const mockUser: any = {
        _id: userId,
        email: 'streak7@ptit.edu.vn',
        current_streak: 6,
        current_level: 1,
        streak_freeze_count: 1,
        last_active_date: '2026-11-24',
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(Badge, 'find').mockResolvedValue(catalog as any);
      // Giả sử STREAK_3 đã mở trước đó, chỉ còn STREAK_7 chưa mở
      jest.spyOn(UserBadge, 'find').mockResolvedValue([
        { user_id: userId, badge_id: streak3._id }
      ] as any);
      jest.spyOn(Task, 'countDocuments').mockResolvedValue(0);

      const createUserBadgeSpy = jest.spyOn(UserBadge, 'create').mockResolvedValue({} as any);
      const createNotifSpy = jest.spyOn(Notification, 'create').mockResolvedValue({} as any);

      const streakResult = await processUserStreak(mockUser, '2026-11-24', '2026-11-25');

      expect(streakResult.action).toBe('INCREMENT');
      expect(streakResult.newStreak).toBe(7);
      expect(createUserBadgeSpy).toHaveBeenCalledTimes(1);
      expect(createUserBadgeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: userId, badge_id: streak7._id })
      );
      expect(createNotifSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          type: 'ACHIEVEMENT',
          message: `Bạn đã đạt được huy hiệu ${streak7.title}`
        })
      );
    });
  });

  describe('3. Unique Compound Index { user_id: 1, badge_id: 1 } chống cấp trùng huy hiệu', () => {
    it('khai báo Unique Compound Index { user_id: 1, badge_id: 1 } trên UserBadge Schema', () => {
      const indexes = UserBadge.schema.indexes();
      const uniqueCompound = indexes.find(
        ([fields, options]) =>
          fields.user_id === 1 && fields.badge_id === 1 && options?.unique === true
      );
      expect(uniqueCompound).toBeDefined();
    });

    it('không cấp trùng huy hiệu và không tạo notification trùng khi gặp lỗi E11000 hoặc đã sở hữu', async () => {
      const userId = new mongoose.Types.ObjectId();
      const catalog = buildMockCatalog();

      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: userId,
        current_streak: 0,
        current_level: 1
      } as any);
      jest.spyOn(Badge, 'find').mockResolvedValue(catalog as any);
      jest.spyOn(UserBadge, 'find').mockResolvedValue([] as any);
      jest.spyOn(Task, 'countDocuments').mockResolvedValue(1);

      const duplicateKeyErr = Object.assign(new Error('E11000 duplicate key error'), { code: 11000 });
      jest.spyOn(UserBadge, 'create').mockRejectedValueOnce(duplicateKeyErr);
      const notifSpy = jest.spyOn(Notification, 'create').mockResolvedValue({} as any);

      const awarded = await checkAndAwardBadges(userId.toString());

      expect(awarded).toEqual([]);
      expect(notifSpy).not.toHaveBeenCalled();
    });
  });

  describe('4. API GET /api/v1/gamification/badges trả về đúng cờ is_unlocked: true/false', () => {
    it('trả về 401 UNAUTHORIZED khi không đính kèm Bearer JWT token', async () => {
      const res = await request(app).get('/api/v1/gamification/badges');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('trả về danh mục huy hiệu với is_unlocked: true cho huy hiệu đã đạt và false cho huy hiệu chưa đạt', async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = jwt.sign({ id: userId.toString(), email: 'badges.qa@ptit.edu.vn' }, JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: '1h'
      });

      const unlockedAt = new Date('2026-11-25T08:00:00.000Z');
      const catalog = buildMockCatalog().slice(0, 3); // FIRST_TASK, TASK_10, TASK_50

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ _id: userId, current_level: 2, current_streak: 4 })
        })
      } as any);
      jest.spyOn(Task, 'countDocuments').mockResolvedValue(4);
      jest.spyOn(Badge, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(catalog)
        })
      } as any);
      jest.spyOn(UserBadge, 'find').mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { badge_id: catalog[0]._id, unlocked_at: unlockedAt }
          ])
        })
      } as any);

      const res = await request(app)
        .get('/api/v1/gamification/badges')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        total_badges: 3,
        unlocked_count: 1
      });

      const firstTask = res.body.data.badges.find((b: any) => b.code === 'FIRST_TASK');
      const task10 = res.body.data.badges.find((b: any) => b.code === 'TASK_10');

      expect(firstTask).toMatchObject({
        is_unlocked: true,
        unlocked_at: unlockedAt.toISOString(),
        current_progress: 4,
        target: 1,
        progress_percent: 100
      });
      expect(task10).toMatchObject({
        is_unlocked: false,
        unlocked_at: null,
        current_progress: 4,
        target: 10,
        progress_percent: 40
      });
    });
  });
});

// =========================================================================
// 5. Integration Tests với MongoDB thật (CI / TEST_MONGODB_URI) [TECH-S3-08]
// =========================================================================
const mongoUri = process.env.TEST_MONGODB_URI;
const describeWithMongo = mongoUri ? describe : describe.skip;

describeWithMongo('[TECH-S3-08] Badges End-to-End Integration with MongoDB', () => {
  const api = request(app);

  beforeAll(async () => {
    process.env.JWT_SECRET = randomUUID();
    await mongoose.connect(mongoUri!, {
      dbName: 'questline_s3_badges_' + randomUUID().replace(/-/g, ''),
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

  it('unlocks FIRST_TASK on task completion, STREAK_7 on 7-day streak, enforces unique compound index, and reflects is_unlocked via API', async () => {
    const reg = await api
      .post('/api/v1/auth/register')
      .send({
        email: 'badges.e2e@example.test',
        password: 'Password123',
        full_name: 'Badges QA'
      })
      .expect(201);

    const { token, user } = reg.body.data as { token: string; user: { _id: string } };
    const bearer = { type: 'bearer' as const };

    // 1. Hoàn thành task đầu tiên -> mở khóa FIRST_TASK
    const taskRes = await api
      .post('/api/v1/tasks')
      .auth(token, bearer)
      .send({ title: 'First task for badge', priority: 'MEDIUM' })
      .expect(201);
    await api
      .patch(`/api/v1/tasks/${taskRes.body.data._id}/complete`)
      .auth(token, bearer)
      .expect(200);

    // 2. Chạy Cronjob tăng streak 6 -> 7 -> mở khóa STREAK_3 & STREAK_7
    await User.updateOne(
      { _id: user._id },
      { $set: { current_streak: 6, last_active_date: '2026-11-24' } }
    );
    await runStreakScan(new Date('2026-11-24T17:05:00.000Z'));

    // 3. Kiểm tra Unique Compound Index { user_id: 1, badge_id: 1 } chặn insert trùng ở tầng MongoDB
    const firstTaskBadge = await Badge.findOne({ code: 'FIRST_TASK' }).orFail();
    await expect(
      UserBadge.create({ user_id: new mongoose.Types.ObjectId(user._id), badge_id: firstTaskBadge._id })
    ).rejects.toMatchObject({ code: 11000 });

    // Gọi lại checkAndAwardBadges không tạo trùng bản ghi
    const repeated = await badgeService.checkAndAwardBadges(user._id);
    expect(repeated).toEqual([]);

    // 4. Kiểm tra GET /api/v1/gamification/badges trả về đúng is_unlocked: true/false
    const catalogRes = await api
      .get('/api/v1/gamification/badges')
      .auth(token, bearer)
      .expect(200);

    expect(catalogRes.body.success).toBe(true);
    expect(catalogRes.body.data.total_badges).toBe(10);
    expect(catalogRes.body.data.badges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'FIRST_TASK', is_unlocked: true, unlocked_at: expect.any(String) }),
        expect.objectContaining({ code: 'STREAK_7', is_unlocked: true, unlocked_at: expect.any(String) }),
        expect.objectContaining({ code: 'STREAK_30', is_unlocked: false, unlocked_at: null }),
        expect.objectContaining({ code: 'TASK_50', is_unlocked: false, unlocked_at: null })
      ])
    );
  });
});
