import { passwordController } from '../controllers/password.controller';
import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';
const router = Router();
router.post('/register', (req, res, next) => {
  authController.register(req, res, next);
});
router.post('/login', (req, res, next) => { void authController.login(req, res, next); });
router.get('/me', verifyToken, (req, res, next) => { void authController.getProfile(req, res, next); });
router.put('/profile', verifyToken, (req, res, next) => { void authController.updateProfile(req, res, next); });
// Stateless JWT logout clears the client's credentials.
router.post('/logout', verifyToken, (_req, res) => { res.json({ success: true, data: null, message: 'Đăng xuất thành công', timestamp: new Date().toISOString() }); });
router.post('/forgot-password', (req, res, next) => { void passwordController.forgot(req, res, next); });
router.post('/reset-password', (req, res, next) => { void passwordController.reset(req, res, next); });
export default router;
