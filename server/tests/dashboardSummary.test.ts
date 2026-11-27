import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { dashboardService } from '../src/services/dashboardService';
import { DashboardSummaryData } from '../src/types/dashboard.types';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-dashboard-summary';

describe('[TECH-S4-02] GET /api/v1/dashboard/summary Integration Tests', () => {
  const userId = new mongoose.Types.ObjectId().toString();
  const validToken = jwt.sign({ id: userId, email: 'cuongkp@ptit.edu.vn' }, JWT_SECRET);

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Authentication & Security', () => {
    it('returns 401 UNAUTHORIZED when Authorization header is missing', async () => {
      const res = await request(app).get('/api/v1/dashboard/summary');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 UNAUTHORIZED when JWT token is invalid', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/summary')
        .set('Authorization', 'Bearer invalid-jwt-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Successful Response & JSON Envelope Pattern', () => {
    const mockSummary: DashboardSummaryData = {
      stats: {
        total_tasks: 20,
        completed_tasks: 15,
        completion_rate: 75,
        current_level: 3,
        total_xp: 450,
        current_streak: 5,
        unlocked_badges_count: 4,
        total_badges_count: 10
      },
      weekly_activity: [
        { date: '2026-11-21', tasks_completed: 0, habits_completed: 1, xp_earned: 15 },
        { date: '2026-11-22', tasks_completed: 2, habits_completed: 1, xp_earned: 55 },
        { date: '2026-11-23', tasks_completed: 3, habits_completed: 2, xp_earned: 90 },
        { date: '2026-11-24', tasks_completed: 1, habits_completed: 1, xp_earned: 35 },
        { date: '2026-11-25', tasks_completed: 4, habits_completed: 2, xp_earned: 110 },
        { date: '2026-11-26', tasks_completed: 2, habits_completed: 2, xp_earned: 70 },
        { date: '2026-11-27', tasks_completed: 3, habits_completed: 1, xp_earned: 85 }
      ]
    };

    it('returns 200 OK with stats, 7-day weekly_activity, and JSON Envelope under 300ms', async () => {
      const spy = jest
        .spyOn(dashboardService, 'getDashboardSummary')
        .mockResolvedValueOnce(mockSummary);

      const startTime = performance.now();
      const res = await request(app)
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${validToken}`);
      const elapsedMs = performance.now() - startTime;

      expect(res.status).toBe(200);
      expect(spy).toHaveBeenCalledWith(userId);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockSummary);
      expect(res.body.message).toBe('Lấy dữ liệu tổng quan Dashboard thành công');
      expect(typeof res.body.timestamp).toBe('string');
      expect(elapsedMs).toBeLessThan(300);
    });
  });

  describe('3. Error Handling', () => {
    it('returns 400 INVALID_USER_ID when service rejects userId format', async () => {
      jest
        .spyOn(dashboardService, 'getDashboardSummary')
        .mockRejectedValueOnce(new Error('INVALID_USER_ID'));

      const res = await request(app)
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_USER_ID');
    });

    it('delegates unexpected service errors to errorHandler (500)', async () => {
      jest
        .spyOn(dashboardService, 'getDashboardSummary')
        .mockRejectedValueOnce(new Error('Database timeout'));

      const res = await request(app)
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
