import { apiClient } from './api';
import type {
  Task,
  ListTasksQueryDTO,
  TaskListResponseData,
  ApiResponse,
  CreateTaskRequestDTO,
  UpdateTaskRequestDTO
} from '../types/task.types';

// Dữ liệu mẫu ban đầu theo đúng wireframe Core MVP Screens.html nếu chạy ở chế độ offline preview
export const INITIAL_MOCK_TASKS: Task[] = [
  {
    _id: 'mock-task-1',
    user_id: 'user-demo-1',
    title: 'Hoàn thiện wireframe màn hình Dashboard',
    description: 'Rà soát luồng tạo nhanh và trạng thái công việc.',
    priority: 'HIGH',
    status: 'TODO',
    due_date: '2026-11-07T00:00:00.000Z',
    xp_reward: 30,
    completed_at: null,
    created_at: '2026-11-01T08:00:00.000Z'
  },
  {
    _id: 'mock-task-2',
    user_id: 'user-demo-1',
    title: 'Đọc lại yêu cầu Sprint 1',
    description: '',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    due_date: '2026-11-07T00:00:00.000Z',
    xp_reward: 20,
    completed_at: null,
    created_at: '2026-11-02T09:00:00.000Z'
  },
  {
    _id: 'mock-task-3',
    user_id: 'user-demo-1',
    title: 'Chuẩn bị nội dung họp nhóm',
    description: '',
    priority: 'LOW',
    status: 'TODO',
    due_date: '2026-11-08T00:00:00.000Z',
    xp_reward: 10,
    completed_at: null,
    created_at: '2026-11-03T10:00:00.000Z'
  },
  {
    _id: 'mock-task-4',
    user_id: 'user-demo-1',
    title: 'Tổng hợp checklist MVP',
    description: '',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    due_date: '2026-11-07T00:00:00.000Z',
    xp_reward: 20,
    completed_at: '2026-11-04T16:00:00.000Z',
    created_at: '2026-11-04T11:00:00.000Z'
  }
];

export const taskService = {
  /**
   * Lấy danh sách nhiệm vụ từ API
   * GET /api/v1/tasks
   */
  async getTasks(params?: ListTasksQueryDTO): Promise<TaskListResponseData> {
    try {
      const response = await apiClient.get<ApiResponse<TaskListResponseData>>('/tasks', {
        params
      });

      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data?.message || 'Không thể lấy danh sách nhiệm vụ');
    } catch (err: any) {
      // Nếu kết nối máy chủ thất bại (Network Error), kiểm tra chế độ demo
      if (err.code === 'ERR_NETWORK' || !err.response) {
        console.warn('[TaskService] Backend chưa bật hoặc không thể kết nối, sử dụng mock state');
      }
      throw err;
    }
  },

  /**
   * Tạo nhiệm vụ mới
   * POST /api/v1/tasks
   */
  async createTask(data: CreateTaskRequestDTO): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>('/tasks', data);
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Tạo công việc thất bại');
  },

  /**
   * Cập nhật thông tin nhiệm vụ
   * PUT /api/v1/tasks/:id
   */
  async updateTask(id: string, data: UpdateTaskRequestDTO): Promise<Task> {
    const response = await apiClient.put<ApiResponse<Task>>(`/tasks/${id}`, data);
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Cập nhật công việc thất bại');
  }
};
