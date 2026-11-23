import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { ApiSuccessResponse } from '../types/api.types';
import { AuthResponseData } from '../types/user.types';

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

  /**
   * [US-S1-05 / TECH-S1-08] Đăng ký tài khoản mới
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);

      const response: ApiSuccessResponse<AuthResponseData> = {
        success: true,
        data: result,
        message: 'Đăng ký tài khoản thành công',
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
export default authController;
