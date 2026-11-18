import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await authService.login(req.body?.email, req.body?.password);
      res.json({ success: true, data, message: 'Đăng nhập thành công', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
  }
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await authService.me(req.user!.id);
      res.json({ success: true, data, message: 'Lấy thông tin người dùng thành công', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
  }
}
export const authController = new AuthController();
