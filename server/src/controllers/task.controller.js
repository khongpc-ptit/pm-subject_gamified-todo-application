const taskService = require('../services/task.service');

class TaskController {
  /**
   * [US-S1-02 / TECH-S1-03] Lấy danh sách nhiệm vụ của người dùng
   * GET /api/v1/tasks
   */
  async getTasks(req, res, next) {
    try {
      const userId = req.user.id;
      const { status, priority } = req.query;

      const result = await taskService.getTasks(userId, { status, priority });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Lấy danh sách nhiệm vụ thành công',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [US-S1-01 / TECH-S1-02] Tạo nhiệm vụ mới
   * POST /api/v1/tasks
   */
  async createTask(req, res, next) {
    try {
      const userId = req.user.id;
      const task = await taskService.createTask(userId, req.body);

      res.status(201).json({
        success: true,
        data: task,
        message: 'Tạo nhiệm vụ thành công',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TaskController();
