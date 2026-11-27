import mongoose, { Schema, Model } from 'mongoose';
import { IHabit, IHabitLog } from '../types/habit.types';

const habitLogSchema = new Schema<IHabitLog>(
  {
    log_date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'log_date phải có định dạng YYYY-MM-DD']
    },
    is_completed: {
      type: Boolean,
      default: true
    },
    xp_earned: {
      type: Number,
      default: 15
    }
  },
  { _id: false }
);

const habitSchema = new Schema<IHabit>(
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
    frequency: {
      type: String,
      enum: ['DAILY', 'WEEKLY'],
      default: 'DAILY'
    },
    target_days: {
      type: Number,
      default: 7,
      min: 1,
      max: 7
    },
    current_streak: {
      type: Number,
      default: 0,
      min: 0
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true
    },
    logs: [habitLogSchema]
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
);

// Compound indexes for optimal querying active habits and weekly log aggregation
habitSchema.index({ user_id: 1, is_active: 1 });
habitSchema.index({ user_id: 1, 'logs.log_date': 1 });

export const Habit: Model<IHabit> = mongoose.model<IHabit>('Habit', habitSchema);
export default Habit;
