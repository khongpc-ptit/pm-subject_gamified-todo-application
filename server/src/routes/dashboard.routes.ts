import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { dashboardController } from '../controllers/dashboardController';

const router = Router();

/**
 * [US-S4-01, US-S4-02 / TECH-S4-02] Lấy dữ liệu thống kê tổng quan Dashboard
 * GET /api/v1/dashboard/summary
 */
router.get('/summary', authMiddleware, dashboardController.getSummary);

export { router as dashboardRoutes };
export default router;
