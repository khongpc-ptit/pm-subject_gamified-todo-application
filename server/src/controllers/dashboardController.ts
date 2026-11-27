import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboardService';

export class DashboardController {
  /**
   * [US-S4-01, US-S4-02 / TECH-S4-02] Lấy dữ liệu tổng quan Dashboard (Stats Hub & Weekly Activity)
   * GET /api/v1/dashboard/summary
   */
  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const summary = await dashboardService.getDashboardSummary(userId);

      res.status(200).json({
        success: true,
        data: summary,
        message: 'Lấy dữ liệu tổng quan Dashboard thành công',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      if (error?.message === 'INVALID_USER_ID') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_USER_ID',
            message: 'ID người dùng không hợp lệ'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();
export default dashboardController;
