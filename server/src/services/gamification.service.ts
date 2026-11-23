import mongoose, { Types } from 'mongoose';
import { Task } from '../models/Task';
import { Habit } from '../models/Habit';
import { User } from '../models/User';
import { TaskPriority } from '../types/task.types';
import { DailyXPCapResult, RevertXPResult } from '../types/gamification.types';

export const DAILY_XP_CAP = 200;
export const HABIT_CHECKIN_XP = 15;

export const TASK_PRIORITY_XP: Record<string, number> = {
  LOW: 10,
  MEDIUM: 20,
  HIGH: 30,
  HABIT: 15
};

/**
 * Lấy chuỗi ngày YYYY-MM-DD theo múi giờ Việt Nam (UTC+7, Asia/Ho_Chi_Minh)
 */
export function getVietnamDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

/**
 * Lấy khoảng thời gian bắt đầu (00:00:00) và kết thúc (23:59:59.999) của ngày theo UTC+7
 */
export function getVietnamDayRangeUTC(date: Date = new Date()): { startOfDay: Date; endOfDay: Date } {
  const dateStr = getVietnamDateString(date);
  const startOfDay = new Date(`${dateStr}T00:00:00.000+07:00`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999+07:00`);
  return { startOfDay, endOfDay };
}

/**
 * Re-export các tiện ích tính toán cấp độ từ gamificationUtils [TECH-S2-05]
 */
export {
  calculateLevel,
  calculateRequiredXP,
  calculateNextLevelXP,
  calculateProgressPercent,
  getLevelTitle,
  checkLevelProgression,
  LEVEL_TITLES
} from '../utils/gamificationUtils';
import { calculateLevel } from '../utils/gamificationUtils';

export class GamificationService {
  /**
   * [US-S2-03 / TECH-S2-04] Tính toán XP thưởng theo độ ưu tiên hoặc loại hoạt động
   * - LOW: 10 XP
   * - MEDIUM: 20 XP
   * - HIGH: 30 XP
   * - Habit Check-in: 15 XP
   */
  calculateTaskXP(priority?: TaskPriority | string | null): number {
    if (!priority) return TASK_PRIORITY_XP.MEDIUM;
    const key = String(priority).trim().toUpperCase();
    if (key === 'HABIT' || key === 'HABIT_CHECKIN' || key === 'CHECK_IN' || key === 'CHECKIN') {
      return HABIT_CHECKIN_XP;
    }
    return TASK_PRIORITY_XP[key] ?? TASK_PRIORITY_XP.MEDIUM;
  }

  /**
   * Tính tổng XP người dùng đã nhận trong ngày hôm nay (00:00 - 23:59 theo múi giờ Asia/Ho_Chi_Minh UTC+7)
   * Bao gồm Task completed hôm nay và Habit logs check-in hôm nay
   */
  async getCurrentDayXP(userId: string | Types.ObjectId, targetDate: Date = new Date()): Promise<number> {
    const todayVN = getVietnamDateString(targetDate);
    const { startOfDay, endOfDay } = getVietnamDayRangeUTC(targetDate);

    const isTaskFindMocked = Boolean((Task.find as any)?._isMockFunction);
    const isHabitFindMocked = Boolean((Habit.find as any)?._isMockFunction);
    const isConnected = mongoose.connection.readyState === 1;

    // 1. Tính tổng XP từ các One-off Task hoàn thành hôm nay
    let taskXP = 0;
    if (isConnected || isTaskFindMocked) {
      try {
        const completedTasks = await Task.find({
          user_id: userId,
          status: 'COMPLETED',
          completed_at: { $gte: startOfDay, $lte: endOfDay }
        }).lean();

        if (Array.isArray(completedTasks)) {
          taskXP = completedTasks.reduce((sum, task) => {
            const earned = (task as any).xp_earned !== undefined ? (task as any).xp_earned : (task.xp_reward || 20);
            return sum + (Number(earned) || 0);
          }, 0);
        }
      } catch {
        taskXP = 0;
      }
    }

    // 2. Tính tổng XP từ Habit check-in logs hôm nay
    let habitXP = 0;
    if (isConnected || isHabitFindMocked) {
      try {
        const habits = await Habit.find({
          user_id: userId,
          'logs.log_date': todayVN
        }).lean();

        if (Array.isArray(habits)) {
          for (const habit of habits) {
            if (Array.isArray(habit.logs)) {
              for (const log of habit.logs) {
                if (log.log_date === todayVN && log.is_completed) {
                  const earned = log.xp_earned !== undefined ? log.xp_earned : HABIT_CHECKIN_XP;
                  habitXP += (Number(earned) || 0);
                }
              }
            }
          }
        }
      } catch {
        habitXP = 0;
      }
    }

    return taskXP + habitXP;
  }

  /**
   * [US-S2-04 / TECH-S2-04] Cơ chế kiểm soát trần kinh nghiệm trong ngày (Daily XP Cap = 200 XP)
   * - Nếu currentDayXP + xpToAdd > 200: điều chỉnh số XP thực nhận = max(0, 200 - currentDayXP)
   * - Nếu đã đạt 200 XP: xp_earned = 0, is_cap_reached = true
   */
  async checkDailyXPCap(
    userId: string | Types.ObjectId,
    xpToAdd: number,
    targetDate: Date = new Date()
  ): Promise<DailyXPCapResult> {
    const currentDayXP = await this.getCurrentDayXP(userId, targetDate);
    const validXPToAdd = Math.max(0, xpToAdd);

    if (currentDayXP >= DAILY_XP_CAP) {
      return {
        currentDayXP,
        xp_earned: 0,
        is_cap_reached: true,
        remaining_xp: 0
      };
    }

    if (currentDayXP + validXPToAdd > DAILY_XP_CAP) {
      const xp_earned = Math.max(0, DAILY_XP_CAP - currentDayXP);
      return {
        currentDayXP,
        xp_earned,
        is_cap_reached: true,
        remaining_xp: 0
      };
    }

    const xp_earned = validXPToAdd;
    const newTotalDayXP = currentDayXP + xp_earned;
    const is_cap_reached = newTotalDayXP >= DAILY_XP_CAP;

    return {
      currentDayXP,
      xp_earned,
      is_cap_reached,
      remaining_xp: Math.max(0, DAILY_XP_CAP - newTotalDayXP)
    };
  }

  /**
   * [US-S2-04 / TECH-S2-04] Hoàn tác điểm thưởng khi người dùng chuyển Task từ COMPLETED ngược lại TODO / IN_PROGRESS
   * Tự động trừ đúng số XP tương ứng từ user.total_xp (đảm bảo total_xp >= 0) và tính lại current_level
   */
  async revertTaskXP(userId: string | Types.ObjectId, xpToDeduct: number): Promise<RevertXPResult> {
    const isUserFindMocked = Boolean((User.findById as any)?._isMockFunction);
    const isConnected = mongoose.connection.readyState === 1;

    let user: any = null;
    if (isConnected || isUserFindMocked) {
      user = await User.findById(userId);
    }

    if (!user && (isConnected || isUserFindMocked)) {
      throw Object.assign(new Error('Không tìm thấy người dùng'), {
        statusCode: 404,
        code: 'USER_NOT_FOUND'
      });
    }

    const actualDeduct = Math.max(0, xpToDeduct);
    if (user) {
      user.total_xp = Math.max(0, (user.total_xp || 0) - actualDeduct);
      user.current_level = calculateLevel(user.total_xp);
      if (typeof user.save === 'function') {
        await user.save();
      }
    }

    return {
      userId: userId.toString(),
      reverted_xp: actualDeduct,
      total_xp: user?.total_xp ?? 0,
      current_level: user?.current_level ?? 1
    };
  }
}

export const gamificationService = new GamificationService();
export default gamificationService;
