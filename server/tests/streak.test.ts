import mongoose from 'mongoose';
import { User } from '../src/models/User';
import { Task } from '../src/models/Task';
import { Habit } from '../src/models/Habit';
import { Notification } from '../src/models/Notification';
import {
  getYesterdayDateString,
  processUserStreak,
  runStreakScan,
  startStreakCronJob,
  stopStreakCronJob,
  checkUserActivityOnDate
} from '../src/cron/streakResetJob';
import { getVietnamDateString } from '../src/services/gamification.service';

describe('Scheduled Cronjob Quét Chuỗi Streak (Daily Streak Maintenance) [TECH-S3-02]', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    stopStreakCronJob();
  });

  // =========================================================================
  // 1. Kiểm tra Múi giờ Việt Nam UTC+7 và Ngày hôm qua
  // =========================================================================
  describe('1. Múi giờ UTC+7 & Xác định Ngày hôm qua (Vietnam Timezone)', () => {
    it('tính chính xác ngày hôm qua cho một mốc giờ bình thường', () => {
      // 2026-11-25 00:05:00 UTC+7 (17:05:00 UTC ngày 24/11)
      const testDate = new Date('2026-11-24T17:05:00.000Z');
      const todayStr = getVietnamDateString(testDate);
      const yesterdayStr = getYesterdayDateString(testDate);

      expect(todayStr).toBe('2026-11-25');
      expect(yesterdayStr).toBe('2026-11-24');
    });

    it('tính chính xác ngày hôm qua khi chuyển giao đầu tháng', () => {
      // 2026-12-01 00:05:00 UTC+7 (17:05:00 UTC ngày 30/11)
      const testDate = new Date('2026-11-30T17:05:00.000Z');
      const todayStr = getVietnamDateString(testDate);
      const yesterdayStr = getYesterdayDateString(testDate);

      expect(todayStr).toBe('2026-12-01');
      expect(yesterdayStr).toBe('2026-11-30');
    });

    it('tính chính xác ngày hôm qua khi chuyển giao năm mới', () => {
      // 2027-01-01 00:05:00 UTC+7 (17:05:00 UTC ngày 31/12/2026)
      const testDate = new Date('2026-12-31T17:05:00.000Z');
      const todayStr = getVietnamDateString(testDate);
      const yesterdayStr = getYesterdayDateString(testDate);

      expect(todayStr).toBe('2027-01-01');
      expect(yesterdayStr).toBe('2026-12-31');
    });
  });

  // =========================================================================
  // 2. Logic xử lý Streak từng User (processUserStreak)
  // =========================================================================
  describe('2. Logic xử lý Streak từng User (processUserStreak)', () => {
    const yesterday = '2026-11-24';
    const today = '2026-11-25';

    it('Kịch bản 1: Tăng chuỗi (+1 Streak) khi người dùng có hoạt động ngày hôm qua', async () => {
      const mockUser: any = {
        _id: new mongoose.Types.ObjectId(),
        email: 'active@test.com',
        current_streak: 3,
        streak_freeze_count: 1,
        last_active_date: yesterday,
        save: jest.fn().mockResolvedValue(true)
      };

      const result = await processUserStreak(mockUser, yesterday, today);

      expect(result.action).toBe('INCREMENT');
      expect(result.oldStreak).toBe(3);
      expect(result.newStreak).toBe(4);
      expect(result.oldFreezeCount).toBe(1);
      expect(result.newFreezeCount).toBe(1);
      expect(result.notificationCreated).toBe(false);
      expect(mockUser.current_streak).toBe(4);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('Kịch bản 2: Bảo vệ chuỗi bằng Streak Freeze khi bỏ lỡ hôm qua nhưng còn lượt freeze', async () => {
      const mockUser: any = {
        _id: new mongoose.Types.ObjectId(),
        email: 'freeze@test.com',
        current_streak: 7,
        streak_freeze_count: 1,
        last_active_date: '2026-11-20', // Không hoạt động hôm qua
        save: jest.fn().mockResolvedValue(true)
      };

      const notifSpy = jest.spyOn(Notification, 'create').mockResolvedValue({} as any);

      const result = await processUserStreak(mockUser, yesterday, today);

      expect(result.action).toBe('MAINTAIN_FREEZE');
      expect(result.oldStreak).toBe(7);
      expect(result.newStreak).toBe(7); // Giữ nguyên streak
      expect(result.oldFreezeCount).toBe(1);
      expect(result.newFreezeCount).toBe(0); // Tiêu hao 1 lượt freeze
      expect(result.notificationCreated).toBe(true);
      expect(mockUser.streak_freeze_count).toBe(0);
      expect(mockUser.save).toHaveBeenCalled();

      // Kiểm tra Notification đã được tạo
      expect(notifSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser._id,
          title: 'Bảo vệ chuỗi ngày',
          type: 'REMINDER',
          is_read: false
        })
      );
    });

    it('Kịch bản 3: Reset Streak về 0 khi bỏ lỡ hôm qua và đã hết sạch lượt freeze', async () => {
      const mockUser: any = {
        _id: new mongoose.Types.ObjectId(),
        email: 'reset@test.com',
        current_streak: 15,
        streak_freeze_count: 0, // Hết lượt freeze
        last_active_date: '2026-11-22',
        save: jest.fn().mockResolvedValue(true)
      };

      const notifSpy = jest.spyOn(Notification, 'create');

      const result = await processUserStreak(mockUser, yesterday, today);

      expect(result.action).toBe('RESET');
      expect(result.oldStreak).toBe(15);
      expect(result.newStreak).toBe(0); // Reset về 0
      expect(result.oldFreezeCount).toBe(0);
      expect(result.newFreezeCount).toBe(0);
      expect(result.notificationCreated).toBe(false);
      expect(mockUser.current_streak).toBe(0);
      expect(mockUser.save).toHaveBeenCalled();
      expect(notifSpy).not.toHaveBeenCalled();
    });

    it('Kịch bản 4: Không thao tác (NO_OP) nếu current_streak đã là 0 và không hoạt động', async () => {
      const mockUser: any = {
        _id: new mongoose.Types.ObjectId(),
        email: 'noop@test.com',
        current_streak: 0,
        streak_freeze_count: 1,
        last_active_date: null,
        save: jest.fn().mockResolvedValue(true)
      };

      const result = await processUserStreak(mockUser, yesterday, today);

      expect(result.action).toBe('NO_OP');
      expect(result.oldStreak).toBe(0);
      expect(result.newStreak).toBe(0);
      expect(result.oldFreezeCount).toBe(1);
      expect(result.newFreezeCount).toBe(1); // Không bị trừ freeze oan
      expect(mockUser.save).not.toHaveBeenCalled();
    });

    it('Kịch bản 5.1: Người dùng hoạt động hôm nay và hôm qua cũng có hoạt động', async () => {
      const mockUser: any = {
        _id: new mongoose.Types.ObjectId(),
        email: 'earlybird@test.com',
        current_streak: 4,
        streak_freeze_count: 1,
        last_active_date: today,
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock Task.findOne tìm thấy task hôm qua
      jest.spyOn(Task, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId() })
      } as any);

      const result = await processUserStreak(mockUser, yesterday, today);

      expect(result.action).toBe('INCREMENT');
      expect(result.oldStreak).toBe(4);
      expect(result.newStreak).toBe(5);
      expect(mockUser.current_streak).toBe(5);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('Kịch bản 5.2: Người dùng hoạt động hôm nay nhưng hôm qua không hoạt động và còn freeze', async () => {
      const mockUser: any = {
        _id: new mongoose.Types.ObjectId(),
        email: 'freeze_today@test.com',
        current_streak: 6,
        streak_freeze_count: 1,
        last_active_date: today,
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock cả Task và Habit không có hoạt động hôm qua
      jest.spyOn(Task, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      } as any);
      jest.spyOn(Habit, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      } as any);
      jest.spyOn(Notification, 'create').mockResolvedValue({} as any);

      const result = await processUserStreak(mockUser, yesterday, today);

      expect(result.action).toBe('MAINTAIN_FREEZE');
      expect(result.oldStreak).toBe(6);
      expect(result.newStreak).toBe(6);
      expect(result.newFreezeCount).toBe(0);
      expect(mockUser.streak_freeze_count).toBe(0);
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. Quét toàn bộ CSDL (runStreakScan)
  // =========================================================================
  describe('3. Quét toàn diện Database (runStreakScan)', () => {
    it('thực thi quét chính xác và tổng hợp báo cáo cho nhiều users', async () => {
      const refDate = new Date('2026-11-24T17:05:00.000Z'); // 2026-11-25 00:05 UTC+7
      const yesterday = '2026-11-24';

      const mockUsers: any[] = [
        // User 1: Active hôm qua -> Tăng streak
        {
          _id: new mongoose.Types.ObjectId(),
          email: 'u1@test.com',
          current_streak: 2,
          streak_freeze_count: 1,
          last_active_date: yesterday,
          save: jest.fn().mockResolvedValue(true)
        },
        // User 2: Miss hôm qua, còn freeze -> Tiêu hao freeze
        {
          _id: new mongoose.Types.ObjectId(),
          email: 'u2@test.com',
          current_streak: 5,
          streak_freeze_count: 1,
          last_active_date: '2026-11-20',
          save: jest.fn().mockResolvedValue(true)
        },
        // User 3: Miss hôm qua, hết freeze -> Reset về 0
        {
          _id: new mongoose.Types.ObjectId(),
          email: 'u3@test.com',
          current_streak: 8,
          streak_freeze_count: 0,
          last_active_date: '2026-11-20',
          save: jest.fn().mockResolvedValue(true)
        },
        // User 4: Inactive sẵn (streak = 0) -> No-op
        {
          _id: new mongoose.Types.ObjectId(),
          email: 'u4@test.com',
          current_streak: 0,
          streak_freeze_count: 1,
          last_active_date: null,
          save: jest.fn().mockResolvedValue(true)
        }
      ];

      jest.spyOn(User, 'find').mockResolvedValue(mockUsers);
      jest.spyOn(Notification, 'create').mockResolvedValue({} as any);

      const summary = await runStreakScan(refDate);

      expect(summary.totalUsersChecked).toBe(4);
      expect(summary.incremented).toBe(1);
      expect(summary.maintainedWithFreeze).toBe(1);
      expect(summary.resetToZero).toBe(1);
      expect(summary.noOp).toBe(1);
      expect(summary.errors).toBe(0);
      expect(summary.yesterday).toBe('2026-11-24');
      expect(summary.today).toBe('2026-11-25');
    });

    it('xử lý an toàn khi xảy ra lỗi với một user riêng lẻ', async () => {
      const refDate = new Date('2026-11-24T17:05:00.000Z');
      const yesterday = '2026-11-24';

      const mockUsers: any[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          email: 'error_user@test.com',
          current_streak: 2,
          streak_freeze_count: 1,
          last_active_date: yesterday,
          save: jest.fn().mockRejectedValue(new Error('Database write error'))
        },
        {
          _id: new mongoose.Types.ObjectId(),
          email: 'normal_user@test.com',
          current_streak: 2,
          streak_freeze_count: 1,
          last_active_date: yesterday,
          save: jest.fn().mockResolvedValue(true)
        }
      ];

      jest.spyOn(User, 'find').mockResolvedValue(mockUsers);

      const summary = await runStreakScan(refDate);

      expect(summary.totalUsersChecked).toBe(2);
      expect(summary.errors).toBe(1);
      expect(summary.incremented).toBe(1);
    });
  });

  // =========================================================================
  // 4. Kiểm tra helper checkUserActivityOnDate
  // =========================================================================
  describe('4. Helper checkUserActivityOnDate', () => {
    const userId = new mongoose.Types.ObjectId();

    it('trả về true khi có Task hoàn thành trong ngày chỉ định', async () => {
      jest.spyOn(Task, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId() })
      } as any);

      const isActive = await checkUserActivityOnDate(userId, '2026-11-24');
      expect(isActive).toBe(true);
    });

    it('trả về true khi có Habit check-in trong ngày chỉ định', async () => {
      jest.spyOn(Task, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      } as any);
      jest.spyOn(Habit, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId() })
      } as any);

      const isActive = await checkUserActivityOnDate(userId, '2026-11-24');
      expect(isActive).toBe(true);
    });

    it('trả về false khi không có task hay habit nào hoàn thành', async () => {
      jest.spyOn(Task, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      } as any);
      jest.spyOn(Habit, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      } as any);

      const isActive = await checkUserActivityOnDate(userId, '2026-11-24');
      expect(isActive).toBe(false);
    });
  });

  // =========================================================================
  // 5. Kiểm tra Lập lịch và Dừng Cronjob Lifecycle
  // =========================================================================
  describe('5. Lập lịch và Dừng Cronjob Lifecycle', () => {
    it('khởi tạo scheduled cron task hợp lệ và có thể dừng an toàn', () => {
      const task = startStreakCronJob({
        cronPattern: '* * * * *',
        timezone: 'Asia/Ho_Chi_Minh'
      });

      expect(task).toBeDefined();
      expect(typeof task.stop).toBe('function');

      stopStreakCronJob();
    });
  });
});
