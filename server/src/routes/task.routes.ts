import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Mọi thao tác trên Task đều bắt buộc phải xác thực JWT
router.use(verifyToken);

// [US-S1-02] GET /api/v1/tasks - Xem danh sách nhiệm vụ
router.get('/', (req, res, next) => {
  taskController.getTasks(req, res, next);
});

// [US-S1-01] POST /api/v1/tasks - Tạo mới nhiệm vụ
router.post('/', (req, res, next) => {
  taskController.createTask(req, res, next);
});

router.patch('/:id/complete', (req, res, next) => { taskController.completeTask(req, res, next); });

export default router;
