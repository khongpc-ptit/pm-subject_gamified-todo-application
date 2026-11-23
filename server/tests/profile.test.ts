import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { app } from '../src/app';
import { User } from '../src/models/User';

const JWT_SECRET = 'supersecretkey_gamified_todo_sprint1';

describe('[US-S1-07 / US-S1-08 / TECH-S1-10] User Profile View & Update', () => {
  const userId = new mongoose.Types.ObjectId().toString();
  let validToken: string;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    validToken = jwt.sign({ id: userId, email: 'hung.lm@ptit.edu.vn' }, JWT_SECRET, { expiresIn: '1h' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/v1/auth/me - Xem hồ sơ cá nhân [US-S1-07]', () => {
    it('1. Trả về 401 UNAUTHORIZED khi không cung cấp Authorization header', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('2. Trả về 401 UNAUTHORIZED khi token không hợp lệ hoặc hết hạn', async () => {
      const expiredToken = jwt.sign({ id: userId, email: 'hung.lm@ptit.edu.vn' }, JWT_SECRET, { expiresIn: -10 });
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('3. Trả về 404 USER_NOT_FOUND khi tài khoản không tồn tại trong CSDL', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
      expect(res.body.error.message).toBe('Không tìm thấy người dùng');
    });

    it('4. Trả về 200 OK cùng thông tin hồ sơ đã chuẩn hóa khi token hợp lệ', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(userId),
        email: 'hung.lm@ptit.edu.vn',
        password_hash: '$2b$10$hashedpasswordstringthatmustnotleak',
        full_name: 'Lê Mạnh Hùng',
        current_level: 2,
        total_xp: 450,
        current_streak: 5,
        last_active_date: '2026-11-20',
        streak_freeze_count: 1,
        created_at: new Date('2026-11-01T10:00:00.000Z'),
        updated_at: new Date('2026-11-20T10:00:00.000Z')
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser as any);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Lấy thông tin người dùng thành công');
      expect(res.body.data).toBeDefined();

      const user = res.body.data;
      expect(user._id).toBe(userId);
      expect(user.email).toBe('hung.lm@ptit.edu.vn');
      expect(user.full_name).toBe('Lê Mạnh Hùng');
      expect(user.current_level).toBe(2);
      expect(user.total_xp).toBe(450);
      expect(user.current_streak).toBe(5);
      expect(user.last_active_date).toBe('2026-11-20');
      expect(user.streak_freeze_count).toBe(1);
      expect(user.created_at).toBe('2026-11-01T10:00:00.000Z');

      // TUYỆT ĐỐI KHÔNG để lộ password_hash
      expect(user.password_hash).toBeUndefined();
      expect(user.password).toBeUndefined();
      expect(user.reset_password_hash).toBeUndefined();
    });
  });

  describe('PUT /api/v1/auth/profile - Cập nhật hồ sơ cá nhân [US-S1-08]', () => {
    it('5. Trả về 401 UNAUTHORIZED khi thiếu Authorization header', async () => {
      const res = await request(app)
        .put('/api/v1/auth/profile')
        .send({ full_name: 'Tên Mới' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('6. Trả về 400 VALIDATION_ERROR khi full_name bị bỏ trống hoặc chỉ chứa khoảng trắng', async () => {
      const res = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ full_name: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('Vui lòng nhập họ và tên.');
    });

    it('7. Trả về 400 VALIDATION_ERROR khi full_name có độ dài ít hơn 2 ký tự', async () => {
      const res = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ full_name: 'A' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('Họ và tên phải có độ dài từ 2 đến 100 ký tự.');
    });

    it('8. Trả về 400 VALIDATION_ERROR khi full_name có độ dài vượt quá 100 ký tự', async () => {
      const longName = 'A'.repeat(101);
      const res = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ full_name: longName });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('Họ và tên phải có độ dài từ 2 đến 100 ký tự.');
    });

    it('9. Trả về 404 USER_NOT_FOUND khi tài khoản không tồn tại', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ full_name: 'Nguyễn Văn Mới' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('10. Cập nhật thành công họ tên hợp lệ và tự động trim()', async () => {
      const existingUser: any = {
        _id: new mongoose.Types.ObjectId(userId),
        email: 'hung.lm@ptit.edu.vn',
        password_hash: '$2b$10$hashedpasswordstring',
        full_name: 'Tên Cũ',
        current_level: 3,
        total_xp: 900,
        current_streak: 8,
        last_active_date: '2026-11-21',
        streak_freeze_count: 2,
        created_at: new Date('2026-11-01T10:00:00.000Z'),
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        })
      };

      jest.spyOn(User, 'findById').mockResolvedValue(existingUser);

      const res = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ full_name: '   Nguyễn Văn An   ' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Cập nhật hồ sơ thành công');
      expect(res.body.data.full_name).toBe('Nguyễn Văn An');
      expect(existingUser.save).toHaveBeenCalled();
      expect(res.body.data.password_hash).toBeUndefined();
    });

    it('11. Hỗ trợ trường fullName (camelCase) từ biểu mẫu Frontend', async () => {
      const existingUser: any = {
        _id: new mongoose.Types.ObjectId(userId),
        email: 'hung.lm@ptit.edu.vn',
        password_hash: '$2b$10$hashedpasswordstring',
        full_name: 'Tên Cũ',
        current_level: 1,
        total_xp: 50,
        current_streak: 1,
        last_active_date: null,
        streak_freeze_count: 1,
        created_at: new Date('2026-11-01T10:00:00.000Z'),
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        })
      };

      jest.spyOn(User, 'findById').mockResolvedValue(existingUser);

      const res = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ fullName: 'Trần Thảo Ly' });

      expect(res.status).toBe(200);
      expect(res.body.data.full_name).toBe('Trần Thảo Ly');
    });

    it('12. Không cho phép sửa đổi các trường hệ thống và bảo mật (email, xp, level, streak, password_hash)', async () => {
      const existingUser: any = {
        _id: new mongoose.Types.ObjectId(userId),
        email: 'original@ptit.edu.vn',
        password_hash: '$2b$10$originalhash',
        full_name: 'Ban Đầu',
        current_level: 2,
        total_xp: 350,
        current_streak: 4,
        last_active_date: '2026-11-19',
        streak_freeze_count: 1,
        created_at: new Date('2026-11-01T10:00:00.000Z'),
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        })
      };

      jest.spyOn(User, 'findById').mockResolvedValue(existingUser);

      const res = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          full_name: 'Họ Tên Đã Đổi',
          email: 'hacked@ptit.edu.vn',
          total_xp: 999999,
          current_level: 99,
          current_streak: 999,
          streak_freeze_count: 99,
          password_hash: 'tamperedhash'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.full_name).toBe('Họ Tên Đã Đổi');
      // Các trường khác giữ nguyên không bị thay đổi
      expect(res.body.data.email).toBe('original@ptit.edu.vn');
      expect(res.body.data.total_xp).toBe(350);
      expect(res.body.data.current_level).toBe(2);
      expect(res.body.data.current_streak).toBe(4);
      expect(res.body.data.streak_freeze_count).toBe(1);
      expect(existingUser.email).toBe('original@ptit.edu.vn');
      expect(existingUser.password_hash).toBe('$2b$10$originalhash');
      expect(existingUser.total_xp).toBe(350);
    });
  });
});
