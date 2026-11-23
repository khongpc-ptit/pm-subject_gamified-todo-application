import mongoose, { Schema, Model } from 'mongoose';
import { ITask, TaskPriority } from '../types/task.types';

export const PRIORITY_XP_MAP: Record<TaskPriority, number> = {
  LOW: 10,
  MEDIUM: 20,
  HIGH: 30
};

const taskSchema = new Schema<ITask>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM'
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
      default: 'TODO',
      index: true
    },
    due_date: {
      type: Date,
      default: null
    },
    xp_reward: {
      type: Number,
      default: 20
    },
    xp_earned: {
      type: Number,
      default: 0
    },
    completed_at: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
);

// Compound index for optimal dashboard query by user and status
taskSchema.index({ user_id: 1, status: 1 });

// Automatically compute xp_reward based on priority before saving
taskSchema.pre('save', function (this: ITask, next) {
  if (this.priority && PRIORITY_XP_MAP[this.priority]) {
    this.xp_reward = PRIORITY_XP_MAP[this.priority];
  }
  next();
});

export const Task: Model<ITask> = mongoose.model<ITask>('Task', taskSchema);
