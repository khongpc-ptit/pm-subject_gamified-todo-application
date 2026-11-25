import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { User } from '../src/models/User';
import { gamificationService, getVietnamDateString } from '../src/services/gamificationService';
import { gamificationController } from '../src/controllers/gamificationController';
import { processUserStreak } from '../src/cron/streakResetJob';

const JWT_SECRET = 'test-secret-streak-freeze-sprint3';

describe('[US-S3-02 / TECH-S3-03] Streak Freeze API & Service Flow', () => {
  const userId = new mongoose.Types.ObjectId().toString();
  const validToken = jwt.sign({ id: userId, email: 'hung.lm@ptit.edu.vn' }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h'
  });

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Xác thực JWT (Authentication Middleware)', () => {
    it('trả về 401 UNAUTHORIZED khi không đính kèm Authorization header', async () => {
      const res = await request(app).post('/api/v1/gamification/freeze-streak');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.timestamp).toBeDefined();
    });

    it('trả về 401 UNAUTHORIZED khi JWT token không hợp lệ hoặc hết hạn', async () => {
      const expiredToken = jwt.sign({ id: userId, email: 'hung.lm@ptit.edu.vn' }, JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: -10
      });

      const res = await request(app)
        .post('/api/v1/gamification/freeze-streak')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('2. Endpoint POST /api/v1/gamification/freeze-streak & GamificationService', () => {
    it('exports gamificationController.freezeStreak handler', () => {
      expect(typeof gamificationController.freezeStreak).toBe('function');
    });

    it('khởi tạo tài khoản mới mặc định có 01 lượt đóng băng (streak_freeze_count = 1)', () => {
      const doc = new User({
        email: 'newuser@ptit.edu.vn',
        password_hash: '$2b$10$abcdef1234567890abcdef1234567890abcdef1234567890abcde',
        full_name: 'Người Dùng Mới'
      });

      expect(doc.streak_freeze_count).toBe(1);
      expect(doc.current_streak).toBe(0);
    });

    it('trừ 1 lượt đóng băng, cập nhật trạng thái bảo vệ ngày hiện tại và trả về JSON Envelope chuẩn khi streak_freeze_count > 0', async () => {
      const todayVN = getVietnamDateString();
      const mockUser: any = {
        _id: new mongoose.Types.ObjectId(userId),
        email: 'hung.lm@ptit.edu.vn',
        current_streak: 7,
        streak_freeze_count: 1,
        streak_frozen_date: null,
        last_active_date: '2026-11-23',
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/gamification/freeze-streak')
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        streak_freeze_count: 0,
        current_streak: 7,
        is_protected: true,
        frozen_date: todayVN
      });
      expect(typeof res.body.message).toBe('string');
      expect(res.body.timestamp).toBeDefined();

      expect(mockUser.streak_freeze_count).toBe(0);
      expect(mockUser.streak_frozen_date).toBe(todayVN);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
    });

    it('trả về 400 Bad Request (NO_FREEZE_REMAINING) khi user.streak_freeze_count <= 0', async () => {
      const mockUser: any = {
        _id: new mongoose.Types.ObjectId(userId),
        email: 'hung.lm@ptit.edu.vn',
        current_streak: 5,
        streak_freeze_count: 0,
        streak_frozen_date: null,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/gamification/freeze-streak')
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NO_FREEZE_REMAINING');
      expect(res.body.error.message).toContain('Bạn không còn lượt đóng băng chuỗi');
      expect(res.body.timestamp).toBeDefined();
      expect(mockUser.streak_freeze_count).toBe(0);
      expect(mockUser.save).not.toHaveBeenCalled();
    });

    it('trả về 400 STREAK_ALREADY_FROZEN nếu trong cùng ngày đã kích hoạt đóng băng rồi (tránh trừ trùng khi còn lượt)', async () => {
      const todayVN = getVietnamDateString();
      const mockUser: any = {
        _id: new mongoose.Types.ObjectId(userId),
        email: 'hung.lm@ptit.edu.vn',
        current_streak: 5,
        streak_freeze_count: 2,
        streak_frozen_date: todayVN,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/gamification/freeze-streak')
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('STREAK_ALREADY_FROZEN');
      expect(mockUser.streak_freeze_count).toBe(2);
      expect(mockUser.save).not.toHaveBeenCalled();
    });

    it('trả về 404 USER_NOT_FOUND khi không tìm thấy người dùng', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/gamification/freeze-streak')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('chống race condition khi gửi 2 request đóng băng đồng thời (chỉ trừ đúng 1 lượt)', async () => {
      const mockUser: any = {
        _id: new mongoose.Types.ObjectId(userId),
        email: 'hung.lm@ptit.edu.vn',
        current_streak: 9,
        streak_freeze_count: 1,
        streak_frozen_date: null,
        save: jest.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 15));
          return true;
        })
      };

      jest.spyOn(User, 'findById').mockImplementation((async () => mockUser) as any);

      const [res1, res2] = await Promise.all([
        request(app).post('/api/v1/gamification/freeze-streak').set('Authorization', `Bearer ${validToken}`),
        request(app).post('/api/v1/gamification/freeze-streak').set('Authorization', `Bearer ${validToken}`)
      ]);

      const statuses = [res1.status, res2.status].sort((a, b) => a - b);
      expect(statuses).toEqual([200, 400]);
      expect(mockUser.streak_freeze_count).toBe(0);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. Tích hợp với Cronjob 00:05 UTC+7 (processUserStreak)', () => {
    it('giữ nguyên chuỗi current_streak mà không bị reset về 0 và không trừ thêm freeze khi ngày hôm qua đã chủ động đóng băng', async () => {
      const yesterday = '2026-11-24';
      const today = '2026-11-25';

      const mockUser: any = {
        _id: new mongoose.Types.ObjectId(userId),
        email: 'proactive_freeze@ptit.edu.vn',
        current_streak: 12,
        streak_freeze_count: 0, // Đã tiêu 1 lượt chủ động trong ngày 2026-11-24
        streak_frozen_date: yesterday,
        last_active_date: '2026-11-23',
        save: jest.fn().mockResolvedValue(true)
      };

      const result = await processUserStreak(mockUser, yesterday, today);

      expect(result.action).toBe('MAINTAIN_FREEZE');
      expect(result.oldStreak).toBe(12);
      expect(result.newStreak).toBe(12);
      expect(result.newFreezeCount).toBe(0);
      expect(mockUser.current_streak).toBe(12);
    });
  });
});

const mongoUri = process.env.TEST_MONGODB_URI;
const describeWithMongo = mongoUri ? describe : describe.skip;

describeWithMongo('[TECH-S3-03] Streak Freeze Integration with MongoDB', () => {
  const api = request(app);

  beforeAll(async () => {
    process.env.JWT_SECRET = randomUUID();
    await mongoose.connect(mongoUri!, {
      dbName: 'questline_freeze_test_' + randomUUID().replace(/-/g, ''),
      serverSelectionTimeoutMS: 5000
    });
    await User.init();
  }, 20000);

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    } finally {
      await mongoose.disconnect();
    }
  });

  it('registers user with default 1 freeze, consumes it via POST /freeze-streak, and rejects subsequent call with 400', async () => {
    const reg = await api
      .post('/api/v1/auth/register')
      .send({
        email: 'freeze.e2e@example.test',
        password: 'Password123',
        full_name: 'Lê Mạnh Hùng'
      })
      .expect(201);

    const { token, user } = reg.body.data;
    expect(user.streak_freeze_count).toBe(1);

    await User.updateOne({ _id: user._id }, { $set: { current_streak: 6 } });

    const okRes = await api
      .post('/api/v1/gamification/freeze-streak')
      .auth(token, { type: 'bearer' })
      .expect(200);

    expect(okRes.body.success).toBe(true);
    expect(okRes.body.data).toMatchObject({
      streak_freeze_count: 0,
      current_streak: 6,
      is_protected: true
    });

    const failRes = await api
      .post('/api/v1/gamification/freeze-streak')
      .auth(token, { type: 'bearer' })
      .expect(400);

    expect(failRes.body.success).toBe(false);
    expect(failRes.body.error.code).toBe('NO_FREEZE_REMAINING');
  });
});
