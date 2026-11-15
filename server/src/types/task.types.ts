import { Document, Types } from 'mongoose';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface ITask extends Document {
  user_id: Types.ObjectId;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: Date | null;
  xp_reward: number;
  completed_at: Date | null;
  created_at: Date;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string | Date | null;
}

export interface ListTasksQueryDTO {
  status?: string;
  priority?: string;
}

export interface TaskListResponseData {
  tasks: ITask[];
  total: number;
}
