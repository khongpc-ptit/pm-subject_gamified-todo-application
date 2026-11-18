import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/task.service';
import { ApiSuccessResponse } from '../types/api.types';
import { ITask, TaskListResponseData } from '../types/task.types';

export class TaskController {
  async completeTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await taskService.completeTask(req.user!.id, String(req.params.id));
      res.json({ success: true, data: task, message: 'Nhiệm vụ đã được đánh dấu hoàn thành', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
  }

  /**
   * [US-S1-02 / TECH-S1-03] Lấy danh sách nhiệm vụ của người dùng
   * GET /api/v1/tasks
   */
  async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { status, priority } = req.query;

      const result = await taskService.getTasks(userId, {
        status: status as string | undefined,
        priority: priority as string | undefined
      });

      const response: ApiSuccessResponse<TaskListResponseData> = {
        success: true,
        data: result,
        message: 'Lấy danh sách nhiệm vụ thành công',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * [US-S1-01 / TECH-S1-02] Tạo nhiệm vụ mới
   * POST /api/v1/tasks
   */
  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const task = await taskService.createTask(userId, req.body);

      const response: ApiSuccessResponse<ITask> = {
        success: true,
        data: task,
        message: 'Tạo nhiệm vụ thành công',
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * [US-S1-03 / TECH-S1-04] Cập nhật thông tin công việc
   * PUT /api/v1/tasks/:id
   */
  async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;
      const updatedTask = await taskService.updateTask(userId, id, req.body);

      const response: ApiSuccessResponse<ITask> = {
        success: true,
        data: updatedTask,
        message: 'Cập nhật nhiệm vụ thành công',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
export default taskController;
