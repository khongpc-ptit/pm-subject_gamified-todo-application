import { Document, Types } from 'mongoose';

export type NotificationType = 'REMINDER' | 'ACHIEVEMENT' | 'SYSTEM';

export interface INotification extends Document {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: Date;
}

export interface INotificationDTO {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface INotificationListResponse {
  notifications: INotificationDTO[];
  unread_count: number;
  total: number;
}
