export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

/** Thực thể Task chuẩn trả về từ Backend API (khớp với Mongoose Task Schema) */
export interface Task {
  _id: string;
  user_id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  xp_reward: number;
  completed_at: string | null;
  created_at: string;
}

/** Tham số lọc khi lấy danh sách nhiệm vụ (US-S1-02: GET /api/v1/tasks) */
export interface ListTasksQueryDTO {
  status?: TaskStatus;
  priority?: TaskPriority;
}

/** Cấu trúc dữ liệu trả về của danh sách nhiệm vụ (US-S1-02) */
export interface TaskListResponseData {
  tasks: Task[];
  total: number;
}

/** Cấu trúc phản hồi chuẩn (Response Envelope) dùng chung toàn hệ thống */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

/** Payload gửi lên khi tạo mới nhiệm vụ (US-S1-01: POST /api/v1/tasks) */
export interface CreateTaskRequestDTO {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string | null;
}
