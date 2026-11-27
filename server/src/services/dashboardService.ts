import mongoose from 'mongoose';
import { Task } from '../models/Task';
import { Habit } from '../models/Habit';
import { User } from '../models/User';
import { UserBadge } from '../models/UserBadge';
import { Badge } from '../models/Badge';
import { getVietnamDateString, getVietnamDayRangeUTC } from './gamification.service';
import { DashboardStats, DashboardSummaryData, WeeklyActivityItem } from '../types/dashboard.types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const VIETNAM_TIMEZONE = '+07:00';

interface WeeklyAggregateRow {
  _id: string;
  tasks_completed?: number;
  habits_completed?: number;
  xp_earned?: number;
}

interface TaskCompletionAggregateRow {
  _id: null;
  total_tasks: number;
  completed_tasks: number;
}

/**
 * Tạo mảng 7 ngày gần nhất theo múi giờ Việt Nam (UTC+7), sắp xếp tăng dần từ quá khứ đến hôm nay.
 */
export function getLast7VietnamDates(referenceDate: Date = new Date()): string[] {
  const dates: string[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const targetDate = new Date(referenceDate.getTime() - offset * MS_PER_DAY);
    dates.push(getVietnamDateString(targetDate));
  }
  return dates;
}

/**
 * Pipeline 1: Thống kê số lượng One-off Tasks hoàn thành và XP kiếm được trong 7 ngày gần nhất (UTC+7).
 */
export async function getWeeklyTaskStats(
  userObjectId: mongoose.Types.ObjectId,
  startOfWindow: Date,
  endOfWindow: Date
): Promise<WeeklyAggregateRow[]> {
  return Task.aggregate<WeeklyAggregateRow>([
    {
      $match: {
        user_id: userObjectId,
        status: 'COMPLETED',
        completed_at: { $gte: startOfWindow, $lte: endOfWindow }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$completed_at',
            timezone: VIETNAM_TIMEZONE
          }
        },
        tasks_completed: { $sum: 1 },
        xp_earned: { $sum: { $ifNull: ['$xp_earned', 0] } }
      }
    }
  ]);
}

/**
 * Pipeline 2: Thống kê số lượng Habits đã check-in và XP kiếm được trong 7 ngày gần nhất từ mảng nhúng logs.
 */
export async function getWeeklyHabitStats(
  userObjectId: mongoose.Types.ObjectId,
  startDateStr: string,
  endDateStr: string
): Promise<WeeklyAggregateRow[]> {
  return Habit.aggregate<WeeklyAggregateRow>([
    {
      $match: {
        user_id: userObjectId
      }
    },
    { $unwind: '$logs' },
    {
      $match: {
        'logs.is_completed': true,
        'logs.log_date': { $gte: startDateStr, $lte: endDateStr }
      }
    },
    {
      $group: {
        _id: '$logs.log_date',
        habits_completed: { $sum: 1 },
        xp_earned: { $sum: { $ifNull: ['$logs.xp_earned', 0] } }
      }
    }
  ]);
}

/**
 * Pipeline 3: Tính toán tổng số tasks, số tasks hoàn thành và tỷ lệ hoàn thành (%).
 */
export async function getTaskCompletionStats(
  userObjectId: mongoose.Types.ObjectId
): Promise<{ total_tasks: number; completed_tasks: number; completion_rate: number }> {
  const result = await Task.aggregate<TaskCompletionAggregateRow>([
    {
      $match: {
        user_id: userObjectId
      }
    },
    {
      $group: {
        _id: null,
        total_tasks: { $sum: 1 },
        completed_tasks: {
          $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
        }
      }
    }
  ]);

  const total_tasks = result[0]?.total_tasks ?? 0;
  const completed_tasks = result[0]?.completed_tasks ?? 0;
  const completion_rate =
    total_tasks > 0 ? Math.round((completed_tasks / total_tasks) * 10000) / 100 : 0;

  return { total_tasks, completed_tasks, completion_rate };
}

/**
 * Hợp nhất kết quả Aggregation của Tasks và Habits vào trục thời gian 7 ngày (ngày trống điền 0).
 */
export function mergeWeeklyActivity(
  dates: string[],
  taskRows: WeeklyAggregateRow[],
  habitRows: WeeklyAggregateRow[]
): WeeklyActivityItem[] {
  const taskMap = new Map(taskRows.map(row => [row._id, row]));
  const habitMap = new Map(habitRows.map(row => [row._id, row]));

  return dates.map(date => {
    const taskEntry = taskMap.get(date);
    const habitEntry = habitMap.get(date);

    const tasks_completed = taskEntry?.tasks_completed ?? 0;
    const habits_completed = habitEntry?.habits_completed ?? 0;
    const xp_earned = (taskEntry?.xp_earned ?? 0) + (habitEntry?.xp_earned ?? 0);

    return {
      date,
      tasks_completed,
      habits_completed,
      xp_earned
    };
  });
}

/**
 * Tổng hợp toàn bộ dữ liệu Stats Hub & Weekly Productivity cho Dashboard của người dùng.
 */
export async function getDashboardSummary(
  userId: string,
  referenceDate: Date = new Date()
): Promise<DashboardSummaryData> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('INVALID_USER_ID');
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const dates = getLast7VietnamDates(referenceDate);
  const startDateStr = dates[0];
  const endDateStr = dates[dates.length - 1];

  const startOfWindow = getVietnamDayRangeUTC(new Date(`${startDateStr}T12:00:00+07:00`)).startOfDay;
  const endOfWindow = getVietnamDayRangeUTC(new Date(`${endDateStr}T12:00:00+07:00`)).endOfDay;

  const [
    weeklyTaskRows,
    weeklyHabitRows,
    completionStats,
    unlockedBadgesCount,
    totalBadgesCount,
    userDoc
  ] = await Promise.all([
    getWeeklyTaskStats(userObjectId, startOfWindow, endOfWindow),
    getWeeklyHabitStats(userObjectId, startDateStr, endDateStr),
    getTaskCompletionStats(userObjectId),
    UserBadge.countDocuments({ user_id: userObjectId }),
    Badge.countDocuments({}),
    User.findById(userObjectId).select('current_level total_xp current_streak')
  ]);

  const stats: DashboardStats = {
    total_tasks: completionStats.total_tasks,
    completed_tasks: completionStats.completed_tasks,
    completion_rate: completionStats.completion_rate,
    current_level: userDoc?.current_level ?? 1,
    total_xp: userDoc?.total_xp ?? 0,
    current_streak: userDoc?.current_streak ?? 0,
    unlocked_badges_count: unlockedBadgesCount,
    total_badges_count: totalBadgesCount
  };

  const weekly_activity = mergeWeeklyActivity(dates, weeklyTaskRows, weeklyHabitRows);

  return {
    stats,
    weekly_activity
  };
}

export const dashboardService = {
  getLast7VietnamDates,
  getWeeklyTaskStats,
  getWeeklyHabitStats,
  getTaskCompletionStats,
  mergeWeeklyActivity,
  getDashboardSummary
};

export default dashboardService;
