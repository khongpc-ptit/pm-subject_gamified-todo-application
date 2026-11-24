import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app';
import { Habit } from '../src/models/Habit';
import { Task } from '../src/models/Task';
import { User } from '../src/models/User';
import { getVietnamDateString } from '../src/services/gamification.service';

it('rolls the check-in day over at midnight in Vietnam', () => {
  expect(getVietnamDateString(new Date('2026-11-24T16:59:59.999Z'))).toBe('2026-11-24');
  expect(getVietnamDateString(new Date('2026-11-24T17:00:00.000Z'))).toBe('2026-11-25');
});

const mongoUri = process.env.TEST_MONGODB_URI;
const describeWithMongo = mongoUri ? describe : describe.skip;
const api = request(app);

describeWithMongo('Habit check-in against MongoDB', () => {
  let owner: { token: string; user: { _id: string } };
  let other: typeof owner;

  beforeAll(async () => {
    process.env.JWT_SECRET = randomUUID();
    await mongoose.connect(mongoUri!, {
      dbName: 'questline_checkin_test_' + randomUUID().replace(/-/g, ''),
      serverSelectionTimeoutMS: 5000
    });
    await Promise.all([User.init(), Habit.init(), Task.init()]);
    const register = async (email: string) => (await api.post('/api/v1/auth/register')
      .send({ email, full_name: 'Test Account', password: 'fixture-password' }).expect(201)).body.data;
    owner = await register('owner@example.test');
    other = await register('other@example.test');
  }, 20000);

  beforeEach(async () => {
    await Promise.all([
      Habit.deleteMany({}),
      Task.deleteMany({}),
      User.updateMany({}, { $set: { total_xp: 0, current_level: 1, last_active_date: null } })
    ]);
  });

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    } finally {
      await mongoose.disconnect();
    }
  });

  const createHabit = async (title: string) => (await api.post('/api/v1/habits')
    .auth(owner.token, { type: 'bearer' }).send({ title }).expect(201)).body.data._id as string;
  const checkIn = (id: string, token = owner.token) =>
    api.post('/api/v1/habits/' + id + '/check-in').auth(token, { type: 'bearer' });

  it('awards once under concurrent duplicate requests and persists level and activity', async () => {
    const id = await createHabit('Read every day');
    const yesterday = getVietnamDateString(new Date(Date.now() - 86400000));
    await Habit.updateOne({ _id: id }, {
      $set: { current_streak: 1, logs: [{ log_date: yesterday, is_completed: true, xp_earned: 15 }] }
    });
    await User.updateOne({ _id: owner.user._id }, { $set: { total_xp: 85 } });
    const responses = await Promise.all([checkIn(id), checkIn(id)]);
    const success = responses.find(response => response.status === 200)!;
    const duplicate = responses.find(response => response.status === 400)!;
    expect(duplicate.body.error.code).toBe('HABIT_ALREADY_CHECKED_IN');
    expect(success.body.data).toMatchObject({
      habit: { current_streak: 2 },
      xp_earned: 15, total_xp: 100, current_level: 2, level_up: true, next_level_xp: 400
    });
    const today = getVietnamDateString();
    expect((await Habit.findById(id).lean())!.logs).toEqual([
      { log_date: yesterday, is_completed: true, xp_earned: 15 },
      { log_date: today, is_completed: true, xp_earned: 15 }
    ]);
    expect(await User.findById(owner.user._id).lean()).toMatchObject({
      total_xp: 100, current_level: 2, last_active_date: today
    });
  });

  it('shares the remaining daily XP between simultaneous task and habit requests', async () => {
    const id = await createHabit('Walk');
    const cappedId = await createHabit('Stretch');
    const tasks = '/api/v1/tasks';
    const task = (await api.post(tasks).auth(owner.token, { type: 'bearer' })
      .send({ title: 'Finish sprint', priority: 'HIGH' }).expect(201)).body.data;
    await User.updateOne({ _id: owner.user._id }, { total_xp: 190, current_level: 2 });
    await Task.create({ user_id: owner.user._id, title: 'Earlier work', status: 'COMPLETED',
      completed_at: new Date(), xp_earned: 190 });

    const responses = await Promise.all([
      checkIn(id).expect(200),
      api.patch(tasks + '/' + task._id + '/complete').auth(owner.token, { type: 'bearer' }).expect(200)
    ]);
    expect(responses.map(response => response.body.data.xp_earned).sort((a, b) => a - b)).toEqual([0, 10]);
    const capped = (await checkIn(cappedId).expect(200)).body.data;
    expect(capped).toMatchObject({ xp_earned: 0, is_cap_reached: true, total_xp: 200 });
    expect(capped.habit).toMatchObject({ current_streak: 1, logs: [{ is_completed: true, xp_earned: 0 }] });
    expect((await User.findById(owner.user._id).lean())!.total_xp).toBe(200);
  });

  it('rolls back the log if the user update fails and allows retry', async () => {
    const id = await createHabit('Read');
    jest.spyOn(User.prototype, 'save').mockRejectedValueOnce(new Error('Fixture write failure'));
    await checkIn(id).expect(500);
    expect(await Habit.findById(id).lean()).toMatchObject({ current_streak: 0, logs: [] });
    expect((await User.findById(owner.user._id).lean())!.total_xp).toBe(0);
    expect((await checkIn(id).expect(200)).body.data.xp_earned).toBe(15);
  });

  it('requires authentication and hides habits owned by another account or archived', async () => {
    const id = await createHabit('Private habit');
    await api.post('/api/v1/habits/' + id + '/check-in').expect(401);
    await checkIn('invalid').expect(400);
    expect((await checkIn(id, other.token).expect(404)).body.error.code).toBe('HABIT_NOT_FOUND');
    await Habit.updateOne({ _id: id }, { is_active: false });
    await checkIn(id).expect(404);
    expect((await Habit.findById(id).lean())!.logs).toEqual([]);
  });
});
