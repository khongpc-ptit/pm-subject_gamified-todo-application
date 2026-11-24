import mongoose, { Types } from 'mongoose';

export type NotificationType = 'ACHIEVEMENT' | 'REMINDER' | 'SYSTEM';

interface NotificationRecord {
  user_id: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: Date;
}

const notifications = () => mongoose.connection.collection('notifications');

export async function ensureNotificationIndexes(): Promise<void> {
  await notifications().createIndexes([
    { key: { user_id: 1, is_read: 1 }, name: 'user_id_1_is_read_1' },
    { key: { user_id: 1, created_at: -1 }, name: 'user_id_1_created_at_-1' }
  ]);
}

export async function createNotification(
  userId: string | Types.ObjectId,
  title: string,
  message: string,
  type: NotificationType
) {
  const record: NotificationRecord = {
    user_id: new Types.ObjectId(userId),
    title,
    message,
    type,
    is_read: false,
    created_at: new Date()
  };
  const { insertedId } = await notifications().insertOne(record);
  return { _id: insertedId, ...record };
}

async function list(userId: string) {
  const owner = { user_id: new Types.ObjectId(userId) };
  const [items, unread_count] = await Promise.all([
    notifications().find(owner).sort({ created_at: -1 }).limit(20).toArray(),
    notifications().countDocuments({ ...owner, is_read: false })
  ]);
  return { notifications: items, unread_count };
}

async function read(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error('Định danh thông báo không hợp lệ'), {
      statusCode: 400, code: 'INVALID_ID'
    });
  }
  const owner = { user_id: new Types.ObjectId(userId) };
  const result = await notifications().updateOne(
    { _id: new Types.ObjectId(id), ...owner },
    { $set: { is_read: true } }
  );
  if (result.matchedCount === 0) {
    throw Object.assign(new Error('Không tìm thấy thông báo'), {
      statusCode: 404, code: 'NOTIFICATION_NOT_FOUND'
    });
  }
  return { id, is_read: true, unread_count: await notifications().countDocuments({ ...owner, is_read: false }) };
}

async function readAll(userId: string) {
  const unread = { user_id: new Types.ObjectId(userId), is_read: false };
  const result = await notifications().updateMany(unread, { $set: { is_read: true } });
  return { updated_count: result.modifiedCount, unread_count: await notifications().countDocuments(unread) };
}

export const notificationService = { list, read, readAll, createNotification };
