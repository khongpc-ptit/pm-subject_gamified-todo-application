import { Router } from 'express';
import { habitController } from '../controllers/habit.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Mọi thao tác trên Habits đều bắt buộc phải xác thực JWT
router.use(verifyToken);

// [US-S2-01] GET /api/v1/habits - Xem danh sách thói quen
router.get('/', (req, res, next) => {
  habitController.getHabits(req, res, next);
});

// [US-S2-01] POST /api/v1/habits - Tạo mới thói quen
router.post('/', (req, res, next) => {
  habitController.createHabit(req, res, next);
});

// [US-S2-01] GET /api/v1/habits/:id - Xem chi tiết 1 thói quen
router.get('/:id', (req, res, next) => {
  habitController.getHabitById(req, res, next);
});

// [US-S2-01] PUT /api/v1/habits/:id - Cập nhật thói quen
router.put('/:id', (req, res, next) => {
  habitController.updateHabit(req, res, next);
});

// [US-S2-01] DELETE /api/v1/habits/:id - Xóa / hủy theo dõi thói quen
router.delete('/:id', (req, res, next) => {
  habitController.deleteHabit(req, res, next);
});

router.post('/:id/check-in', (req, res, next) => {
  void habitController.checkInHabit(req, res, next);
});

export default router;
