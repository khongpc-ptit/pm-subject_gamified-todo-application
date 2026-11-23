import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { sendResetEmail } from './email.service';
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
export class PasswordService {
  async forgot(email: unknown) {
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw Object.assign(new Error('Email không hợp lệ'), { statusCode: 400, code: 'VALIDATION_ERROR' });
    }
    const token = randomBytes(32).toString('hex');
    const hash = digest(token);
    const user = await User.findOneAndUpdate({ email: email.trim().toLowerCase() }, { $set: { reset_password_hash: hash, reset_password_expires: new Date(Date.now() + 15 * 60 * 1000) } }, { new: true });
    if (!user) return;
    try { await sendResetEmail(user.email, token); }
    catch (error) {
      await User.updateOne({ _id: user._id, reset_password_hash: hash }, { $unset: { reset_password_hash: 1, reset_password_expires: 1 } });
      throw error;
    }
  }
  async reset(token: unknown, password: unknown) {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || typeof password !== 'string' || password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) {
      throw Object.assign(new Error('Token hoặc mật khẩu không hợp lệ (6–72 byte)'), { statusCode: 400, code: 'VALIDATION_ERROR' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.findOneAndUpdate({ reset_password_hash: digest(token), reset_password_expires: { $gt: new Date() } }, {
      $set: { password_hash }, $unset: { reset_password_hash: 1, reset_password_expires: 1 }
    });
    if (!user) throw Object.assign(new Error('Liên kết đã hết hạn hoặc không hợp lệ'), { statusCode: 400, code: 'INVALID_RESET_TOKEN' });
  }
}
export const passwordService = new PasswordService();
