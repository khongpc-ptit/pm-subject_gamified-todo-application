import { Request, Response, NextFunction } from 'express';
import { gamificationService } from '../services/gamificationService';

export class GamificationController {
  /**
   * [US-S3-02 / TECH-S3-03] Chủ động kích hoạt Đóng Băng Chuỗi (Streak Freeze)
   * POST /api/v1/gamification/freeze-streak
   */
  freezeStreak = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Phiên đăng nhập không hợp lệ'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await gamificationService.freezeStreak(userId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Đã sử dụng 1 lượt đóng băng chuỗi',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  };
}

export const gamificationController = new GamificationController();
export default gamificationController;
