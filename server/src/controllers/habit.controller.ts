import { Request, Response, NextFunction } from 'express';
import { habitService } from '../services/habit.service';
import { ApiSuccessResponse } from '../types/api.types';
import { IHabit, HabitListResponseData } from '../types/habit.types';

export class HabitController {
  /**
   * [US-S2-01 / TECH-S2-02] Lấy danh sách thói quen của người dùng
   * GET /api/v1/habits
   */
  async getHabits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await habitService.getHabits(userId);

      const response: ApiSuccessResponse<HabitListResponseData> = {
        success: true,
        data: result,
        message: 'Lấy danh sách thói quen thành công',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * [US-S2-01 / TECH-S2-02] Tạo thói quen mới
   * POST /api/v1/habits
   */
  async createHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const habit = await habitService.createHabit(userId, req.body);

      const response: ApiSuccessResponse<IHabit> = {
        success: true,
        data: habit,
        message: 'Tạo thói quen thành công',
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * [US-S2-01 / TECH-S2-02] Xem chi tiết 1 thói quen
   * GET /api/v1/habits/:id
   */
  async getHabitById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;
      const habit = await habitService.getHabitById(userId, id);

      const response: ApiSuccessResponse<IHabit> = {
        success: true,
        data: habit,
        message: 'Lấy thông tin thói quen thành công',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * [US-S2-01 / TECH-S2-02] Cập nhật thói quen
   * PUT /api/v1/habits/:id
   */
  async updateHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;
      const updated = await habitService.updateHabit(userId, id, req.body);

      const response: ApiSuccessResponse<IHabit> = {
        success: true,
        data: updated,
        message: 'Cập nhật thói quen thành công',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * [US-S2-01 / TECH-S2-02] Xóa / Hủy theo dõi thói quen
   * DELETE /api/v1/habits/:id
   */
  async deleteHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;
      const result = await habitService.deleteHabit(userId, id);

      const response: ApiSuccessResponse<{ id: string }> = {
        success: true,
        data: result,
        message: 'Đã xóa thói quen thành công',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const habitController = new HabitController();
export default habitController;
