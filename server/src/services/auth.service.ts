import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { RegisterDTO, AuthResponseData, UserProfileResponse } from '../types/user.types';
import { AppError } from '../middlewares/error.middleware';

export class AuthService {
  async login(email: unknown, password: unknown) {
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      throw Object.assign(new Error('Vui lòng nhập email và mật khẩu'), { statusCode: 400, code: 'VALIDATION_ERROR' });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw Object.assign(new Error('Email hoặc mật khẩu không chính xác'), { statusCode: 401, code: 'INVALID_CREDENTIALS' });
    }
    const token = this.signToken(user.id, user.email);
    const { password_hash, reset_password_hash, reset_password_expires, ...profile } = user.toObject();
    return { token, user: profile };
  }
  async me(id: string) {
    const user = await User.findById(id).select('-password_hash');
    if (!user) throw Object.assign(new Error('Không tìm thấy người dùng'), { statusCode: 404, code: 'USER_NOT_FOUND' });
    return user;
  }

  /**
   * [US-S1-05 / TECH-S1-08] Đăng ký tài khoản người dùng mới
   * @param data - Dữ liệu đăng ký { email, password, full_name }
   * @returns JWT token và thông tin người dùng (không kèm password_hash)
   */
  async register(data: RegisterDTO): Promise<AuthResponseData> {
    const { email, password } = data;
    const rawFullName = data.full_name || data.fullName;

    // 1. Kiểm tra họ và tên
    if (!rawFullName || typeof rawFullName !== 'string' || !rawFullName.trim()) {
      const error = new Error('Vui lòng nhập họ và tên.') as AppError;
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const trimmedFullName = rawFullName.trim();
    if (trimmedFullName.length < 2 || trimmedFullName.length > 100) {
      const error = new Error('Họ và tên phải có độ dài từ 2 đến 100 ký tự.') as AppError;
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    // 2. Kiểm tra email
    if (!email || typeof email !== 'string' || !email.trim()) {
      const error = new Error('Vui lòng nhập email.') as AppError;
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      const error = new Error('Email chưa đúng định dạng.') as AppError;
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    // 3. Kiểm tra mật khẩu
    if (!password || typeof password !== 'string') {
      const error = new Error('Vui lòng nhập mật khẩu.') as AppError;
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    if (password.length < 6) {
      const error = new Error('Mật khẩu phải có tối thiểu 6 ký tự.') as AppError;
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    // 4. Kiểm tra email đã tồn tại hay chưa
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      const error = new Error('Email này đã được sử dụng.') as AppError;
      error.statusCode = 409;
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    // 5. Băm mật khẩu bằng Bcrypt (Salt rounds = 10)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 6. Khởi tạo tài khoản mới với các giá trị mặc định theo quy chuẩn Gamification
    const user = new User({
      email: trimmedEmail,
      password_hash: passwordHash,
      full_name: trimmedFullName,
      current_level: 1,
      total_xp: 0,
      current_streak: 0,
      last_active_date: null,
      streak_freeze_count: 1
    });

    const token = this.signToken(user._id.toString(), user.email);
    const savedUser = await user.save();

    // 8. Trả về thông tin hồ sơ người dùng (TUYỆT ĐỐI KHÔNG trả về password_hash)
    const userProfile: UserProfileResponse = {
      _id: savedUser._id.toString(),
      email: savedUser.email,
      full_name: savedUser.full_name,
      current_level: savedUser.current_level,
      total_xp: savedUser.total_xp,
      current_streak: savedUser.current_streak,
      last_active_date: savedUser.last_active_date,
      streak_freeze_count: savedUser.streak_freeze_count,
      created_at: savedUser.created_at ? savedUser.created_at.toISOString() : new Date().toISOString()
    };

    return {
      token,
      user: userProfile
    };
  }

  private signToken(id: string, email: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is required');
    return jwt.sign({ id, email }, secret, {
      algorithm: 'HS256',
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn']
    });
  }
}

export const authService = new AuthService();
export default authService;
