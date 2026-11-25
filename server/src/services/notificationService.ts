import { Types } from 'mongoose';
import { Notification } from '../models/Notification';
import type { INotificationListResponse, NotificationType } from '../types/notification.types';

export function createNotification(
  userId: string | Types.ObjectId,
  title: string,
  message: string,
  type: NotificationType
) {
  return Notification.create({ user_id: new Types.ObjectId(userId), title, message, type, is_read: false });
}

async function list(userId: string): Promise<INotificationListResponse> {
  const owner = { user_id: new Types.ObjectId(userId) };
  const [items, unread_count, total] = await Promise.all([
    Notification.find(owner).sort({ created_at: -1 }).limit(20).lean(),
    Notification.countDocuments({ ...owner, is_read: false }),
    Notification.countDocuments(owner)
  ]);
  return {
    notifications: items.map(({ _id, title, message, type, is_read, created_at }) => ({
      id: _id.toString(), title, message, type, is_read, created_at: created_at.toISOString()
    })),
    unread_count, total
  };
}

async function read(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error('Định danh thông báo không hợp lệ'), {
      statusCode: 400, code: 'INVALID_ID'
    });
  }
  const owner = { user_id: new Types.ObjectId(userId) };
  const result = await Notification.updateOne(
    { _id: new Types.ObjectId(id), ...owner },
    { $set: { is_read: true } }
  );
  if (result.matchedCount === 0) {
    throw Object.assign(new Error('Thông báo không tồn tại hoặc bạn không có quyền truy cập'), {
      statusCode: 404, code: 'NOTIFICATION_NOT_FOUND'
    });
  }
  return { id, is_read: true, unread_count: await Notification.countDocuments({ ...owner, is_read: false }) };
}

async function readAll(userId: string) {
  const unread = { user_id: new Types.ObjectId(userId), is_read: false };
  const result = await Notification.updateMany(unread, { $set: { is_read: true } });
  return { modified_count: result.modifiedCount, unread_count: await Notification.countDocuments(unread) };
}

export const notificationService = { list, read, readAll, createNotification };
