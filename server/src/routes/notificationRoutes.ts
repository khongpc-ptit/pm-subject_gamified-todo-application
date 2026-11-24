import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);
router.get('/', notificationController.list);
router.patch('/read-all', notificationController.readAll);
router.patch('/:id/read', notificationController.read);

export default router;
