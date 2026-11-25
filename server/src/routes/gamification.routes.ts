import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { gamificationController } from '../controllers/gamificationController';

import badgeCatalogRoutes from './badgeCatalogRoutes';

const router = Router();
router.use(badgeCatalogRoutes);

/**
 * [US-S3-02 / TECH-S3-03] Sử dụng lượt đóng băng chuỗi
 * POST /api/v1/gamification/freeze-streak
 */
router.post('/freeze-streak', authMiddleware, gamificationController.freezeStreak);

export { router as gamificationRoutes };
export default router;
