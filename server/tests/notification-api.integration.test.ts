import { Types } from 'mongoose';
import { api, describeWithMongo, registerFixture, useSprint2Database } from './sprint2Fixture';
import { createNotification, ensureNotificationIndexes } from '../src/services/notificationService';
import mongoose from 'mongoose';

describeWithMongo('Notifications API with MongoDB', () => {
  useSprint2Database();
  const path = '/api/v1/notifications';

  it('returns the latest 20 for the signed-in owner but counts older unread records', async () => {
    await ensureNotificationIndexes();
    const owner = await registerFixture();
    const other = await registerFixture();
    const collection = mongoose.connection.collection('notifications');
    await collection.insertMany(Array.from({ length: 22 }, (_, index) => ({
      user_id: new Types.ObjectId(owner.user._id),
      title: 'Notice ' + index,
      message: 'Test notification',
      type: 'SYSTEM',
      is_read: false,
      created_at: new Date(1700000000000 + index * 1000)
    })));
    await createNotification(other.user._id, 'Private', 'Only for another account', 'REMINDER');
    await api.get(path).expect(401);
    const { body } = await api.get(path).auth(owner.token, { type: 'bearer' }).expect(200);
    expect(body).toMatchObject({ success: true, data: { unread_count: 22 } });
    expect(body.data.notifications.map((item: { title: string }) => item.title))
      .toEqual(Array.from({ length: 20 }, (_, index) => 'Notice ' + (21 - index)));
    const indexes = await collection.indexes();
    expect(indexes.map(index => index.key)).toEqual(expect.arrayContaining([
      { user_id: 1, is_read: 1 }, { user_id: 1, created_at: -1 }
    ]));
  });

  it('marks a single notification and all remaining notices idempotently and isolates owners', async () => {
    const owner = await registerFixture();
    const other = await registerFixture();
    const first = await createNotification(owner.user._id, 'Badge earned', 'First task', 'ACHIEVEMENT');
    const remaining = await createNotification(owner.user._id, 'Reminder', 'Start today', 'REMINDER');
    const foreign = await createNotification(other.user._id, 'System', 'Other account', 'SYSTEM');
    const read = (id: string) => api.patch(path + '/' + id + '/read').auth(owner.token, { type: 'bearer' });
    await read('invalid').expect(400);
    await read(String(foreign._id)).expect(404);
    for (let repeat = 0; repeat < 2; repeat++) {
      const { body } = await read(String(first._id)).expect(200);
      expect(body.data).toMatchObject({ is_read: true, unread_count: 1 });
    }
    const readAll = () => api.patch(path + '/read-all').auth(owner.token, { type: 'bearer' });
    expect((await readAll().expect(200)).body.data).toEqual({ updated_count: 1, unread_count: 0 });
    expect((await readAll().expect(200)).body.data).toEqual({ updated_count: 0, unread_count: 0 });
    expect((await read(String(remaining._id)).expect(200)).body.data.unread_count).toBe(0);
    expect((await api.get(path).auth(other.token, { type: 'bearer' }).expect(200)).body.data.unread_count).toBe(1);
  });
});
