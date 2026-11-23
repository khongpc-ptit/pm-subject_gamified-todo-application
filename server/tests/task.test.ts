import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { app } from '../src/app';
import { Task } from '../src/models/Task';

const JWT_SECRET = 'supersecretkey_gamified_todo_sprint1';

// Helper to generate a valid test JWT
const generateTestToken = (userId: string, email: string = 'testuser@example.com'): string => {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '1h' });
};

describe('GET /api/v1/tasks - [US-S1-02 / TECH-S1-03] View Task List', () => {
  const userA_Id = new mongoose.Types.ObjectId().toString();
  const userB_Id = new mongoose.Types.ObjectId().toString();
  let tokenUserA: string;
  let tokenUserB: string;

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
      jest.spyOn(Task, 'find').mockImplementation(((filter: any) => {
        expect(filter.user_id).toBe(userA_Id);
        return {
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
          })
        } as any;
      }) as any);

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

      jest.spyOn(Task, 'find').mockImplementation(((filter: any) => {
        expect(filter.user_id).toBe(userA_Id);
        return {
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockTasks)
          })
        } as any;
      }) as any);

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

      const findSpy = jest.spyOn(Task, 'find').mockImplementation(((filter: any) => {
        if (filter.user_id === userB_Id) {
          return {
            sort: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockUserBTasks)
            })
          } as any;
        }
        return {
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
          })
        } as any;
      }) as any);

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
      const findSpy = jest.spyOn(Task, 'find').mockImplementation(((filter: any) => {
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
        } as any;
      }) as any);

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
      const findSpy = jest.spyOn(Task, 'find').mockImplementation(((filter: any) => {
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
        } as any;
      }) as any);

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
      let sortArgument: any = null;
      jest.spyOn(Task, 'find').mockImplementation((() => {
        return {
          sort: jest.fn().mockImplementation((arg: any) => {
            sortArgument = arg;
            return {
              lean: jest.fn().mockResolvedValue([])
            };
          })
        } as any;
      }) as any);

      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(sortArgument).toEqual({ created_at: -1 });
    });
  });
});

describe('PUT /api/v1/tasks/:id - [US-S1-03 / TECH-S1-04] Update Task', () => {
  const userA_Id = new mongoose.Types.ObjectId().toString();
  const userB_Id = new mongoose.Types.ObjectId().toString();
  let tokenUserA: string;
  let tokenUserB: string;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    tokenUserA = generateTestToken(userA_Id, 'usera@example.com');
    tokenUserB = generateTestToken(userB_Id, 'userb@example.com');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Xác thực bảo mật (Authentication)', () => {
    it('1. Trả về 401 UNAUTHORIZED khi không có Header Authorization', async () => {
      const validId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/api/v1/tasks/${validId}`)
        .send({ title: 'Task cần cập nhật' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('2. Trả về 401 UNAUTHORIZED khi token không hợp lệ', async () => {
      const validId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .put(`/api/v1/tasks/${validId}`)
        .set('Authorization', 'Bearer invalid_token')
        .send({ title: 'Task cần cập nhật' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Kiểm tra định dạng ID & Quyền sở hữu (Validation & Authorization)', () => {
    it('3. Trả về 400 INVALID_ID khi :id không đúng 24 hex ký tự MongoDB ObjectId', async () => {
      const res = await request(app)
        .put('/api/v1/tasks/invalid-id-xyz-123')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ title: 'Tiêu đề mới' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_ID');
      expect(res.body.error.message).toBe('Định danh nhiệm vụ không hợp lệ');
    });

    it('4. Trả về 404 TASK_NOT_FOUND khi không tìm thấy task với ID đã cung cấp', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      jest.spyOn(Task, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .put(`/api/v1/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ title: 'Tiêu đề mới' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TASK_NOT_FOUND');
      expect(res.body.error.message).toBe('Không tìm thấy nhiệm vụ');
    });

    it('5. Trả về 403 FORBIDDEN khi người dùng cập nhật task thuộc sở hữu của người khác', async () => {
      const taskId = new mongoose.Types.ObjectId().toString();
      const mockTaskOwnerA: any = {
        _id: taskId,
        user_id: new mongoose.Types.ObjectId(userA_Id),
        title: 'Task của User A'
      };

      jest.spyOn(Task, 'findById').mockResolvedValue(mockTaskOwnerA);

      // User B cố tình sửa task của User A
      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ title: 'Cố tình sửa lén' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toBe('Bạn không có quyền thao tác trên nhiệm vụ này');
    });
  });

  describe('Kiểm tra tính hợp lệ dữ liệu đầu vào (Input Validation)', () => {
    let mockTask: any;
    let taskId: string;

    beforeEach(() => {
      taskId = new mongoose.Types.ObjectId().toString();
      mockTask = {
        _id: taskId,
        user_id: new mongoose.Types.ObjectId(userA_Id),
        title: 'Nhiệm vụ ban đầu',
        description: 'Mô tả ban đầu',
        priority: 'LOW',
        status: 'TODO',
        due_date: null,
        xp_reward: 10,
        completed_at: null,
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        })
      };
      jest.spyOn(Task, 'findById').mockResolvedValue(mockTask);
    });

    it('6. Trả về 400 TITLE_REQUIRED khi title là chuỗi rỗng sau khi trim()', async () => {
      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ title: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TITLE_REQUIRED');
    });

    it('7. Trả về 400 TITLE_TOO_LONG khi title vượt quá 200 ký tự', async () => {
      const longTitle = 'A'.repeat(201);
      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ title: longTitle });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TITLE_TOO_LONG');
    });

    it('8. Trả về 400 DESCRIPTION_TOO_LONG khi description vượt quá 1000 ký tự', async () => {
      const longDesc = 'D'.repeat(1001);
      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ description: longDesc });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DESCRIPTION_TOO_LONG');
    });

    it('9. Trả về 400 INVALID_PRIORITY khi priority không thuộc LOW/MEDIUM/HIGH', async () => {
      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ priority: 'CRITICAL' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_PRIORITY');
    });

    it('10. Trả về 400 INVALID_STATUS khi status không thuộc TODO/IN_PROGRESS/COMPLETED', async () => {
      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ status: 'ARCHIVED' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_STATUS');
    });

    it('11. Trả về 400 INVALID_DUE_DATE khi due_date không phải định dạng ngày hợp lệ', async () => {
      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ due_date: 'invalid-date-format' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_DUE_DATE');
    });
  });

  describe('Cập nhật thành công (Update Success)', () => {
    let mockTask: any;
    let taskId: string;

    beforeEach(() => {
      taskId = new mongoose.Types.ObjectId().toString();
      mockTask = {
        _id: taskId,
        user_id: new mongoose.Types.ObjectId(userA_Id),
        title: 'Nộp báo cáo kiến trúc hệ thống',
        description: 'Kiểm tra lại Swagger trước khi nộp',
        priority: 'LOW',
        status: 'TODO',
        due_date: new Date('2026-11-05T00:00:00.000Z'),
        xp_reward: 10,
        completed_at: null,
        created_at: new Date('2026-11-01T10:00:00.000Z'),
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        })
      };
      jest.spyOn(Task, 'findById').mockResolvedValue(mockTask);
    });

    it('12. Cập nhật thành công tiêu đề và mô tả, trả về Response Envelope 200 OK', async () => {
      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          title: 'Nộp báo cáo kiến trúc hệ thống (Đã chỉnh sửa)',
          description: 'Cập nhật thêm tài liệu API contracts'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Cập nhật nhiệm vụ thành công');
      expect(res.body.data.title).toBe('Nộp báo cáo kiến trúc hệ thống (Đã chỉnh sửa)');
      expect(res.body.data.description).toBe('Cập nhật thêm tài liệu API contracts');
      expect(mockTask.save).toHaveBeenCalled();
    });

    it('13. Tự động tính toán lại xp_reward khi cập nhật độ ưu tiên (LOW -> HIGH => 30 XP)', async () => {
      expect(mockTask.priority).toBe('LOW');
      expect(mockTask.xp_reward).toBe(10);

      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          priority: 'HIGH'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.priority).toBe('HIGH');
      expect(res.body.data.xp_reward).toBe(30);
    });

    it('14. Hỗ trợ cập nhật due_date mới và xóa hạn chót khi truyền null', async () => {
      // Cập nhật ngày mới
      const newDateStr = '2026-11-20T17:00:00.000Z';
      const res1 = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ due_date: newDateStr });

      expect(res1.status).toBe(200);
      expect(new Date(res1.body.data.due_date).toISOString()).toBe(newDateStr);

      // Xóa ngày bằng cách gửi null
      const res2 = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ due_date: null });

      expect(res2.status).toBe(200);
      expect(res2.body.data.due_date).toBeNull();
    });

    it('15. Tự động gán completed_at khi đổi status sang COMPLETED và reset khi chuyển về TODO', async () => {
      // Đổi sang COMPLETED
      const resComplete = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ status: 'COMPLETED' });

      expect(resComplete.status).toBe(200);
      expect(resComplete.body.data.status).toBe('COMPLETED');
      expect(resComplete.body.data.completed_at).not.toBeNull();

      // Đổi về TODO
      const resReopen = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ status: 'TODO' });

      expect(resReopen.status).toBe(200);
      expect(resReopen.body.data.status).toBe('TODO');
      expect(resReopen.body.data.completed_at).toBeNull();
    });

    it('16. Bảo vệ các trường hệ thống không bị ghi đè (user_id, created_at, _id)', async () => {
      const maliciousUserId = new mongoose.Types.ObjectId().toString();
      const maliciousCreatedAt = new Date('2020-01-01').toISOString();

      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          title: 'Tiêu đề cập nhật hợp lệ',
          user_id: maliciousUserId,
          created_at: maliciousCreatedAt
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user_id.toString()).toBe(userA_Id);
      expect(new Date(res.body.data.created_at).toISOString()).toBe(
        mockTask.created_at.toISOString()
      );
    });
  });
});
