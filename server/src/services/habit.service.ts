import mongoose from 'mongoose';
import { Habit } from '../models/Habit';
import {
  IHabit,
  CreateHabitDTO,
  UpdateHabitDTO,
  HabitListResponseData,
  HabitFrequency
} from '../types/habit.types';
import { AppError } from '../middlewares/error.middleware';

export class HabitService {
  /**
   * [US-S2-01 / TECH-S2-02] Lấy danh sách thói quen active của người dùng
   * @param userId - ID người dùng
   * @returns Danh sách thói quen với logs 7 ngày gần nhất và tổng số lượng
   */
  async getHabits(userId: string): Promise<HabitListResponseData> {
    const habits = await Habit.find({ user_id: userId, is_active: true })
      .sort({ created_at: -1 })
      .lean();

    // Giới hạn mảng logs tối đa 7 ngày gần nhất để vẽ mini weekly chart
    const processedHabits = habits.map((habit) => ({
      ...habit,
      logs: Array.isArray(habit.logs) ? habit.logs.slice(-7) : []
    }));

    return {
      habits: processedHabits as unknown as IHabit[],
      total: processedHabits.length
    };
  }

  /**
   * [US-S2-01 / TECH-S2-02] Tạo thói quen mới
   * @param userId - ID người dùng
   * @param data - { title, frequency, target_days }
   */
  async createHabit(userId: string, data: CreateHabitDTO): Promise<IHabit> {
    const { title, frequency, target_days } = data;

    // 1. Validate title
    if (!title || typeof title !== 'string' || !title.trim()) {
      const error = new Error('Tiêu đề thói quen không được để trống') as AppError;
      error.statusCode = 400;
      error.code = 'TITLE_REQUIRED';
      throw error;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 200) {
      const error = new Error('Tiêu đề thói quen không được vượt quá 200 ký tự') as AppError;
      error.statusCode = 400;
      error.code = 'TITLE_TOO_LONG';
      throw error;
    }

    // 2. Validate frequency (nếu có truyền)
    let validatedFrequency: HabitFrequency = 'DAILY';
    if (frequency !== undefined) {
      const validFrequencies: HabitFrequency[] = ['DAILY', 'WEEKLY'];
      if (!validFrequencies.includes(frequency)) {
        const error = new Error(
          'Giá trị frequency không hợp lệ. Chỉ chấp nhận: DAILY, WEEKLY'
        ) as AppError;
        error.statusCode = 400;
        error.code = 'INVALID_FREQUENCY';
        throw error;
      }
      validatedFrequency = frequency;
    }

    // 3. Validate target_days (nếu có truyền)
    let validatedTargetDays = 7;
    if (target_days !== undefined) {
      if (
        typeof target_days !== 'number' ||
        !Number.isInteger(target_days) ||
        target_days < 1 ||
        target_days > 7
      ) {
        const error = new Error(
          'Số ngày mục tiêu target_days phải là số nguyên từ 1 đến 7'
        ) as AppError;
        error.statusCode = 400;
        error.code = 'INVALID_TARGET_DAYS';
        throw error;
      }
      validatedTargetDays = target_days;
    }

    // 4. Khởi tạo và lưu habit
    const newHabit = new Habit({
      user_id: userId,
      title: trimmedTitle,
      frequency: validatedFrequency,
      target_days: validatedTargetDays,
      current_streak: 0,
      is_active: true,
      logs: []
    });

    return await newHabit.save();
  }

  /**
   * [US-S2-01 / TECH-S2-02] Lấy thông tin 1 thói quen theo ID
   */
  async getHabitById(userId: string, habitId: string): Promise<IHabit> {
    if (!mongoose.Types.ObjectId.isValid(habitId)) {
      const error = new Error('Định danh thói quen không hợp lệ') as AppError;
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const habit = await Habit.findOne({ _id: habitId, user_id: userId, is_active: true });
    if (habit) {
      return habit;
    }

    const exists = await Habit.exists({ _id: habitId });
    const error = new Error(
      exists
        ? 'Bạn không có quyền thao tác trên thói quen này'
        : 'Không tìm thấy thói quen yêu cầu hoặc bạn không có quyền truy cập'
    ) as AppError;
    error.statusCode = exists ? 403 : 404;
    error.code = exists ? 'FORBIDDEN' : 'HABIT_NOT_FOUND';
    throw error;
  }

  /**
   * [US-S2-01 / TECH-S2-02] Cập nhật thói quen
   */
  async updateHabit(userId: string, habitId: string, data: UpdateHabitDTO): Promise<IHabit> {
    if (!mongoose.Types.ObjectId.isValid(habitId)) {
      const error = new Error('Định danh thói quen không hợp lệ') as AppError;
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const updateFields: Record<string, any> = {};

    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || !data.title.trim()) {
        const error = new Error('Tiêu đề thói quen không được để trống') as AppError;
        error.statusCode = 400;
        error.code = 'TITLE_REQUIRED';
        throw error;
      }
      const trimmedTitle = data.title.trim();
      if (trimmedTitle.length > 200) {
        const error = new Error('Tiêu đề thói quen không được vượt quá 200 ký tự') as AppError;
        error.statusCode = 400;
        error.code = 'TITLE_TOO_LONG';
        throw error;
      }
      updateFields.title = trimmedTitle;
    }

    if (data.frequency !== undefined) {
      const validFrequencies: HabitFrequency[] = ['DAILY', 'WEEKLY'];
      if (!validFrequencies.includes(data.frequency)) {
        const error = new Error(
          'Giá trị frequency không hợp lệ. Chỉ chấp nhận: DAILY, WEEKLY'
        ) as AppError;
        error.statusCode = 400;
        error.code = 'INVALID_FREQUENCY';
        throw error;
      }
      updateFields.frequency = data.frequency;
    }

    if (data.target_days !== undefined) {
      if (
        typeof data.target_days !== 'number' ||
        !Number.isInteger(data.target_days) ||
        data.target_days < 1 ||
        data.target_days > 7
      ) {
        const error = new Error(
          'Số ngày mục tiêu target_days phải là số nguyên từ 1 đến 7'
        ) as AppError;
        error.statusCode = 400;
        error.code = 'INVALID_TARGET_DAYS';
        throw error;
      }
      updateFields.target_days = data.target_days;
    }

    const habit = await Habit.findOneAndUpdate(
      { _id: habitId, user_id: userId, is_active: true },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (habit) {
      return habit;
    }

    const exists = await Habit.exists({ _id: habitId });
    const error = new Error(
      exists
        ? 'Bạn không có quyền thao tác trên thói quen này'
        : 'Không tìm thấy thói quen yêu cầu hoặc bạn không có quyền truy cập'
    ) as AppError;
    error.statusCode = exists ? 403 : 404;
    error.code = exists ? 'FORBIDDEN' : 'HABIT_NOT_FOUND';
    throw error;
  }

  /**
   * [US-S2-01 / TECH-S2-02] Xóa / Hủy theo dõi thói quen
   * Gắn chặt điều kiện { _id: habitId, user_id: userId, is_active: true }
   * Cập nhật soft-delete is_active = false
   */
  async deleteHabit(userId: string, habitId: string): Promise<{ id: string }> {
    if (!mongoose.Types.ObjectId.isValid(habitId)) {
      const error = new Error('Định danh thói quen không hợp lệ') as AppError;
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const habit = await Habit.findOneAndUpdate(
      { _id: habitId, user_id: userId, is_active: true },
      { $set: { is_active: false } },
      { new: true }
    );

    if (habit) {
      return { id: habitId };
    }

    const exists = await Habit.exists({ _id: habitId });
    const error = new Error(
      exists
        ? 'Bạn không có quyền thao tác trên thói quen này'
        : 'Không tìm thấy thói quen yêu cầu hoặc bạn không có quyền truy cập'
    ) as AppError;
    error.statusCode = exists ? 403 : 404;
    error.code = exists ? 'FORBIDDEN' : 'HABIT_NOT_FOUND';
    throw error;
  }
}

export const habitService = new HabitService();
export default habitService;
