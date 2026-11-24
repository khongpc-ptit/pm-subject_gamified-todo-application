import mongoose, { Schema, Model } from 'mongoose';
import { IUserBadge } from '../types/badge.types';

const userBadgeSchema = new Schema<IUserBadge>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user_id là bắt buộc'],
      index: true
    },
    badge_id: {
      type: Schema.Types.ObjectId,
      ref: 'Badge',
      required: [true, 'badge_id là bắt buộc'],
      index: true
    },
    unlocked_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Compound Unique Index: Ngăn chặn cấp trùng một huy hiệu cho cùng một người dùng
userBadgeSchema.index({ user_id: 1, badge_id: 1 }, { unique: true });

export const UserBadge: Model<IUserBadge> = mongoose.model<IUserBadge>('UserBadge', userBadgeSchema);
export default UserBadge;
