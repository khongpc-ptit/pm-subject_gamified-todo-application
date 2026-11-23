import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { app } from '../src/app';
import { User } from '../src/models/User';

const JWT_SECRET = 'supersecretkey_gamified_todo_sprint1';

describe('POST /api/v1/auth/register - [US-S1-05 / TECH-S1-08] User Registration', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Kiểm tra tính hợp lệ dữ liệu đầu vào (Input Validation)', () => {
    it('1. Trả về 400 VALIDATION_ERROR khi thiếu họ và tên', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'Password@123',
        full_name: '   '
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('Vui lòng nhập họ và tên.');
    });

    it('2. Trả về 400 VALIDATION_ERROR khi họ và tên ít hơn 2 ký tự', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'Password@123',
        full_name: 'A'
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('Họ và tên phải có độ dài từ 2 đến 100 ký tự.');
    });

    it('3. Trả về 400 VALIDATION_ERROR khi thiếu email', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        password: 'Password@123',
        full_name: 'Nguyễn Văn A'
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('Vui lòng nhập email.');
    });

    it('4. Trả về 400 VALIDATION_ERROR khi email sai định dạng', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'invalid-email-address',
        password: 'Password@123',
        full_name: 'Nguyễn Văn A'
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('Email chưa đúng định dạng.');
    });

    it('5. Trả về 400 VALIDATION_ERROR khi thiếu mật khẩu', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        full_name: 'Nguyễn Văn A'
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('Vui lòng nhập mật khẩu.');
    });

    it('6. Trả về 400 VALIDATION_ERROR khi mật khẩu ít hơn 6 ký tự', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: '12345',
        full_name: 'Nguyễn Văn A'
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('Mật khẩu phải có tối thiểu 6 ký tự.');
    });
  });

  describe('Kiểm tra trùng lặp email (Email Uniqueness & Conflict)', () => {
    it('7. Trả về 409 EMAIL_ALREADY_EXISTS khi email đã tồn tại trong cơ sở dữ liệu', async () => {
      const existingUserMock: any = {
        _id: new mongoose.Types.ObjectId(),
        email: 'used@example.com',
        full_name: 'Người dùng cũ'
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(existingUserMock);

      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'USED@example.com', // Kiểm tra chuẩn hóa lowercase
        password: 'Password@123',
        full_name: 'Người Dùng Mới'
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
      expect(res.body.error.message).toBe('Email này đã được sử dụng.');
    });
  });

  describe('Đăng ký tài khoản thành công (Successful Registration)', () => {
    let savedUserData: any;

    beforeEach(() => {
      savedUserData = null;
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(User.prototype, 'save').mockImplementation(function (this: any) {
        savedUserData = this;
        this._id = new mongoose.Types.ObjectId();
        this.created_at = new Date();
        this.updated_at = new Date();
        return Promise.resolve(this);
      });
    });

    it('8. Đăng ký thành công trả về 201 Created và chuẩn Response Envelope', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'newuser@ptit.edu.vn',
        password: 'SecurePassword123',
        full_name: 'Nguyễn Minh Anh'
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Đăng ký tài khoản thành công');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('newuser@ptit.edu.vn');
      expect(res.body.data.user.full_name).toBe('Nguyễn Minh Anh');
    });

    it('9. Hỗ trợ trường fullName (camelCase) từ biểu mẫu Frontend', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'camelcase@ptit.edu.vn',
        password: 'SecurePassword123',
        fullName: 'Trần Văn Nam'
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.full_name).toBe('Trần Văn Nam');
    });

    it('10. Khởi tạo đầy đủ các trường Gamification mặc định chuẩn DOC-11', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'gamify@ptit.edu.vn',
        password: 'SecurePassword123',
        full_name: 'Lê Hoàng Long'
      });

      expect(res.status).toBe(201);
      const user = res.body.data.user;
      expect(user.current_level).toBe(1);
      expect(user.total_xp).toBe(0);
      expect(user.current_streak).toBe(0);
      expect(user.last_active_date).toBeNull();
      expect(user.streak_freeze_count).toBe(1);
    });

    it('11. TUYỆT ĐỐI KHÔNG trả về password_hash hoặc password trong response', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'nopassword@ptit.edu.vn',
        password: 'SuperSecretPassword',
        full_name: 'Phạm Thị Mai'
      });

      expect(res.status).toBe(201);
      const user = res.body.data.user;
      expect(user.password_hash).toBeUndefined();
      expect(user.password).toBeUndefined();
      expect(res.body.data.password_hash).toBeUndefined();
      expect(res.body.data.password).toBeUndefined();
    });

    it('12. Mật khẩu được băm an toàn bằng Bcrypt với Salt rounds = 10 trong Database', async () => {
      const rawPassword = 'SuperSecretPassword';
      await request(app).post('/api/v1/auth/register').send({
        email: 'hashcheck@ptit.edu.vn',
        password: rawPassword,
        full_name: 'Vũ Quốc Huy'
      });

      expect(savedUserData).toBeDefined();
      expect(savedUserData.password_hash).not.toBe(rawPassword);
      // Kiểm tra chuỗi băm Bcrypt bắt đầu bằng $2a$ hoặc $2b$
      expect(savedUserData.password_hash).toMatch(/^\$2[ab]\$10\$/);
      // Đối chiếu bcrypt.compare trả về true
      const isMatch = await bcrypt.compare(rawPassword, savedUserData.password_hash);
      expect(isMatch).toBe(true);
    });

    it('13. JWT Token hợp lệ và chứa id, email của người dùng', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'jwttest@ptit.edu.vn',
        password: 'Password@123',
        full_name: 'Đặng Tuấn Kiệt'
      });

      expect(res.status).toBe(201);
      const token = res.body.data.token;
      const decoded: any = jwt.verify(token, JWT_SECRET);
      expect(decoded.id).toBeDefined();
      expect(decoded.email).toBe('jwttest@ptit.edu.vn');
    });
  });
});
