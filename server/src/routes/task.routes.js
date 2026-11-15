const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Mọi thao tác trên Task đều bắt buộc phải xác thực JWT
router.use(verifyToken);

// [US-S1-02] GET /api/v1/tasks - Xem danh sách nhiệm vụ
router.get('/', taskController.getTasks);

// [US-S1-01] POST /api/v1/tasks - Tạo mới nhiệm vụ
router.post('/', taskController.createTask);

module.exports = router;
