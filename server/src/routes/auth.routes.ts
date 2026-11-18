import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';
const router = Router();
router.post('/login', (req, res, next) => { void authController.login(req, res, next); });
router.get('/me', verifyToken, (req, res, next) => { void authController.me(req, res, next); });
// Stateless JWT logout clears the client's credentials.
router.post('/logout', verifyToken, (_req, res) => { res.json({ success: true, data: null, message: 'Đăng xuất thành công', timestamp: new Date().toISOString() }); });
export default router;
