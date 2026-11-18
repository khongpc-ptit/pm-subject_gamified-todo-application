import { Task, PRIORITY_XP_MAP } from '../models/Task';
import {
  ITask,
  CreateTaskDTO,
  ListTasksQueryDTO,
  TaskListResponseData,
  TaskPriority,
  TaskStatus
} from '../types/task.types';
import { AppError } from '../middlewares/error.middleware';

export class TaskService {
  async completeTask(userId: string, taskId: string): Promise<ITask> {
    if (!/^[a-f0-9]{24}$/i.test(taskId)) {
      throw Object.assign(new Error('Định danh nhiệm vụ không hợp lệ'), { statusCode: 400, code: 'INVALID_ID' });
    }
    const task = await Task.findOneAndUpdate(
      { _id: taskId, user_id: userId, status: { $ne: 'COMPLETED' } },
      { $set: { status: 'COMPLETED', completed_at: new Date() } },
      { new: true, runValidators: true }
    );
    if (task) return task;
    const existing = await Task.findOne({ _id: taskId, user_id: userId });
    if (existing) return existing;
    const exists = await Task.exists({ _id: taskId });
    throw Object.assign(new Error(exists ? 'Bạn không có quyền thao tác trên nhiệm vụ này' : 'Không tìm thấy nhiệm vụ'), {
      statusCode: exists ? 403 : 404, code: exists ? 'FORBIDDEN' : 'TASK_NOT_FOUND'
    });
  }

  /**
   * Truy xuất danh sách công việc của người dùng hiện tại
   * @param userId - ID người dùng sở hữu
   * @param query - Bộ lọc truy vấn { status, priority }
   * @returns Danh sách tasks và tổng số lượng
   */
  async getTasks(userId: string, query: ListTasksQueryDTO = {}): Promise<TaskListResponseData> {
    const filter: Record<string, any> = { user_id: userId };

    // Lọc theo trạng thái
    if (query.status) {
      const validStatuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'COMPLETED'];
      if (!validStatuses.includes(query.status as TaskStatus)) {
        const error = new Error(
          'Giá trị status không hợp lệ. Chỉ chấp nhận: TODO, IN_PROGRESS, COMPLETED'
        ) as AppError;
        error.statusCode = 400;
        error.code = 'INVALID_STATUS';
        throw error;
      }
      filter.status = query.status;
    }

    // Lọc theo độ ưu tiên
    if (query.priority) {
      const validPriorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
      if (!validPriorities.includes(query.priority as TaskPriority)) {
        const error = new Error(
          'Giá trị priority không hợp lệ. Chỉ chấp nhận: LOW, MEDIUM, HIGH'
        ) as AppError;
        error.statusCode = 400;
        error.code = 'INVALID_PRIORITY';
        throw error;
      }
      filter.priority = query.priority;
    }

    // Truy vấn và sắp xếp mặc định theo thời gian tạo mới nhất
    const tasks = (await Task.find(filter).sort({ created_at: -1 }).lean()) as unknown as ITask[];
    const total = tasks.length;

    return { tasks, total };
  }

  /**
   * Tạo công việc mới cho người dùng
   * @param userId - ID người dùng sở hữu
   * @param data - Dữ liệu công việc { title, description, priority, due_date }
   */
  async createTask(userId: string, data: CreateTaskDTO): Promise<ITask> {
    const { title, description, priority, due_date } = data;

    if (!title || typeof title !== 'string' || !title.trim()) {
      const error = new Error('Vui lòng nhập tiêu đề công việc') as AppError;
      error.statusCode = 400;
      error.code = 'TITLE_REQUIRED';
      throw error;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 200) {
      const error = new Error('Tiêu đề công việc không được vượt quá 200 ký tự') as AppError;
      error.statusCode = 400;
      error.code = 'TITLE_TOO_LONG';
      throw error;
    }

    let trimmedDesc = '';
    if (description) {
      trimmedDesc = typeof description === 'string' ? description.trim() : '';
      if (trimmedDesc.length > 1000) {
        const error = new Error('Mô tả chi tiết tối đa 1000 ký tự') as AppError;
        error.statusCode = 400;
        error.code = 'DESCRIPTION_TOO_LONG';
        throw error;
      }
    }

    const taskPriority = (priority || 'MEDIUM') as TaskPriority;
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(taskPriority)) {
      const error = new Error(
        'Mức độ ưu tiên không hợp lệ. Chỉ chấp nhận: LOW, MEDIUM, HIGH'
      ) as AppError;
      error.statusCode = 400;
      error.code = 'INVALID_PRIORITY';
      throw error;
    }

    let parsedDueDate: Date | null = null;
    if (due_date) {
      parsedDueDate = new Date(due_date);
      if (isNaN(parsedDueDate.getTime())) {
        const error = new Error('Ngày đến hạn không đúng định dạng') as AppError;
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

export const taskService = new TaskService();
export default taskService;
