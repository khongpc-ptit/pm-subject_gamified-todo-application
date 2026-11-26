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
import { checkAndAwardBadges } from '../src/services/badgeService';
import { createNotification } from '../src/services/notificationService';

describe('[TECH-S3-08] Automated Integration Tests — Notifications & Data Isolation', () => {
  const JWT_SECRET = 'test-secret-sprint3-notifications-suite';
  const userAId = new mongoose.Types.ObjectId();
  const userBId = new mongoose.Types.ObjectId();
  const tokenA = jwt.sign({ id: userAId.toString(), email: 'userA@ptit.edu.vn' }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h'
  });
  const tokenB = jwt.sign({ id: userBId.toString(), email: 'userB@ptit.edu.vn' }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h'
  });

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Tự động tạo notification loại ACHIEVEMENT khi mở khóa badge', () => {
    it('tạo đúng thông báo ACHIEVEMENT (is_read: false) khi badgeService mở khóa huy hiệu', async () => {
      const badgeId = new mongoose.Types.ObjectId();
      const firstTaskSeed = { ...INITIAL_BADGES[0], _id: badgeId };

      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: userAId,
        current_streak: 0,
        current_level: 1
      } as any);
      jest.spyOn(Badge, 'find').mockResolvedValue([firstTaskSeed] as any);
      jest.spyOn(UserBadge, 'find').mockResolvedValue([] as any);
      jest.spyOn(Task, 'countDocuments').mockResolvedValue(1);
      jest.spyOn(UserBadge, 'create').mockResolvedValue({} as any);

      const notifCreateSpy = jest.spyOn(Notification, 'create').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        user_id: userAId,
        title: 'Chúc mừng mở khóa huy hiệu!',
        message: `Bạn đã đạt được huy hiệu ${firstTaskSeed.title}`,
        type: 'ACHIEVEMENT',
        is_read: false
      } as any);

      const unlocked = await checkAndAwardBadges(userAId.toString());

      expect(unlocked).toHaveLength(1);
      expect(notifCreateSpy).toHaveBeenCalledTimes(1);
      expect(notifCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userAId,
          type: 'ACHIEVEMENT',
          is_read: false,
          title: 'Chúc mừng mở khóa huy hiệu!',
          message: `Bạn đã đạt được huy hiệu ${firstTaskSeed.title}`
        })
      );
    });
  });

  describe('2. API GET /api/v1/notifications trả về đúng danh sách và unread_count', () => {
    it('chặn 401 UNAUTHORIZED khi không có JWT token', async () => {
      const res = await request(app).get('/api/v1/notifications');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('trả về danh sách thông báo của user hiện tại kèm unread_count và total chính xác', async () => {
      const createdAt = new Date('2026-11-25T10:00:00.000Z');
      const notif1Id = new mongoose.Types.ObjectId();
      const notif2Id = new mongoose.Types.ObjectId();

      const findSpy = jest.spyOn(Notification, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: notif1Id,
                user_id: userAId,
                title: 'Chúc mừng mở khóa huy hiệu!',
                message: 'Bạn đã đạt được huy hiệu Khởi đầu nan',
                type: 'ACHIEVEMENT',
                is_read: false,
                created_at: createdAt
              },
              {
                _id: notif2Id,
                user_id: userAId,
                title: 'Bảo vệ chuỗi ngày',
                message: 'Chuỗi ngày của bạn đã được bảo vệ',
                type: 'REMINDER',
                is_read: true,
                created_at: createdAt
              }
            ])
          })
        })
      } as any);

      jest
        .spyOn(Notification, 'countDocuments')
        .mockResolvedValueOnce(1) // unread_count
        .mockResolvedValueOnce(2); // total

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        unread_count: 1,
        total: 2
      });
      expect(res.body.data.notifications).toHaveLength(2);
      expect(res.body.data.notifications[0]).toMatchObject({
        id: notif1Id.toString(),
        type: 'ACHIEVEMENT',
        is_read: false
      });

      // Xác minh truy vấn luôn cô lập theo user_id của phiên đăng nhập (Data Isolation)
      expect(findSpy).toHaveBeenCalledWith({ user_id: userAId });
    });
  });

  describe('3. API PATCH /api/v1/notifications/:id/read & PATCH /api/v1/notifications/read-all', () => {
    it('đánh dấu đã đọc 1 thông báo thành công và trả về unread_count mới', async () => {
      const notifId = new mongoose.Types.ObjectId();

      const updateOneSpy = jest
        .spyOn(Notification, 'updateOne')
        .mockResolvedValue({ matchedCount: 1, modifiedCount: 1 } as any);
      jest.spyOn(Notification, 'countDocuments').mockResolvedValue(2);

      const res = await request(app)
        .patch(`/api/v1/notifications/${notifId.toString()}/read`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        id: notifId.toString(),
        is_read: true,
        unread_count: 2
      });
      expect(updateOneSpy).toHaveBeenCalledWith(
        { _id: notifId, user_id: userAId },
        { $set: { is_read: true } }
      );
    });

    it('trả về 400 INVALID_ID khi truyền định danh thông báo không hợp lệ', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/not-a-valid-id/read')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_ID');
    });

    it('đánh dấu tất cả thông báo chưa đọc thành đã đọc qua PATCH /api/v1/notifications/read-all', async () => {
      const updateManySpy = jest
        .spyOn(Notification, 'updateMany')
        .mockResolvedValue({ matchedCount: 3, modifiedCount: 3 } as any);
      jest.spyOn(Notification, 'countDocuments').mockResolvedValue(0);

      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        modified_count: 3,
        unread_count: 0
      });
      expect(updateManySpy).toHaveBeenCalledWith(
        { user_id: userAId, is_read: false },
        { $set: { is_read: true } }
      );
    });
  });

  describe('4. Data Isolation — Chặn User B xem hoặc đánh dấu đã đọc thông báo của User A', () => {
    it('trả về 404 NOTIFICATION_NOT_FOUND khi User B cố tình đánh dấu đọc thông báo thuộc về User A', async () => {
      const userANotifId = new mongoose.Types.ObjectId();

      const updateOneSpy = jest
        .spyOn(Notification, 'updateOne')
        .mockResolvedValue({ matchedCount: 0, modifiedCount: 0 } as any);

      const res = await request(app)
        .patch(`/api/v1/notifications/${userANotifId.toString()}/read`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
      expect(updateOneSpy).toHaveBeenCalledWith(
        { _id: userANotifId, user_id: userBId },
        { $set: { is_read: true } }
      );
    });
  });
});

// =========================================================================
// 5. Integration Tests với MongoDB thật (CI / TEST_MONGODB_URI) [TECH-S3-08]
// =========================================================================
const mongoUri = process.env.TEST_MONGODB_URI;
const describeWithMongo = mongoUri ? describe : describe.skip;

describeWithMongo('[TECH-S3-08] Notifications End-to-End Integration with MongoDB', () => {
  const api = request(app);

  beforeAll(async () => {
    process.env.JWT_SECRET = randomUUID();
    await mongoose.connect(mongoUri!, {
      dbName: 'questline_s3_notifs_' + randomUUID().replace(/-/g, ''),
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

  it('creates ACHIEVEMENT notification on badge unlock, supports read/read-all, and strictly isolates users', async () => {
    const registerUser = async (email: string) => {
      const res = await api
        .post('/api/v1/auth/register')
        .send({ email, password: 'Password123', full_name: 'Notif QA' })
        .expect(201);
      return res.body.data as { token: string; user: { _id: string } };
    };

    const userA = await registerUser('notif.a@example.test');
    const userB = await registerUser('notif.b@example.test');
    const bearer = { type: 'bearer' as const };

    // 1. User A hoàn thành task đầu tiên -> tự động mở khóa FIRST_TASK & tạo notification ACHIEVEMENT
    const task = await api
      .post('/api/v1/tasks')
      .auth(userA.token, bearer)
      .send({ title: 'Trigger achievement notice' })
      .expect(201);
    await api
      .patch(`/api/v1/tasks/${task.body.data._id}/complete`)
      .auth(userA.token, bearer)
      .expect(200);

    // Tạo thêm 1 thông báo REMINDER cho User A và 1 thông báo SYSTEM cho User B
    await createNotification(userA.user._id, 'Nhắc nhở', 'Hãy duy trì chuỗi ngày', 'REMINDER');
    const userBNotice = await createNotification(userB.user._id, 'Hệ thống', 'Thông báo riêng tư B', 'SYSTEM');

    // 2. GET /api/v1/notifications cho User A: chỉ thấy 2 thông báo của User A
    const listA = await api.get('/api/v1/notifications').auth(userA.token, bearer).expect(200);
    expect(listA.body.data.unread_count).toBe(2);
    expect(listA.body.data.total).toBe(2);
    expect(listA.body.data.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'ACHIEVEMENT', is_read: false }),
        expect.objectContaining({ type: 'REMINDER', is_read: false })
      ])
    );

    // 3. Data Isolation: User B chỉ thấy 1 thông báo của mình, và không thể đánh dấu đọc thông báo của User A
    const listB = await api.get('/api/v1/notifications').auth(userB.token, bearer).expect(200);
    expect(listB.body.data.total).toBe(1);
    expect(listB.body.data.notifications[0].id).toBe(userBNotice._id.toString());

    const userAFirstId = listA.body.data.notifications[0].id;
    await api
      .patch(`/api/v1/notifications/${userAFirstId}/read`)
      .auth(userB.token, bearer)
      .expect(404);

    // 4. User A đánh dấu đọc 1 thông báo -> unread_count giảm từ 2 xuống 1
    const readOneRes = await api
      .patch(`/api/v1/notifications/${userAFirstId}/read`)
      .auth(userA.token, bearer)
      .expect(200);
    expect(readOneRes.body.data).toMatchObject({ id: userAFirstId, is_read: true, unread_count: 1 });

    // 5. User A đánh dấu đọc tất cả -> unread_count = 0, User B vẫn còn unread_count = 1
    const readAllRes = await api
      .patch('/api/v1/notifications/read-all')
      .auth(userA.token, bearer)
      .expect(200);
    expect(readAllRes.body.data).toEqual({ modified_count: 1, unread_count: 0 });

    const listBAfter = await api.get('/api/v1/notifications').auth(userB.token, bearer).expect(200);
    expect(listBAfter.body.data.unread_count).toBe(1);
  });
});
