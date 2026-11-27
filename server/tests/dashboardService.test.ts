import mongoose from 'mongoose';
import { Task } from '../src/models/Task';
import { Habit } from '../src/models/Habit';
import { User } from '../src/models/User';
import { UserBadge } from '../src/models/UserBadge';
import { Badge } from '../src/models/Badge';
import {
  getLast7VietnamDates,
  getWeeklyTaskStats,
  getWeeklyHabitStats,
  getTaskCompletionStats,
  mergeWeeklyActivity,
  getDashboardSummary
} from '../src/services/dashboardService';

describe('[TECH-S4-01] Dashboard Aggregation Pipelines & Analytics Service', () => {
  const validUserId = new mongoose.Types.ObjectId().toString();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Database Indexes for Optimal Query Performance (< 50ms)', () => {
    it('Task schema has compound index { user_id: 1, status: 1, completed_at: -1 }', () => {
      const indexes = Task.schema.indexes();
      const hasDashboardIndex = indexes.some(([fields]) => {
        return (
          fields.user_id === 1 &&
          fields.status === 1 &&
          fields.completed_at === -1
        );
      });
      expect(hasDashboardIndex).toBe(true);
    });

    it('Habit schema has compound index { user_id: 1, "logs.log_date": 1 }', () => {
      const indexes = Habit.schema.indexes();
      const hasHabitLogIndex = indexes.some(([fields]) => {
        return fields.user_id === 1 && fields['logs.log_date'] === 1;
      });
      expect(hasHabitLogIndex).toBe(true);
    });
  });

  describe('2. getLast7VietnamDates (UTC+7 Window)', () => {
    it('returns 7 chronological dates in Vietnam timezone across UTC midnight boundary', () => {
      // 2026-11-26 20:00:00 UTC = 2026-11-27 03:00:00 UTC+7
      const refDate = new Date('2026-11-26T20:00:00.000Z');
      const dates = getLast7VietnamDates(refDate);

      expect(dates).toEqual([
        '2026-11-21',
        '2026-11-22',
        '2026-11-23',
        '2026-11-24',
        '2026-11-25',
        '2026-11-26',
        '2026-11-27'
      ]);
    });

    it('handles month boundary transitions accurately', () => {
      // 2026-12-02 12:00:00 UTC+7
      const refDate = new Date('2026-12-02T05:00:00.000Z');
      const dates = getLast7VietnamDates(refDate);

      expect(dates).toEqual([
        '2026-11-26',
        '2026-11-27',
        '2026-11-28',
        '2026-11-29',
        '2026-11-30',
        '2026-12-01',
        '2026-12-02'
      ]);
    });
  });

  describe('3. MongoDB Aggregation Pipelines Structure', () => {
    it('Pipeline 1 (getWeeklyTaskStats) groups completed tasks using +07:00 timezone', async () => {
      const userObjId = new mongoose.Types.ObjectId(validUserId);
      const start = new Date('2026-11-21T00:00:00.000+07:00');
      const end = new Date('2026-11-27T23:59:59.999+07:00');

      const aggregateSpy = jest.spyOn(Task, 'aggregate').mockResolvedValue([
        { _id: '2026-11-27', tasks_completed: 3, xp_earned: 70 }
      ]);

      const result = await getWeeklyTaskStats(userObjId, start, end);

      expect(aggregateSpy).toHaveBeenCalledTimes(1);
      const pipeline = aggregateSpy.mock.calls[0][0] as any[];
      expect(pipeline[0].$match).toEqual({
        user_id: userObjId,
        status: 'COMPLETED',
        completed_at: { $gte: start, $lte: end }
      });
      expect(pipeline[1].$group._id.$dateToString).toEqual({
        format: '%Y-%m-%d',
        date: '$completed_at',
        timezone: '+07:00'
      });
      expect(result).toEqual([{ _id: '2026-11-27', tasks_completed: 3, xp_earned: 70 }]);
    });

    it('Pipeline 2 (getWeeklyHabitStats) unwinds logs and filters completed logs in 7-day range', async () => {
      const userObjId = new mongoose.Types.ObjectId(validUserId);
      const aggregateSpy = jest.spyOn(Habit, 'aggregate').mockResolvedValue([
        { _id: '2026-11-27', habits_completed: 2, xp_earned: 30 }
      ]);

      const result = await getWeeklyHabitStats(userObjId, '2026-11-21', '2026-11-27');

      expect(aggregateSpy).toHaveBeenCalledTimes(1);
      const pipeline = aggregateSpy.mock.calls[0][0] as any[];
      expect(pipeline[0].$match).toEqual({ user_id: userObjId });
      expect(pipeline[1]).toEqual({ $unwind: '$logs' });
      expect(pipeline[2].$match).toEqual({
        'logs.is_completed': true,
        'logs.log_date': { $gte: '2026-11-21', $lte: '2026-11-27' }
      });
      expect(result).toEqual([{ _id: '2026-11-27', habits_completed: 2, xp_earned: 30 }]);
    });

    it('Pipeline 3 (getTaskCompletionStats) computes accurate completion rate and handles 0 tasks', async () => {
      const userObjId = new mongoose.Types.ObjectId(validUserId);

      jest.spyOn(Task, 'aggregate').mockResolvedValueOnce([
        { _id: null, total_tasks: 3, completed_tasks: 2 }
      ]);
      const stats1 = await getTaskCompletionStats(userObjId);
      expect(stats1).toEqual({
        total_tasks: 3,
        completed_tasks: 2,
        completion_rate: 66.67
      });

      jest.spyOn(Task, 'aggregate').mockResolvedValueOnce([]);
      const statsEmpty = await getTaskCompletionStats(userObjId);
      expect(statsEmpty).toEqual({
        total_tasks: 0,
        completed_tasks: 0,
        completion_rate: 0
      });
    });
  });

  describe('4. mergeWeeklyActivity & getDashboardSummary', () => {
    it('merges tasks, habits, and XP cleanly and fills missing days with 0', () => {
      const dates = ['2026-11-25', '2026-11-26', '2026-11-27'];
      const taskRows = [
        { _id: '2026-11-25', tasks_completed: 2, xp_earned: 50 },
        { _id: '2026-11-27', tasks_completed: 1, xp_earned: 30 }
      ];
      const habitRows = [
        { _id: '2026-11-25', habits_completed: 1, xp_earned: 15 }
      ];

      const merged = mergeWeeklyActivity(dates, taskRows, habitRows);

      expect(merged).toEqual([
        { date: '2026-11-25', tasks_completed: 2, habits_completed: 1, xp_earned: 65 },
        { date: '2026-11-26', tasks_completed: 0, habits_completed: 0, xp_earned: 0 },
        { date: '2026-11-27', tasks_completed: 1, habits_completed: 0, xp_earned: 30 }
      ]);
    });

    it('throws INVALID_USER_ID if userId is malformed', async () => {
      await expect(getDashboardSummary('not-an-object-id')).rejects.toThrow('INVALID_USER_ID');
    });

    it('aggregates full dashboard summary concurrently', async () => {
      const refDate = new Date('2026-11-27T05:00:00.000Z');

      jest
        .spyOn(Task, 'aggregate')
        // Call 1: getWeeklyTaskStats
        .mockResolvedValueOnce([{ _id: '2026-11-27', tasks_completed: 4, xp_earned: 100 }])
        // Call 2: getTaskCompletionStats
        .mockResolvedValueOnce([{ _id: null, total_tasks: 10, completed_tasks: 8 }]);

      jest
        .spyOn(Habit, 'aggregate')
        .mockResolvedValueOnce([{ _id: '2026-11-27', habits_completed: 2, xp_earned: 30 }]);

      jest.spyOn(UserBadge, 'countDocuments').mockResolvedValueOnce(4);
      jest.spyOn(Badge, 'countDocuments').mockResolvedValueOnce(10);
      jest.spyOn(User, 'findById').mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          current_level: 3,
          total_xp: 450,
          current_streak: 5
        })
      } as any);

      const summary = await getDashboardSummary(validUserId, refDate);

      expect(summary.stats).toEqual({
        total_tasks: 10,
        completed_tasks: 8,
        completion_rate: 80,
        current_level: 3,
        total_xp: 450,
        current_streak: 5,
        unlocked_badges_count: 4,
        total_badges_count: 10
      });
      expect(summary.weekly_activity).toHaveLength(7);
      expect(summary.weekly_activity[6]).toEqual({
        date: '2026-11-27',
        tasks_completed: 4,
        habits_completed: 2,
        xp_earned: 130
      });
      expect(summary.weekly_activity[0]).toEqual({
        date: '2026-11-21',
        tasks_completed: 0,
        habits_completed: 0,
        xp_earned: 0
      });
    });
  });
});
