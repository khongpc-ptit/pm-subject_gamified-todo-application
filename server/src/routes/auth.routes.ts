import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

// [US-S1-05 / TECH-S1-08] Đăng ký tài khoản mới (Public)
router.post('/register', (req, res, next) => {
  authController.register(req, res, next);
});

export default router;
