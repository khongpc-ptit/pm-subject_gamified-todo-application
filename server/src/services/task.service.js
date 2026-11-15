const { Task, PRIORITY_XP_MAP } = require('../models/Task');

class TaskService {
  /**
   * Truy xuất danh sách công việc của người dùng hiện tại
   * @param {string} userId - ID người dùng sở hữu
   * @param {Object} query - Bộ lọc truy vấn { status, priority }
   * @returns {Promise<{ tasks: Array, total: number }>}
   */
  async getTasks(userId, query = {}) {
    const filter = { user_id: userId };

    // Lọc theo trạng thái
    if (query.status) {
      const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED'];
      if (!validStatuses.includes(query.status)) {
        const error = new Error('Giá trị status không hợp lệ. Chỉ chấp nhận: TODO, IN_PROGRESS, COMPLETED');
        error.statusCode = 400;
        error.code = 'INVALID_STATUS';
        throw error;
      }
      filter.status = query.status;
    }

    // Lọc theo độ ưu tiên
    if (query.priority) {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
      if (!validPriorities.includes(query.priority)) {
        const error = new Error('Giá trị priority không hợp lệ. Chỉ chấp nhận: LOW, MEDIUM, HIGH');
        error.statusCode = 400;
        error.code = 'INVALID_PRIORITY';
        throw error;
      }
      filter.priority = query.priority;
    }

    // Truy vấn và sắp xếp mặc định theo thời gian tạo mới nhất
    const tasks = await Task.find(filter).sort({ created_at: -1 }).lean();
    const total = tasks.length;

    return { tasks, total };
  }

  /**
   * Tạo công việc mới cho người dùng
   * @param {string} userId - ID người dùng sở hữu
   * @param {Object} data - Dữ liệu công việc { title, description, priority, due_date }
   */
  async createTask(userId, data) {
    const { title, description, priority, due_date } = data;

    if (!title || typeof title !== 'string' || !title.trim()) {
      const error = new Error('Vui lòng nhập tiêu đề công việc');
      error.statusCode = 400;
      error.code = 'TITLE_REQUIRED';
      throw error;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 200) {
      const error = new Error('Tiêu đề công việc không được vượt quá 200 ký tự');
      error.statusCode = 400;
      error.code = 'TITLE_TOO_LONG';
      throw error;
    }

    let trimmedDesc = '';
    if (description) {
      trimmedDesc = typeof description === 'string' ? description.trim() : '';
      if (trimmedDesc.length > 1000) {
        const error = new Error('Mô tả chi tiết tối đa 1000 ký tự');
        error.statusCode = 400;
        error.code = 'DESCRIPTION_TOO_LONG';
        throw error;
      }
    }

    const taskPriority = priority || 'MEDIUM';
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(taskPriority)) {
      const error = new Error('Mức độ ưu tiên không hợp lệ. Chỉ chấp nhận: LOW, MEDIUM, HIGH');
      error.statusCode = 400;
      error.code = 'INVALID_PRIORITY';
      throw error;
    }

    let parsedDueDate = null;
    if (due_date) {
      parsedDueDate = new Date(due_date);
      if (isNaN(parsedDueDate.getTime())) {
        const error = new Error('Ngày đến hạn không đúng định dạng');
        error.statusCode = 400;
        error.code = 'INVALID_DUE_DATE';
        throw error;
      }
    }

    const xpReward = PRIORITY_XP_MAP[taskPriority] || 20;

    const task = new Task({
      user_id: userId,
      title: trimmedTitle,
      description: trimmedDesc,
      priority: taskPriority,
      status: 'TODO',
      due_date: parsedDueDate,
      xp_reward: xpReward,
      completed_at: null
    });

    return await task.save();
  }
}

module.exports = new TaskService();
