import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { listBadges } from '../services/badgeCatalogService';

const router = Router();
router.get('/badges', verifyToken, async (req, res, next) => {
  try {
    const data = await listBadges(req.user!.id);
    res.json({ success: true, data, message: 'Lấy bộ sưu tập huy hiệu thành công', timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

export default router;
