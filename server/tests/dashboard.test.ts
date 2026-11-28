import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { Task } from '../src/models/Task';
import { Habit } from '../src/models/Habit';
import { User } from '../src/models/User';
import { UserBadge } from '../src/models/UserBadge';
import { Badge } from '../src/models/Badge';
import { getVietnamDateString } from '../src/services/gamification.service';
import { getLast7VietnamDates } from '../src/services/dashboardService';

interface SyntheticTask {
  user_id: mongoose.Types.ObjectId;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  xp_reward: number;
  xp_earned: number;
  completed_at: Date | null;
}

interface SyntheticHabit {
  user_id: mongoose.Types.ObjectId;
  title: string;
  logs: Array<{ log_date: string; is_completed: boolean; xp_earned: number }>;
}

/**
 * Tạo tập dữ liệu benchmark 500 tasks cho User A + 50 tasks cho User B
 * và logs check-in thói quen trong 7 ngày gần nhất theo múi giờ Việt Nam (UTC+7).
 */
function generateBenchmarkDataset(
  userAId: mongoose.Types.ObjectId,
  userBId: mongoose.Types.ObjectId,
  referenceDate: Date
) {
  const dates = getLast7VietnamDates(referenceDate); // 7 ngày gần nhất UTC+7
  const tasks: SyntheticTask[] = [];
  const priorities: Array<'LOW' | 'MEDIUM' | 'HIGH'> = ['LOW', 'MEDIUM', 'HIGH'];
  const xpMap = { LOW: 10, MEDIUM: 20, HIGH: 30 };

  let userACompletedCount = 0;
  const expectedDailyTasks = new Map<string, { count: number; xp: number }>();
  dates.forEach((d) => expectedDailyTasks.set(d, { count: 0, xp: 0 }));

  // 500 tasks cho User A: 317 COMPLETED (phân bổ trong 7 ngày + quá khứ), 183 TODO/IN_PROGRESS
  for (let i = 0; i < 500; i++) {
    const priority = priorities[i % 3];
    const xp = xpMap[priority];
    const isCompleted = i < 317;

    let completedAt: Date | null = null;
    if (isCompleted) {
      userACompletedCount++;
      if (i < 140) {
        // 140 tasks hoàn thành rải đều trong 7 ngày gần nhất (20 tasks/ngày)
        const dayIndex = i % 7;
        const dateStr = dates[dayIndex];
        // Xen kẽ giờ sáng và khuya UTC+7 để kiểm thử ranh giới ngày UTC vs UTC+7
        const hourOffset = i % 2 === 0 ? '00:30:00.000+07:00' : '23:15:00.000+07:00';
        completedAt = new Date(`${dateStr}T${hourOffset}`);
        const bucket = expectedDailyTasks.get(dateStr)!;
        bucket.count += 1;
        bucket.xp += xp;
      } else {
        // 177 tasks hoàn thành trước cửa sổ 7 ngày (15 ngày trước)
        completedAt = new Date(referenceDate.getTime() - 15 * 24 * 60 * 60 * 1000);
      }
    }

    tasks.push({
      user_id: userAId,
      title: `Benchmark Task #${i + 1}`,
      priority,
      status: isCompleted ? 'COMPLETED' : i % 2 === 0 ? 'TODO' : 'IN_PROGRESS',
      xp_reward: xp,
      xp_earned: isCompleted ? xp : 0,
      completed_at: completedAt
    });
  }

  // 50 tasks hoàn thành thuộc về User B (dùng để kiểm chứng Data Isolation)
  for (let j = 0; j < 50; j++) {
    tasks.push({
      user_id: userBId,
      title: `Foreign Task #${j + 1}`,
      priority: 'HIGH',
      status: 'COMPLETED',
      xp_reward: 30,
      xp_earned: 30,
      completed_at: new Date(`${dates[6]}T10:00:00.000+07:00`)
    });
  }

  // 4 thói quen cho User A (check-in đầy đủ trong 7 ngày) + 1 thói quen cho User B
  const habits: SyntheticHabit[] = [
    {
      user_id: userAId,
      title: 'Đọc sách 30 phút',
      logs: dates.map((d) => ({ log_date: d, is_completed: true, xp_earned: 15 }))
    },
    {
      user_id: userAId,
      title: 'Uống đủ 2L nước',
      logs: dates.slice(0, 5).map((d) => ({ log_date: d, is_completed: true, xp_earned: 15 }))
    },
    {
      user_id: userAId,
      title: 'Tập thể dục',
      logs: [
        { log_date: dates[6], is_completed: true, xp_earned: 15 },
        { log_date: dates[5], is_completed: false, xp_earned: 0 } // log chưa hoàn thành không được cộng
      ]
    },
    {
      user_id: userBId,
      title: 'Foreign Habit B',
      logs: dates.map((d) => ({ log_date: d, is_completed: true, xp_earned: 15 }))
    }
  ];

  const expectedDailyHabits = new Map<string, { count: number; xp: number }>();
  dates.forEach((d) => expectedDailyHabits.set(d, { count: 0, xp: 0 }));
  for (const h of habits.filter((item) => item.user_id.equals(userAId))) {
    for (const log of h.logs) {
      if (log.is_completed && expectedDailyHabits.has(log.log_date)) {
        const bucket = expectedDailyHabits.get(log.log_date)!;
        bucket.count += 1;
        bucket.xp += log.xp_earned;
      }
    }
  }

  return {
    dates,
    tasks,
    habits,
    userACompletedCount,
    expectedDailyTasks,
    expectedDailyHabits
  };
}

/**
 * Giả lập thực thi MongoDB Aggregation Pipeline trên tập dữ liệu 500+ records trong bộ nhớ
 * để benchmark đầy đủ luồng Express -> JWT -> DashboardController -> DashboardService.
 */
function mockAggregationsOnDataset(tasks: SyntheticTask[], habits: SyntheticHabit[]) {
  jest.spyOn(Task, 'aggregate').mockImplementation((async (pipeline: any[]) => {
    const match = pipeline[0]?.$match ?? {};
    const filtered = tasks.filter((t) => {
      if (match.user_id && !t.user_id.equals(match.user_id)) return false;
      if (match.status && t.status !== match.status) return false;
      if (match.completed_at) {
        if (!t.completed_at) return false;
        const ts = t.completed_at.getTime();
        if (match.completed_at.$gte && ts < match.completed_at.$gte.getTime()) return false;
        if (match.completed_at.$lte && ts > match.completed_at.$lte.getTime()) return false;
      }
      return true;
    });

    const group = pipeline[1]?.$group;
    if (group && group._id === null) {
      if (filtered.length === 0) return [];
      return [
        {
          _id: null,
          total_tasks: filtered.length,
          completed_tasks: filtered.filter((t) => t.status === 'COMPLETED').length
        }
      ];
    }

    // Pipeline 1: group by Vietnam YYYY-MM-DD
    const grouped = new Map<string, { _id: string; tasks_completed: number; xp_earned: number }>();
    for (const t of filtered) {
      const dateStr = getVietnamDateString(t.completed_at!);
      const existing = grouped.get(dateStr) ?? { _id: dateStr, tasks_completed: 0, xp_earned: 0 };
      existing.tasks_completed += 1;
      existing.xp_earned += t.xp_earned ?? 0;
      grouped.set(dateStr, existing);
    }
    return Array.from(grouped.values());
  }) as any);

  jest.spyOn(Habit, 'aggregate').mockImplementation((async (pipeline: any[]) => {
    const ownerMatch = pipeline[0]?.$match ?? {};
    const logMatch = pipeline[2]?.$match ?? {};
    const minDate = logMatch['logs.log_date']?.$gte;
    const maxDate = logMatch['logs.log_date']?.$lte;

    const grouped = new Map<string, { _id: string; habits_completed: number; xp_earned: number }>();
    for (const h of habits) {
      if (ownerMatch.user_id && !h.user_id.equals(ownerMatch.user_id)) continue;
      for (const log of h.logs) {
        if (logMatch['logs.is_completed'] === true && !log.is_completed) continue;
        if (minDate && log.log_date < minDate) continue;
        if (maxDate && log.log_date > maxDate) continue;
        const existing = grouped.get(log.log_date) ?? {
          _id: log.log_date,
          habits_completed: 0,
          xp_earned: 0
        };
        existing.habits_completed += 1;
        existing.xp_earned += log.xp_earned ?? 0;
        grouped.set(log.log_date, existing);
      }
    }
    return Array.from(grouped.values());
  }) as any);
}

describe('[TECH-S4-06] Dashboard Performance Benchmark (< 300ms) & Accuracy Suite', () => {
  const JWT_SECRET = 'test-secret-sprint4-dashboard-benchmark';
  const userAId = new mongoose.Types.ObjectId();
  const userBId = new mongoose.Types.ObjectId();
  const emptyUserId = new mongoose.Types.ObjectId();

  const tokenA = jwt.sign({ id: userAId.toString(), email: 'userA@ptit.edu.vn' }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h'
  });
  const tokenB = jwt.sign({ id: userBId.toString(), email: 'userB@ptit.edu.vn' }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h'
  });
  const tokenEmpty = jwt.sign({ id: emptyUserId.toString(), email: 'empty@ptit.edu.vn' }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h'
  });

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('1. Benchmark GET /api/v1/dashboard/summary với 500 tasks + logs 7 ngày đạt thời gian phản hồi < 300ms', async () => {
    const now = new Date();
    const dataset = generateBenchmarkDataset(userAId, userBId, now);
    mockAggregationsOnDataset(dataset.tasks, dataset.habits);

    jest.spyOn(UserBadge, 'countDocuments').mockResolvedValue(4);
    jest.spyOn(Badge, 'countDocuments').mockResolvedValue(10);
    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue({
        current_level: 4,
        total_xp: 1120,
        current_streak: 7
      })
    } as any);

    const start = performance.now();
    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${tokenA}`);
    const elapsedMs = performance.now() - start;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(elapsedMs).toBeLessThan(300);

    // Kiểm tra độ chính xác toàn bộ chỉ số tổng hợp trên 500 tasks
    expect(res.body.data.stats).toEqual({
      total_tasks: 500,
      completed_tasks: 317,
      completion_rate: 63.4,
      current_level: 4,
      total_xp: 1120,
      current_streak: 7,
      unlocked_badges_count: 4,
      total_badges_count: 10
    });

    // Kiểm tra chính xác 7 ngày weekly_activity (UTC+7) gồm Tasks + Habits + XP
    expect(res.body.data.weekly_activity).toHaveLength(7);
    for (const dayItem of res.body.data.weekly_activity) {
      const expectedTask = dataset.expectedDailyTasks.get(dayItem.date)!;
      const expectedHabit = dataset.expectedDailyHabits.get(dayItem.date)!;
      expect(dayItem.tasks_completed).toBe(expectedTask.count);
      expect(dayItem.habits_completed).toBe(expectedHabit.count);
      expect(dayItem.xp_earned).toBe(expectedTask.xp + expectedHabit.xp);
    }
  });

  it('2. Xử lý an toàn trường hợp total_tasks = 0 (completion_rate = 0, không bị NaN)', async () => {
    mockAggregationsOnDataset([], []);
    jest.spyOn(UserBadge, 'countDocuments').mockResolvedValue(0);
    jest.spyOn(Badge, 'countDocuments').mockResolvedValue(10);
    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue({
        current_level: 1,
        total_xp: 0,
        current_streak: 0
      })
    } as any);

    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${tokenEmpty}`);

    expect(res.status).toBe(200);
    expect(res.body.data.stats.total_tasks).toBe(0);
    expect(res.body.data.stats.completed_tasks).toBe(0);
    expect(Number.isNaN(res.body.data.stats.completion_rate)).toBe(false);
    expect(res.body.data.stats.completion_rate).toBe(0);
    expect(res.body.data.weekly_activity).toHaveLength(7);
    expect(
      res.body.data.weekly_activity.every(
        (d: any) => d.tasks_completed === 0 && d.habits_completed === 0 && d.xp_earned === 0
      )
    ).toBe(true);
  });

  it('3. Đảm bảo Data Isolation: chỉ thống kê đúng dữ liệu của user đang đăng nhập', async () => {
    const now = new Date();
    const dataset = generateBenchmarkDataset(userAId, userBId, now);
    mockAggregationsOnDataset(dataset.tasks, dataset.habits);

    jest.spyOn(UserBadge, 'countDocuments').mockImplementation((async (query: any) => {
      return query.user_id.equals(userBId) ? 2 : 4;
    }) as any);
    jest.spyOn(Badge, 'countDocuments').mockResolvedValue(10);
    jest.spyOn(User, 'findById').mockImplementation(((id: any) => ({
      select: jest.fn().mockResolvedValue(
        id.equals(userBId)
          ? { current_level: 2, total_xp: 250, current_streak: 3 }
          : { current_level: 4, total_xp: 1120, current_streak: 7 }
      )
    })) as any);

    const resB = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(resB.status).toBe(200);
    // User B chỉ có đúng 50 tasks của mình (không bị lẫn 500 tasks của User A)
    expect(resB.body.data.stats).toMatchObject({
      total_tasks: 50,
      completed_tasks: 50,
      completion_rate: 100,
      unlocked_badges_count: 2
    });
    // Ngày hôm nay của User B chỉ có 50 tasks * 30 XP + 1 habit * 15 XP = 1515 XP
    const todayItemB = resB.body.data.weekly_activity[6];
    expect(todayItemB.tasks_completed).toBe(50);
    expect(todayItemB.habits_completed).toBe(1);
    expect(todayItemB.xp_earned).toBe(1515);
  });

  it('4. Chặn truy cập trái phép (401 UNAUTHORIZED) khi thiếu JWT', async () => {
    const res = await request(app).get('/api/v1/dashboard/summary');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// =========================================================================
// 5. Real MongoDB 500-Task Benchmark & Integration Suite (CI / TEST_MONGODB_URI)
// =========================================================================
const mongoUri = process.env.TEST_MONGODB_URI;
const describeWithMongo = mongoUri ? describe : describe.skip;

describeWithMongo('[TECH-S4-06] Real MongoDB 500-Task Benchmark (< 300ms) & Isolation', () => {
  const api = request(app);

  beforeAll(async () => {
    process.env.JWT_SECRET = randomUUID();
    await mongoose.connect(mongoUri!, {
      dbName: 'questline_s4_benchmark_' + randomUUID().replace(/-/g, ''),
      serverSelectionTimeoutMS: 5000
    });
    await Promise.all([
      User.init(),
      Task.init(),
      Habit.init(),
      Badge.init(),
      UserBadge.init()
    ]);
  }, 20000);

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    } finally {
      await mongoose.disconnect();
    }
  });

  it('benchmarks GET /api/v1/dashboard/summary under 300ms with 500 real tasks, verifies zero-task safety & isolation', async () => {
    const registerUser = async (email: string) => {
      const res = await api
        .post('/api/v1/auth/register')
        .send({ email, password: 'Password123', full_name: 'Bench QA' })
        .expect(201);
      return res.body.data as { token: string; user: { _id: string } };
    };

    const userA = await registerUser('bench.a@example.test');
    const userB = await registerUser('bench.b@example.test');
    const userEmpty = await registerUser('bench.empty@example.test');

    const userAObjId = new mongoose.Types.ObjectId(userA.user._id);
    const userBObjId = new mongoose.Types.ObjectId(userB.user._id);
    const dataset = generateBenchmarkDataset(userAObjId, userBObjId, new Date());

    await Task.insertMany(dataset.tasks);
    await Habit.insertMany(dataset.habits);

    const start = performance.now();
    const resA = await api
      .get('/api/v1/dashboard/summary')
      .auth(userA.token, { type: 'bearer' })
      .expect(200);
    const elapsedMs = performance.now() - start;

    expect(elapsedMs).toBeLessThan(300);
    expect(resA.body.data.stats).toMatchObject({
      total_tasks: 500,
      completed_tasks: 317,
      completion_rate: 63.4
    });
    expect(resA.body.data.weekly_activity).toHaveLength(7);

    // Data Isolation cho User B
    const resB = await api
      .get('/api/v1/dashboard/summary')
      .auth(userB.token, { type: 'bearer' })
      .expect(200);
    expect(resB.body.data.stats).toMatchObject({
      total_tasks: 50,
      completed_tasks: 50,
      completion_rate: 100
    });

    // Trường hợp 0 task (không bị NaN)
    const resEmpty = await api
      .get('/api/v1/dashboard/summary')
      .auth(userEmpty.token, { type: 'bearer' })
      .expect(200);
    expect(resEmpty.body.data.stats).toMatchObject({
      total_tasks: 0,
      completed_tasks: 0,
      completion_rate: 0
    });
  });
});
