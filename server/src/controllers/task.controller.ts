import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/task.service';
import { ApiSuccessResponse } from '../types/api.types';
import { ITask, TaskListResponseData } from '../types/task.types';

export class TaskController {
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
}

export const taskController = new TaskController();
export default taskController;
