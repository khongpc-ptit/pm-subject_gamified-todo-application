import mongoose, { Schema, Model } from 'mongoose';
import { INotification } from '../types/notification.types';

const notificationSchema = new Schema<INotification>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user_id là bắt buộc'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'title là bắt buộc'],
      trim: true,
      maxlength: [200, 'title không được vượt quá 200 ký tự']
    },
    message: {
      type: String,
      required: [true, 'message là bắt buộc'],
      trim: true,
      maxlength: [1000, 'message không được vượt quá 1000 ký tự']
    },
    type: {
      type: String,
      enum: {
        values: ['REMINDER', 'ACHIEVEMENT', 'SYSTEM'],
        message: 'type phải là REMINDER, ACHIEVEMENT hoặc SYSTEM'
      },
      default: 'REMINDER'
    },
    is_read: {
      type: Boolean,
      default: false,
      index: true
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Compound Indexes for fast queries
notificationSchema.index({ user_id: 1, is_read: 1 });
notificationSchema.index({ user_id: 1, created_at: -1 });

export const Notification: Model<INotification> = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
