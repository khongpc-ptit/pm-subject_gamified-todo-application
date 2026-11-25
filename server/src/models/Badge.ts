import mongoose, { Schema, Model } from 'mongoose';
import { IBadge } from '../types/badge.types';

const badgeSchema = new Schema<IBadge>(
  {
    code: {
      type: String,
      required: [true, 'code là bắt buộc'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [50, 'code không được vượt quá 50 ký tự']
    },
    title: {
      type: String,
      required: [true, 'title là bắt buộc'],
      trim: true,
      maxlength: [100, 'title không được vượt quá 100 ký tự']
    },
    description: {
      type: String,
      required: [true, 'description là bắt buộc'],
      trim: true,
      maxlength: [500, 'description không được vượt quá 500 ký tự']
    },
    icon_url: {
      type: String,
      required: [true, 'icon_url là bắt buộc'],
      trim: true
    },
    condition_type: {
      type: String,
      enum: {
        values: ['TASK_COUNT', 'STREAK_DAYS', 'LEVEL_REACH'],
        message: 'condition_type phải là TASK_COUNT, STREAK_DAYS hoặc LEVEL_REACH'
      },
      required: [true, 'condition_type là bắt buộc']
    },
    condition_value: {
      type: Number,
      required: [true, 'condition_value là bắt buộc'],
      min: [1, 'condition_value phải lớn hơn hoặc bằng 1']
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
);

export const Badge: Model<IBadge> = mongoose.model<IBadge>('Badge', badgeSchema);
export default Badge;
