import { Request, Response, NextFunction } from 'express';
import { passwordService } from '../services/password.service';
export class PasswordController {
  async forgot(req: Request, res: Response, next: NextFunction) {
    try {
      await passwordService.forgot(req.body?.email);
      res.json({ success: true, data: null, message: 'Nếu tài khoản tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi qua email.', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
  }
  async reset(req: Request, res: Response, next: NextFunction) {
    try {
      await passwordService.reset(req.body?.token, req.body?.password);
      res.json({ success: true, data: null, message: 'Đặt lại mật khẩu thành công', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
  }
}
export const passwordController = new PasswordController();
