import cron, { ScheduledTask } from 'node-cron';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { Habit } from '../models/Habit';
import { Notification } from '../models/Notification';
import { IUser } from '../types/user.types';
import { getVietnamDateString, getVietnamDayRangeUTC } from '../services/gamification.service';

export interface StreakProcessResult {
  userId: string;
  email: string;
  action: 'INCREMENT' | 'MAINTAIN_FREEZE' | 'RESET' | 'NO_OP';
  oldStreak: number;
  newStreak: number;
  oldFreezeCount: number;
  newFreezeCount: number;
  notificationCreated: boolean;
}

export interface StreakScanSummary {
  timestamp: string;
  yesterday: string;
  today: string;
  totalUsersChecked: number;
  incremented: number;
  maintainedWithFreeze: number;
  resetToZero: number;
  noOp: number;
  errors: number;
  results: StreakProcessResult[];
}

/**
 * Lấy chuỗi ngày hôm qua (YYYY-MM-DD) theo múi giờ Việt Nam (UTC+7)
 */
export function getYesterdayDateString(referenceDate: Date = new Date()): string {
  // Trừ 24 giờ từ thời điểm tham chiếu để lùi về ngày hôm qua
  const yesterdayTime = new Date(referenceDate.getTime() - 24 * 60 * 60 * 1000);
  return getVietnamDateString(yesterdayTime);
}

/**
 * Kiểm tra xem người dùng có bất kỳ hoạt động nào (Task hoàn thành hoặc Habit check-in) trong ngày dateStr (UTC+7)
 */
export async function checkUserActivityOnDate(
  userId: mongoose.Types.ObjectId | string,
  dateStr: string
): Promise<boolean> {
  const { startOfDay, endOfDay } = getVietnamDayRangeUTC(new Date(`${dateStr}T12:00:00+07:00`));

  // 1. Kiểm tra có task nào hoàn thành trong khoảng thời gian này không
  const completedTask = await Task.findOne({
    user_id: userId,
    status: 'COMPLETED',
    completed_at: { $gte: startOfDay, $lte: endOfDay }
  }).select('_id');

  if (completedTask) {
    return true;
  }

  // 2. Kiểm tra có thói quen nào đã check-in trong ngày dateStr không
  const checkedHabit = await Habit.findOne({
    user_id: userId,
    logs: {
      $elemMatch: {
        log_date: dateStr,
        is_completed: true
      }
    }
  }).select('_id');

  return Boolean(checkedHabit);
}

/**
 * Xử lý logic điều chỉnh chuỗi streak cho một người dùng cụ thể
 */
export async function processUserStreak(
  user: IUser,
  yesterdayStr: string,
  todayStr: string
): Promise<StreakProcessResult> {
  const userIdStr = String(user._id);
  const oldStreak = user.current_streak || 0;
  const oldFreeze = typeof user.streak_freeze_count === 'number' ? user.streak_freeze_count : 1;

  let action: 'INCREMENT' | 'MAINTAIN_FREEZE' | 'RESET' | 'NO_OP' = 'NO_OP';
  let notificationCreated = false;

  const lastActive = user.last_active_date;
  const wasProactivelyFrozenYesterday = user.streak_frozen_date === yesterdayStr;

  // Trường hợp 1: Người dùng có hoạt động ngày hôm qua
  if (lastActive === yesterdayStr) {
    user.current_streak = oldStreak + 1;
    action = 'INCREMENT';
  } else if (lastActive === todayStr) {
    // Trường hợp 2: Người dùng đã hoạt động hôm nay (trước giờ quét 00:05)
    // Kiểm tra xem ngày hôm qua họ có hoạt động không
    const wasActiveYesterday = await checkUserActivityOnDate(user._id, yesterdayStr);
    if (wasActiveYesterday) {
      user.current_streak = oldStreak + 1;
      action = 'INCREMENT';
    } else {
      // Hôm qua không hoạt động nhưng hôm nay đã bắt đầu
      if (oldStreak > 0) {
        if (wasProactivelyFrozenYesterday) {
          // Đã chủ động tiêu 1 lượt đóng băng trong ngày hôm qua -> Giữ nguyên chuỗi, không trừ thêm
          action = 'MAINTAIN_FREEZE';
        } else if (oldFreeze > 0) {
          user.streak_freeze_count = oldFreeze - 1;
          action = 'MAINTAIN_FREEZE';
          await Notification.create({
            user_id: user._id,
            title: 'Bảo vệ chuỗi ngày',
            message: 'Chuỗi ngày của bạn đã được bảo vệ tự động bằng 01 lượt Đóng băng chuỗi.',
            type: 'REMINDER',
            is_read: false
          });
          notificationCreated = true;
        } else {
          // Bị reset về 1 vì hôm nay đã có hoạt động mới
          user.current_streak = 1;
          action = 'RESET';
        }
      } else {
        // Streak đang là 0 và hôm nay có hoạt động -> Bắt đầu chuỗi 1
        user.current_streak = 1;
        action = 'INCREMENT';
      }
    }
  } else {
    // Trường hợp 3: Người dùng KHÔNG có hoạt động ngày hôm qua (lastActive < yesterday hoặc chưa từng hoạt động)
    if (oldStreak > 0) {
      if (wasProactivelyFrozenYesterday) {
        // Đã chủ động tiêu 1 lượt đóng băng trong ngày hôm qua -> Giữ nguyên chuỗi, không trừ thêm
        action = 'MAINTAIN_FREEZE';
      } else if (oldFreeze > 0) {
        // Tiêu hao 1 lượt đóng băng chuỗi và giữ nguyên streak cũ
        user.streak_freeze_count = oldFreeze - 1;
        action = 'MAINTAIN_FREEZE';

        await Notification.create({
          user_id: user._id,
          title: 'Bảo vệ chuỗi ngày',
          message: 'Chuỗi ngày của bạn đã được bảo vệ tự động bằng 01 lượt Đóng băng chuỗi.',
          type: 'REMINDER',
          is_read: false
        });
        notificationCreated = true;
      } else {
        // Hết lượt freeze -> Reset chuỗi ngày về 0
        user.current_streak = 0;
        action = 'RESET';
      }
    } else {
      // current_streak đã là 0 -> Không thao tác gì
      action = 'NO_OP';
    }
  }

  if (action !== 'NO_OP' && typeof user.save === 'function') {
    await user.save();
  }

  return {
    userId: userIdStr,
    email: user.email,
    action,
    oldStreak,
    newStreak: user.current_streak || 0,
    oldFreezeCount: oldFreeze,
    newFreezeCount: typeof user.streak_freeze_count === 'number' ? user.streak_freeze_count : oldFreeze,
    notificationCreated
  };
}

/**
 * Thực thi một lượt quét toàn bộ cơ sở dữ liệu để bảo trì chuỗi Streak
 */
export async function runStreakScan(referenceDate: Date = new Date()): Promise<StreakScanSummary> {
  const yesterdayStr = getYesterdayDateString(referenceDate);
  const todayStr = getVietnamDateString(referenceDate);

  console.log(`[StreakJob] Bắt đầu quét chuỗi ngày lúc ${referenceDate.toISOString()}`);
  console.log(`[StreakJob] Phân tích hoạt động: Hôm qua = ${yesterdayStr}, Hôm nay = ${todayStr} (Giờ VN UTC+7)`);

  const summary: StreakScanSummary = {
    timestamp: new Date().toISOString(),
    yesterday: yesterdayStr,
    today: todayStr,
    totalUsersChecked: 0,
    incremented: 0,
    maintainedWithFreeze: 0,
    resetToZero: 0,
    noOp: 0,
    errors: 0,
    results: []
  };

  try {
    // Quét toàn bộ người dùng trong hệ thống
    const users = await User.find({});
    summary.totalUsersChecked = users.length;

    for (const user of users) {
      try {
        const result = await processUserStreak(user, yesterdayStr, todayStr);
        summary.results.push(result);

        switch (result.action) {
          case 'INCREMENT':
            summary.incremented++;
            break;
          case 'MAINTAIN_FREEZE':
            summary.maintainedWithFreeze++;
            break;
          case 'RESET':
            summary.resetToZero++;
            break;
          case 'NO_OP':
            summary.noOp++;
            break;
        }
      } catch (userError) {
        summary.errors++;
        console.error(`[StreakJob] Lỗi xử lý cho user ${user.email} (${user._id}):`, userError);
      }
    }

    console.log(
      `[StreakJob] Hoàn tất quét: Tổng ${summary.totalUsersChecked} users | ` +
        `+1 Streak: ${summary.incremented} | ` +
        `Đóng băng: ${summary.maintainedWithFreeze} | ` +
        `Reset về 0: ${summary.resetToZero} | ` +
        `Không đổi: ${summary.noOp} | ` +
        `Lỗi: ${summary.errors}`
    );
  } catch (scanError) {
    console.error('[StreakJob] Lỗi nghiêm trọng khi truy vấn danh sách người dùng:', scanError);
    summary.errors++;
  }

  return summary;
}

let activeCronTask: ScheduledTask | null = null;

export interface CronJobOptions {
  cronPattern?: string;
  timezone?: string;
  runImmediately?: boolean;
}

/**
 * Khởi động Cronjob định kỳ quét Streak
 * Mặc định: '5 17 * * *' theo UTC (tương đương 00:05 UTC+7 hàng ngày)
 */
export function startStreakCronJob(options: CronJobOptions = {}): ScheduledTask {
  if (activeCronTask) {
    console.log('[StreakJob] Cronjob đã hoạt động từ trước, hủy tác vụ cũ.');
    activeCronTask.stop();
  }

  // Cấu hình Cron pattern: '5 17 * * *' theo UTC tương đương 00:05 UTC+7 hàng ngày
  const pattern = options.cronPattern || process.env.STREAK_CRON_PATTERN || '5 17 * * *';
  const timezone = options.timezone || process.env.STREAK_CRON_TIMEZONE || 'UTC';

  console.log(`[StreakJob] Lập lịch Cronjob quét chuỗi: Pattern="${pattern}", Timezone="${timezone}" (00:05 UTC+7 hàng ngày)`);

  activeCronTask = cron.schedule(
    pattern,
    async () => {
      console.log('[StreakJob] Kích hoạt tác vụ theo lịch trình...');
      await runStreakScan();
    },
    {
      timezone
    }
  );

  if (options.runImmediately) {
    console.log('[StreakJob] Kích hoạt chạy ngay lập tức lần đầu (runImmediately)...');
    runStreakScan().catch(err => console.error('[StreakJob] Lỗi khi chạy ngay lập tức:', err));
  }

  return activeCronTask;
}

/**
 * Dừng Cronjob đang chạy (dùng khi tắt server hoặc teardown test)
 */
export function stopStreakCronJob(): void {
  if (activeCronTask) {
    activeCronTask.stop();
    activeCronTask = null;
    console.log('[StreakJob] Đã dừng Cronjob quét Streak.');
  }
}
