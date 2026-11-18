import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
export class AuthService {
  async login(email: unknown, password: unknown) {
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      throw Object.assign(new Error('Vui lòng nhập email và mật khẩu'), { statusCode: 400, code: 'VALIDATION_ERROR' });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw Object.assign(new Error('Email hoặc mật khẩu không chính xác'), { statusCode: 401, code: 'INVALID_CREDENTIALS' });
    }
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      algorithm: 'HS256', expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn']
    });
    const { password_hash, ...profile } = user.toObject();
    return { token, user: profile };
  }
  async me(id: string) {
    const user = await User.findById(id).select('-password_hash');
    if (!user) throw Object.assign(new Error('Không tìm thấy người dùng'), { statusCode: 404, code: 'USER_NOT_FOUND' });
    return user;
  }
}
export const authService = new AuthService();
