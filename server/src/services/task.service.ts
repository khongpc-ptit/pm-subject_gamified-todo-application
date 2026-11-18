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
    if (description !== undefined && description !== null && typeof description !== 'string') {
      throw Object.assign(new Error('M? t? ph?i l? chu?i'), { statusCode: 400, code: 'VALIDATION_ERROR' });
    }
    if (description) {
      trimmedDesc = typeof description === 'string' ? description.trim() : '';
      if (trimmedDesc.length > 1000) {
        const error = new Error('Mô tả chi tiết tối đa 1000 ký tự') as AppError;
        error.statusCode = 400;
        error.code = 'DESCRIPTION_TOO_LONG';
        throw error;
      }
    }

    const taskPriority = (priority === undefined ? 'MEDIUM' : priority) as TaskPriority;
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
      if (typeof due_date !== 'string' || !/^\d{4}-\d{2}-\d{2}(T.*Z)?$/.test(due_date) || isNaN(parsedDueDate.getTime()) || parsedDueDate.toISOString().slice(0, 10) !== due_date.slice(0, 10)) {
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
