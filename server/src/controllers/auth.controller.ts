import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { ApiSuccessResponse } from '../types/api.types';
import { AuthResponseData } from '../types/user.types';

export class AuthController {
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
