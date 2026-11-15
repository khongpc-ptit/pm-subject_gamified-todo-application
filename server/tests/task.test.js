const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../src/app');
const { Task } = require('../src/models/Task');

const JWT_SECRET = 'supersecretkey_gamified_todo_sprint1';

// Helper to generate a valid test JWT
const generateTestToken = (userId, email = 'testuser@example.com') => {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '1h' });
};

describe('GET /api/v1/tasks - [US-S1-02 / TECH-S1-03] View Task List', () => {
  const userA_Id = new mongoose.Types.ObjectId().toString();
  const userB_Id = new mongoose.Types.ObjectId().toString();
  let tokenUserA;
  let tokenUserB;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    tokenUserA = generateTestToken(userA_Id, 'usera@example.com');
    tokenUserB = generateTestToken(userB_Id, 'userb@example.com');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Xác thực bảo mật (Authentication & Authorization)', () => {
    it('1. Trả về 401 UNAUTHORIZED khi không có Header Authorization', async () => {
      const res = await request(app).get('/api/v1/tasks');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.timestamp).toBeDefined();
    });

    it('2. Trả về 401 UNAUTHORIZED khi token sai hoặc không đúng định dạng', async () => {
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', 'Bearer invalid_token_12345');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Truy xuất danh sách công việc (View Task List)', () => {
    it('3. Trả về danh sách rỗng (Empty State) khi người dùng chưa có nhiệm vụ nào', async () => {
      // Mock Task.find trả về mảng rỗng
      jest.spyOn(Task, 'find').mockImplementation((filter) => {
        expect(filter.user_id).toBe(userA_Id);
        return {
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
          })
        };
      });

      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Lấy danh sách nhiệm vụ thành công');
      expect(res.body.data.tasks).toEqual([]);
      expect(res.body.data.total).toBe(0);
      expect(res.body.timestamp).toBeDefined();
    });

    it('4. Trả về đúng danh sách nhiệm vụ của người dùng với đầy đủ trường dữ liệu', async () => {
      const mockTasks = [
        {
          _id: new mongoose.Types.ObjectId().toString(),
          user_id: userA_Id,
          title: 'Nộp báo cáo kiến trúc hệ thống',
          description: 'Kiểm tra lại Swagger trước khi nộp',
          priority: 'HIGH',
          status: 'TODO',
          due_date: '2026-11-10T17:00:00.000Z',
          xp_reward: 30,
          completed_at: null,
          created_at: '2026-11-05T15:00:00.000Z'
        },
        {
          _id: new mongoose.Types.ObjectId().toString(),
          user_id: userA_Id,
          title: 'Học React hooks',
          description: '',
          priority: 'MEDIUM',
          status: 'COMPLETED',
          due_date: null,
          xp_reward: 20,
          completed_at: '2026-11-06T10:00:00.000Z',
          created_at: '2026-11-04T12:00:00.000Z'
        }
      ];

      jest.spyOn(Task, 'find').mockImplementation((filter) => {
        expect(filter.user_id).toBe(userA_Id);
        return {
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockTasks)
          })
        };
      });

      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tasks.length).toBe(2);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.tasks[0].title).toBe('Nộp báo cáo kiến trúc hệ thống');
      expect(res.body.data.tasks[0].priority).toBe('HIGH');
      expect(res.body.data.tasks[0].xp_reward).toBe(30);
    });

    it('5. Đảm bảo nguyên tắc cô lập dữ liệu (Ownership Isolation): User chỉ xem được task của chính mình', async () => {
      const mockUserBTasks = [
        {
          _id: new mongoose.Types.ObjectId().toString(),
          user_id: userB_Id,
          title: 'Công việc riêng của User B',
          priority: 'LOW',
          status: 'TODO',
          xp_reward: 10,
          created_at: new Date().toISOString()
        }
      ];

      // Khi User B gọi, filter bắt buộc phải là user_id == userB_Id
      const findSpy = jest.spyOn(Task, 'find').mockImplementation((filter) => {
        if (filter.user_id === userB_Id) {
          return {
            sort: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockUserBTasks)
            })
          };
        }
        return {
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
          })
        };
      });

      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(200);
      expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({ user_id: userB_Id }));
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].title).toBe('Công việc riêng của User B');
    });
  });

  describe('Bộ lọc truy vấn (Query Filtering)', () => {
    it('6. Lọc chính xác theo query param status (?status=TODO)', async () => {
      const findSpy = jest.spyOn(Task, 'find').mockImplementation((filter) => {
        expect(filter.status).toBe('TODO');
        return {
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: '1',
                user_id: userA_Id,
                title: 'Task TODO',
                status: 'TODO',
                priority: 'MEDIUM'
              }
            ])
          })
        };
      });

      const res = await request(app)
        .get('/api/v1/tasks?status=TODO')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: userA_Id, status: 'TODO' })
      );
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].status).toBe('TODO');
    });

    it('7. Trả về 400 INVALID_STATUS khi truyền giá trị status không hợp lệ', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?status=UNKNOWN_STATUS')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_STATUS');
    });

    it('8. Lọc chính xác theo query param priority (?priority=HIGH)', async () => {
      const findSpy = jest.spyOn(Task, 'find').mockImplementation((filter) => {
        expect(filter.priority).toBe('HIGH');
        return {
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: '2',
                user_id: userA_Id,
                title: 'Task High Priority',
                status: 'TODO',
                priority: 'HIGH'
              }
            ])
          })
        };
      });

      const res = await request(app)
        .get('/api/v1/tasks?priority=HIGH')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: userA_Id, priority: 'HIGH' })
      );
      expect(res.body.data.tasks[0].priority).toBe('HIGH');
    });

    it('9. Trả về 400 INVALID_PRIORITY khi truyền giá trị priority không hợp lệ', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?priority=SUPER_HIGH')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_PRIORITY');
    });

    it('10. Sắp xếp mặc định sort({ created_at: -1 }) theo thứ tự mới nhất trước', async () => {
      let sortArgument = null;
      jest.spyOn(Task, 'find').mockImplementation(() => {
        return {
          sort: jest.fn().mockImplementation((arg) => {
            sortArgument = arg;
            return {
              lean: jest.fn().mockResolvedValue([])
            };
          })
        };
      });

      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(sortArgument).toEqual({ created_at: -1 });
    });
  });
});
