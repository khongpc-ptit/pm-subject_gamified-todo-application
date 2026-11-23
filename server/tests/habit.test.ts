import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { app } from '../src/app';
import { Habit } from '../src/models/Habit';

const JWT_SECRET = 'supersecretkey_gamified_todo_sprint2';

const generateTestToken = (userId: string, email: string = 'testuser@example.com'): string => {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '1h' });
};

describe('Habit Controller, Service & CRUD APIs - [TECH-S2-02]', () => {
  const userA_Id = new mongoose.Types.ObjectId().toString();
  const userB_Id = new mongoose.Types.ObjectId().toString();
  let tokenUserA: string;
  let tokenUserB: string;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    tokenUserA = generateTestToken(userA_Id, 'usera@example.com');
    tokenUserB = generateTestToken(userB_Id, 'userb@example.com');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Xác thực & Bảo mật (Authentication & Authorization)', () => {
    it('1.1. Trả về 401 UNAUTHORIZED khi thiếu Header Authorization', async () => {
      const endpoints = [
        { method: 'get', url: '/api/v1/habits' },
        { method: 'post', url: '/api/v1/habits', body: { title: 'Tập thể dục' } },
        { method: 'delete', url: `/api/v1/habits/${new mongoose.Types.ObjectId().toString()}` },
        { method: 'get', url: `/api/v1/habits/${new mongoose.Types.ObjectId().toString()}` }
      ];

      for (const ep of endpoints) {
        let req = (request(app) as any)[ep.method](ep.url);
        if (ep.body) req = req.send(ep.body);
        const res = await req;
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('1.2. Trả về 401 UNAUTHORIZED khi token sai hoặc giả mạo', async () => {
      const res = await request(app)
        .get('/api/v1/habits')
        .set('Authorization', 'Bearer invalid_token_xyz');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('2. [US-S2-01] Xem danh sách thói quen: GET /api/v1/habits', () => {
    it('2.1. Trả về mảng rỗng và total: 0 khi user chưa tạo thói quen nào (Empty State)', async () => {
      jest.spyOn(Habit, 'find').mockImplementation(((filter: any) => {
        expect(filter.user_id).toBe(userA_Id);
        expect(filter.is_active).toBe(true);
        return {
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
          })
        };
      }) as any);

      const res = await request(app)
        .get('/api/v1/habits')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.habits).toEqual([]);
      expect(res.body.data.total).toBe(0);
      expect(res.body.timestamp).toBeDefined();
    });

    it('2.2. Trả về danh sách thói quen active kèm logs giới hạn 7 ngày gần nhất', async () => {
      const mockLogs = [
        { log_date: '2026-11-15', is_completed: true, xp_earned: 15 },
        { log_date: '2026-11-16', is_completed: true, xp_earned: 15 },
        { log_date: '2026-11-17', is_completed: true, xp_earned: 15 },
        { log_date: '2026-11-18', is_completed: true, xp_earned: 15 },
        { log_date: '2026-11-19', is_completed: true, xp_earned: 15 },
        { log_date: '2026-11-20', is_completed: true, xp_earned: 15 },
        { log_date: '2026-11-21', is_completed: true, xp_earned: 15 },
        { log_date: '2026-11-22', is_completed: true, xp_earned: 15 },
        { log_date: '2026-11-23', is_completed: true, xp_earned: 15 }
      ];

      const mockHabits = [
        {
          _id: new mongoose.Types.ObjectId().toString(),
          user_id: userA_Id,
          title: 'Uống đủ 2L nước',
          frequency: 'DAILY',
          target_days: 7,
          current_streak: 9,
          is_active: true,
          logs: mockLogs,
          created_at: new Date('2026-11-10T08:00:00.000Z')
        }
      ];

      jest.spyOn(Habit, 'find').mockImplementation(((filter: any) => {
        return {
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockHabits)
          })
        };
      }) as any);

      const res = await request(app)
        .get('/api/v1/habits')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.habits).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
      // Kiểm tra logs được cắt gọn 7 ngày gần nhất
      expect(res.body.data.habits[0].logs).toHaveLength(7);
      expect(res.body.data.habits[0].logs[6].log_date).toBe('2026-11-23');
    });
  });

  describe('3. [US-S2-01] Tạo thói quen mới: POST /api/v1/habits', () => {
    it('3.1. Từ chối khi thiếu title hoặc title chỉ chứa khoảng trắng (400 TITLE_REQUIRED)', async () => {
      const invalidTitles = [{}, { title: '' }, { title: '    ' }, { title: null }];

      for (const payload of invalidTitles) {
        const res = await request(app)
          .post('/api/v1/habits')
          .set('Authorization', `Bearer ${tokenUserA}`)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('TITLE_REQUIRED');
      }
    });

    it('3.2. Từ chối khi title vượt quá 200 ký tự (400 TITLE_TOO_LONG)', async () => {
      const res = await request(app)
        .post('/api/v1/habits')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ title: 'A'.repeat(201) });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TITLE_TOO_LONG');
    });

    it('3.3. Từ chối khi frequency không hợp lệ (400 INVALID_FREQUENCY)', async () => {
      const res = await request(app)
        .post('/api/v1/habits')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ title: 'Đọc sách', frequency: 'MONTHLY' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_FREQUENCY');
    });

    it('3.4. Từ chối khi target_days không hợp lệ (ngoài 1-7 hoặc không phải số nguyên)', async () => {
      const invalidDays = [0, 8, -1, 3.5, 'five'];

      for (const target_days of invalidDays) {
        const res = await request(app)
          .post('/api/v1/habits')
          .set('Authorization', `Bearer ${tokenUserA}`)
          .send({ title: 'Chạy bộ', target_days });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('INVALID_TARGET_DAYS');
      }
    });

    it('3.5. Tạo thói quen thành công với giá trị mặc định (DAILY, 7 ngày)', async () => {
      const habitId = new mongoose.Types.ObjectId();
      const mockSavedHabit = {
        _id: habitId,
        user_id: userA_Id,
        title: 'Uống nước',
        frequency: 'DAILY',
        target_days: 7,
        current_streak: 0,
        is_active: true,
        logs: [],
        created_at: new Date()
      };

      jest.spyOn(Habit.prototype, 'save').mockImplementation(function (this: any) {
        expect(this.user_id.toString()).toBe(userA_Id);
        expect(this.title).toBe('Uống nước');
        expect(this.frequency).toBe('DAILY');
        expect(this.target_days).toBe(7);
        expect(this.current_streak).toBe(0);
        expect(this.is_active).toBe(true);
        return Promise.resolve(mockSavedHabit as any);
      });

      const res = await request(app)
        .post('/api/v1/habits')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ title: '   Uống nước   ' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Uống nước');
      expect(res.body.data.frequency).toBe('DAILY');
      expect(res.body.data.target_days).toBe(7);
      expect(res.body.message).toBe('Tạo thói quen thành công');
    });

    it('3.6. Tạo thói quen thành công với custom WEEKLY và target_days', async () => {
      const habitId = new mongoose.Types.ObjectId();
      const mockSavedHabit = {
        _id: habitId,
        user_id: userA_Id,
        title: 'Chạy bộ cuối tuần',
        frequency: 'WEEKLY',
        target_days: 3,
        current_streak: 0,
        is_active: true,
        logs: [],
        created_at: new Date()
      };

      jest.spyOn(Habit.prototype, 'save').mockResolvedValue(mockSavedHabit as any);

      const res = await request(app)
        .post('/api/v1/habits')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          title: 'Chạy bộ cuối tuần',
          frequency: 'WEEKLY',
          target_days: 3
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.frequency).toBe('WEEKLY');
      expect(res.body.data.target_days).toBe(3);
    });
  });

  describe('4. [US-S2-01] Xóa / Hủy theo dõi thói quen: DELETE /api/v1/habits/:id', () => {
    it('4.1. Từ chối khi định danh ID không hợp lệ (400 INVALID_ID)', async () => {
      const res = await request(app)
        .delete('/api/v1/habits/invalid-id-xyz')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_ID');
    });

    it('4.2. Trả về 404 HABIT_NOT_FOUND khi thói quen không tồn tại trong hệ thống', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      jest.spyOn(Habit, 'findOneAndUpdate').mockResolvedValue(null as any);
      jest.spyOn(Habit, 'exists').mockResolvedValue(null as any);

      const res = await request(app)
        .delete(`/api/v1/habits/${nonExistentId}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('HABIT_NOT_FOUND');
    });

    it('4.3. Trả về 403 FORBIDDEN khi thói quen thuộc quyền sở hữu của user khác (Data Isolation)', async () => {
      const otherUserHabitId = new mongoose.Types.ObjectId().toString();

      // findOneAndUpdate trả về null vì userA_Id không match
      jest.spyOn(Habit, 'findOneAndUpdate').mockResolvedValue(null as any);
      // exists trả về true vì habitId thực sự tồn tại
      jest.spyOn(Habit, 'exists').mockResolvedValue({ _id: otherUserHabitId } as any);

      const res = await request(app)
        .delete(`/api/v1/habits/${otherUserHabitId}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('4.4. Xóa thói quen thành công (Soft delete is_active = false) và trả về id', async () => {
      const habitId = new mongoose.Types.ObjectId().toString();

      jest.spyOn(Habit, 'findOneAndUpdate').mockImplementation(((filter: any, update: any) => {
        expect(filter._id).toBe(habitId);
        expect(filter.user_id).toBe(userA_Id);
        expect(filter.is_active).toBe(true);
        expect(update.$set.is_active).toBe(false);
        return Promise.resolve({
          _id: habitId,
          user_id: userA_Id,
          is_active: false
        });
      }) as any);

      const res = await request(app)
        .delete(`/api/v1/habits/${habitId}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(habitId);
      expect(res.body.message).toBe('Đã xóa thói quen thành công');
    });
  });

  describe('5. Chi tiết & Cập nhật thói quen (GET & PUT /api/v1/habits/:id)', () => {
    it('5.1. GET /api/v1/habits/:id - Trả về chi tiết thói quen của người dùng', async () => {
      const habitId = new mongoose.Types.ObjectId().toString();
      const mockHabit = {
        _id: habitId,
        user_id: userA_Id,
        title: 'Học tiếng Anh',
        frequency: 'DAILY',
        target_days: 7,
        current_streak: 2,
        is_active: true,
        logs: []
      };

      jest.spyOn(Habit, 'findOne').mockResolvedValue(mockHabit as any);

      const res = await request(app)
        .get(`/api/v1/habits/${habitId}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Học tiếng Anh');
    });

    it('5.2. PUT /api/v1/habits/:id - Cập nhật thông tin thói quen thành công', async () => {
      const habitId = new mongoose.Types.ObjectId().toString();
      const mockUpdated = {
        _id: habitId,
        user_id: userA_Id,
        title: 'Học tiếng Đức',
        frequency: 'WEEKLY',
        target_days: 4,
        is_active: true
      };

      jest.spyOn(Habit, 'findOneAndUpdate').mockResolvedValue(mockUpdated as any);

      const res = await request(app)
        .put(`/api/v1/habits/${habitId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          title: 'Học tiếng Đức',
          frequency: 'WEEKLY',
          target_days: 4
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Học tiếng Đức');
      expect(res.body.data.frequency).toBe('WEEKLY');
      expect(res.body.data.target_days).toBe(4);
    });
  });
});
