import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { Task } from '../src/models/Task';
import { Habit } from '../src/models/Habit';
import { User } from '../src/models/User';
import {
  gamificationService,
  calculateLevel,
  calculateRequiredXP,
  calculateNextLevelXP,
  getVietnamDateString,
  getVietnamDayRangeUTC,
  DAILY_XP_CAP,
  TASK_PRIORITY_XP
} from '../src/services/gamification.service';

const JWT_SECRET = 'test-secret-gamification-sprint2';

describe('[US-S2-04 / TECH-S2-04] Gamification Core Engine & Anti-gaming Rules', () => {
  const userId = new mongoose.Types.ObjectId().toString();
  const token = jwt.sign({ id: userId, email: 'hung.lm@ptit.edu.vn' }, JWT_SECRET);

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Hàm calculateTaskXP(priority) - Quy đổi điểm XP theo độ ưu tiên', () => {
    it('trả về 10 XP cho mức ưu tiên LOW', () => {
      expect(gamificationService.calculateTaskXP('LOW')).toBe(10);
      expect(gamificationService.calculateTaskXP('low')).toBe(10);
    });

    it('trả về 20 XP cho mức ưu tiên MEDIUM', () => {
      expect(gamificationService.calculateTaskXP('MEDIUM')).toBe(20);
      expect(gamificationService.calculateTaskXP('medium')).toBe(20);
    });

    it('trả về 30 XP cho mức ưu tiên HIGH', () => {
      expect(gamificationService.calculateTaskXP('HIGH')).toBe(30);
      expect(gamificationService.calculateTaskXP('high')).toBe(30);
    });

    it('trả về 15 XP cho hoạt động check-in Habit (HABIT / CHECK_IN)', () => {
      expect(gamificationService.calculateTaskXP('HABIT')).toBe(15);
      expect(gamificationService.calculateTaskXP('habit')).toBe(15);
      expect(gamificationService.calculateTaskXP('CHECK_IN')).toBe(15);
      expect(gamificationService.calculateTaskXP('HABIT_CHECKIN')).toBe(15);
    });

    it('trả về mặc định 20 XP (MEDIUM) khi không truyền hoặc giá trị không xác định', () => {
      expect(gamificationService.calculateTaskXP(undefined)).toBe(20);
      expect(gamificationService.calculateTaskXP(null)).toBe(20);
      expect(gamificationService.calculateTaskXP('')).toBe(20);
      expect(gamificationService.calculateTaskXP('UNKNOWN_PRIORITY')).toBe(20);
    });
  });

  describe('2. Xử lý múi giờ Việt Nam UTC+7 và Công thức cấp bậc (Level Formula)', () => {
    it('getVietnamDateString trả về đúng định dạng YYYY-MM-DD theo múi giờ Asia/Ho_Chi_Minh', () => {
      // 2026-11-24 18:00:00 UTC = 2026-11-25 01:00:00 UTC+7 (Ngày hôm sau tại VN)
      const dateInUtcEvening = new Date('2026-11-24T18:00:00.000Z');
      expect(getVietnamDateString(dateInUtcEvening)).toBe('2026-11-25');

      // 2026-11-24 16:59:59 UTC = 2026-11-24 23:59:59 UTC+7 (Vẫn trong ngày 24 tại VN)
      const dateInUtcBeforeMidnight = new Date('2026-11-24T16:59:59.000Z');
      expect(getVietnamDateString(dateInUtcBeforeMidnight)).toBe('2026-11-24');
    });

    it('getVietnamDayRangeUTC bao phủ chính xác 00:00:00 đến 23:59:59.999 giờ Việt Nam', () => {
      const fixedDate = new Date('2026-11-24T10:00:00.000Z');
      const { startOfDay, endOfDay } = getVietnamDayRangeUTC(fixedDate);

      // Start of day: 2026-11-24 00:00:00 +07:00 = 2026-11-23 17:00:00 UTC
      expect(startOfDay.toISOString()).toBe('2026-11-23T17:00:00.000Z');
      // End of day: 2026-11-24 23:59:59.999 +07:00 = 2026-11-24 16:59:59.999 UTC
      expect(endOfDay.toISOString()).toBe('2026-11-24T16:59:59.999Z');
    });

    it('calculateLevel tính toán chính xác theo công thức L = floor(sqrt(X)/10) + 1', () => {
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(99)).toBe(1);
      expect(calculateLevel(100)).toBe(2);
      expect(calculateLevel(399)).toBe(2);
      expect(calculateLevel(400)).toBe(3);
      expect(calculateLevel(899)).toBe(3);
      expect(calculateLevel(900)).toBe(4);
      expect(calculateLevel(1600)).toBe(5);
      expect(calculateLevel(-50)).toBe(1);
    });

    it('calculateRequiredXP và calculateNextLevelXP tính đúng điểm ngưỡng các cấp', () => {
      expect(calculateRequiredXP(1)).toBe(0);
      expect(calculateRequiredXP(2)).toBe(100);
      expect(calculateRequiredXP(3)).toBe(400);
      expect(calculateRequiredXP(4)).toBe(900);
      expect(calculateRequiredXP(5)).toBe(1600);

      expect(calculateNextLevelXP(1)).toBe(100);
      expect(calculateNextLevelXP(2)).toBe(400);
      expect(calculateNextLevelXP(3)).toBe(900);
      expect(calculateNextLevelXP(4)).toBe(1600);
    });
  });

  describe('3. getCurrentDayXP(userId, date) - Tổng hợp XP tích lũy trong ngày', () => {
    it('tính tổng XP từ các task completed và habit check-in logs trong ngày', async () => {
      const targetDate = new Date('2026-11-24T10:00:00.000Z');

      const mockCompletedTasks = [
        { xp_earned: 30, xp_reward: 30 },
        { xp_earned: 20, xp_reward: 20 }
      ];
      jest.spyOn(Task, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCompletedTasks)
      } as any);

      const mockHabits = [
        {
          logs: [
            { log_date: '2026-11-24', is_completed: true, xp_earned: 15 },
            { log_date: '2026-11-23', is_completed: true, xp_earned: 15 } // Ngày khác
          ]
        },
        {
          logs: [
            { log_date: '2026-11-24', is_completed: true, xp_earned: 15 }
          ]
        }
      ];
      jest.spyOn(Habit, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockHabits)
      } as any);

      const totalTodayXP = await gamificationService.getCurrentDayXP(userId, targetDate);
      // 30 (Task 1) + 20 (Task 2) + 15 (Habit 1) + 15 (Habit 2) = 80 XP
      expect(totalTodayXP).toBe(80);
    });

    it('trả về 0 khi không có task hoặc habit nào hoàn thành trong ngày', async () => {
      jest.spyOn(Task, 'find').mockReturnValue({ lean: jest.fn().mockResolvedValue([]) } as any);
      jest.spyOn(Habit, 'find').mockReturnValue({ lean: jest.fn().mockResolvedValue([]) } as any);

      const totalTodayXP = await gamificationService.getCurrentDayXP(userId);
      expect(totalTodayXP).toBe(0);
    });
  });

  describe('4. checkDailyXPCap(userId, xpToAdd) - Quy tắc chống gian lận Daily XP Cap = 200 XP', () => {
    it('cộng đủ XP khi tổng điểm trong ngày chưa chạm ngưỡng 200 XP', async () => {
      jest.spyOn(gamificationService, 'getCurrentDayXP').mockResolvedValue(100);

      const result = await gamificationService.checkDailyXPCap(userId, 30);
      expect(result.currentDayXP).toBe(100);
      expect(result.xp_earned).toBe(30);
      expect(result.is_cap_reached).toBe(false);
      expect(result.remaining_xp).toBe(70);
    });

    it('chạm đúng trần 200 XP: cộng đủ XP và đánh dấu is_cap_reached = true', async () => {
      jest.spyOn(gamificationService, 'getCurrentDayXP').mockResolvedValue(170);

      const result = await gamificationService.checkDailyXPCap(userId, 30);
      expect(result.currentDayXP).toBe(170);
      expect(result.xp_earned).toBe(30);
      expect(result.is_cap_reached).toBe(true);
      expect(result.remaining_xp).toBe(0);
    });

    it('vượt trần 200 XP: điều chỉnh số XP thực nhận = max(0, 200 - currentDayXP)', async () => {
      jest.spyOn(gamificationService, 'getCurrentDayXP').mockResolvedValue(190);

      // Thưởng 30 XP nhưng chỉ còn 10 XP là chạm trần
      const result = await gamificationService.checkDailyXPCap(userId, 30);
      expect(result.currentDayXP).toBe(190);
      expect(result.xp_earned).toBe(10); // 200 - 190 = 10
      expect(result.is_cap_reached).toBe(true);
      expect(result.remaining_xp).toBe(0);
    });

    it('đã đạt trần 200 XP: trả về xp_earned = 0 và is_cap_reached = true', async () => {
      jest.spyOn(gamificationService, 'getCurrentDayXP').mockResolvedValue(200);

      const result = await gamificationService.checkDailyXPCap(userId, 20);
      expect(result.currentDayXP).toBe(200);
      expect(result.xp_earned).toBe(0);
      expect(result.is_cap_reached).toBe(true);
      expect(result.remaining_xp).toBe(0);
    });

    it('nếu currentDayXP vượt quá 200: trả về xp_earned = 0 và is_cap_reached = true', async () => {
      jest.spyOn(gamificationService, 'getCurrentDayXP').mockResolvedValue(215);

      const result = await gamificationService.checkDailyXPCap(userId, 10);
      expect(result.currentDayXP).toBe(215);
      expect(result.xp_earned).toBe(0);
      expect(result.is_cap_reached).toBe(true);
      expect(result.remaining_xp).toBe(0);
    });

    it('xử lý an toàn khi xpToAdd là 0 hoặc số âm', async () => {
      jest.spyOn(gamificationService, 'getCurrentDayXP').mockResolvedValue(50);

      const result = await gamificationService.checkDailyXPCap(userId, -15);
      expect(result.xp_earned).toBe(0);
      expect(result.is_cap_reached).toBe(false);
      expect(result.remaining_xp).toBe(150);
    });
  });

  describe('5. revertTaskXP(userId, xpToDeduct) - Hoàn tác điểm thưởng khi chuyển task về TODO', () => {
    it('trừ đúng số XP tương ứng và lưu lại cơ sở dữ liệu', async () => {
      const mockUser: any = {
        _id: new mongoose.Types.ObjectId(userId),
        total_xp: 350,
        current_level: 2,
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        })
      };
      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

      const result = await gamificationService.revertTaskXP(userId, 30);
      expect(result.reverted_xp).toBe(30);
      expect(result.total_xp).toBe(320);
      expect(result.current_level).toBe(2);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('đảm bảo total_xp không bao giờ bị âm khi số điểm trừ lớn hơn tổng điểm hiện có', async () => {
      const mockUser: any = {
        _id: new mongoose.Types.ObjectId(userId),
        total_xp: 15,
        current_level: 1,
        save: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

      const result = await gamificationService.revertTaskXP(userId, 30);
      expect(result.total_xp).toBe(0);
      expect(result.current_level).toBe(1);
    });

    it('tự động giáng cấp (Level down) nếu total_xp rơi xuống dưới ngưỡng cấp bậc', async () => {
      // 105 XP = Cấp 2. Trừ 20 XP => 85 XP = Cấp 1
      const mockUser: any = {
        _id: new mongoose.Types.ObjectId(userId),
        total_xp: 105,
        current_level: 2,
        save: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

      const result = await gamificationService.revertTaskXP(userId, 20);
      expect(result.total_xp).toBe(85);
      expect(result.current_level).toBe(1);
    });

    it('ném lỗi 404 USER_NOT_FOUND khi không tìm thấy người dùng', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue(null);

      await expect(gamificationService.revertTaskXP(userId, 20)).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND'
      });
    });
  });

  describe('6. Tích hợp Gamification vào API PATCH /api/v1/tasks/:id/complete', () => {
    const taskId = new mongoose.Types.ObjectId().toString();

    it('hoàn thành task thành công: tính XP theo độ ưu tiên HIGH (+30 XP) và cập nhật level', async () => {
      const mockTask: any = {
        _id: taskId,
        user_id: userId,
        title: 'Nộp báo cáo đồ án',
        priority: 'HIGH',
        status: 'COMPLETED',
        completed_at: new Date(),
        xp_reward: 30,
        xp_earned: 0,
        save: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(Task, 'findOneAndUpdate').mockResolvedValue(mockTask);
      jest.spyOn(gamificationService, 'checkDailyXPCap').mockResolvedValue({
        currentDayXP: 50,
        xp_earned: 30,
        is_cap_reached: false,
        remaining_xp: 120
      });

      const mockUser: any = {
        _id: userId,
        total_xp: 70,
        current_level: 1,
        last_active_date: null,
        save: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

      const res = await request(app)
        .patch(`/api/v1/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Hoàn thành công việc! +30 XP');
      expect(res.body.data.xp_earned).toBe(30);
      expect(res.body.data.total_xp).toBe(100);
      expect(res.body.data.current_level).toBe(2);
      expect(res.body.data.level_up).toBe(true); // Nhảy từ cấp 1 -> 2
      expect(res.body.data.is_cap_reached).toBe(false);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('chặn cộng điểm khi hoàn thành task trong tình trạng đã chạm trần 200 XP', async () => {
      const mockTask: any = {
        _id: taskId,
        user_id: userId,
        title: 'Task sau khi chạm trần',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        completed_at: new Date(),
        xp_reward: 20,
        xp_earned: 0,
        save: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(Task, 'findOneAndUpdate').mockResolvedValue(mockTask);
      jest.spyOn(gamificationService, 'checkDailyXPCap').mockResolvedValue({
        currentDayXP: 200,
        xp_earned: 0,
        is_cap_reached: true,
        remaining_xp: 0
      });

      const mockUser: any = {
        _id: userId,
        total_xp: 200,
        current_level: 2,
        save: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

      const res = await request(app)
        .patch(`/api/v1/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.xp_earned).toBe(0);
      expect(res.body.data.is_cap_reached).toBe(true);
      expect(res.body.message).toContain('Đã đạt trần tối đa 200 XP');
    });

    it('gọi complete lần 2 trên task đã hoàn thành (Retry / Idempotent): không cộng thêm XP', async () => {
      jest.spyOn(Task, 'findOneAndUpdate').mockResolvedValue(null);
      const existingCompletedTask: any = {
        _id: taskId,
        user_id: userId,
        title: 'Task đã xong trước đó',
        status: 'COMPLETED',
        completed_at: new Date('2026-11-20'),
        xp_reward: 20
      };
      jest.spyOn(Task, 'findOne').mockResolvedValue(existingCompletedTask);

      const mockUser: any = { total_xp: 150, current_level: 2 };
      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

      const res = await request(app)
        .patch(`/api/v1/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.xp_earned).toBe(0);
      expect(res.body.data.completed_at).toBeDefined();
    });
  });

  describe('7. Tích hợp Revert XP vào API PUT /api/v1/tasks/:id', () => {
    const taskId = new mongoose.Types.ObjectId().toString();

    it('khi chuyển status từ COMPLETED về TODO: tự động gọi revertTaskXP', async () => {
      const existingTask: any = {
        _id: taskId,
        user_id: userId,
        title: 'Task đang hoàn thành',
        priority: 'HIGH',
        status: 'COMPLETED',
        xp_reward: 30,
        xp_earned: 30,
        completed_at: new Date(),
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        })
      };
      jest.spyOn(Task, 'findById').mockResolvedValue(existingTask);
      const revertSpy = jest.spyOn(gamificationService, 'revertTaskXP').mockResolvedValue({
        userId,
        reverted_xp: 30,
        total_xp: 70,
        current_level: 1
      });

      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'TODO' });

      expect(res.status).toBe(200);
      expect(revertSpy).toHaveBeenCalledWith(userId, 30);
      expect(existingTask.status).toBe('TODO');
      expect(existingTask.completed_at).toBeNull();
      expect(existingTask.xp_earned).toBe(0);
      expect(existingTask.save).toHaveBeenCalled();
    });
  });
});
