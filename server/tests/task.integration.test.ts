import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app';
import { Task } from '../src/models/Task';
import { User } from '../src/models/User';

const mongoUri = process.env.TEST_MONGODB_URI;
const describeWithMongo = mongoUri ? describe : describe.skip;
const api = request(app);
const base = '/api/v1/tasks';

describeWithMongo('Task management with MongoDB', () => {
  let owner: { token: string; user: { _id: string } };
  let other: typeof owner;

  beforeAll(async () => {
    process.env.JWT_SECRET = randomUUID();
    await mongoose.connect(mongoUri!, {
      dbName: 'questline_task_test_' + randomUUID().replace(/-/g, ''),
      serverSelectionTimeoutMS: 5000
    });
    await Promise.all([Task.init(), User.init()]);
    const register = async (email: string) =>
      (await api.post('/api/v1/auth/register')
        .send({ email, password: 'fixture-password', full_name: 'Test Account' })
        .expect(201)).body.data;
    owner = await register('owner@example.test');
    other = await register('other@example.test');
  }, 20000);

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    } finally {
      await mongoose.disconnect();
    }
  });

  const list = (token: string) => api.get(base).auth(token, { type: 'bearer' });
  const create = (data: object) => api.post(base).auth(owner.token, { type: 'bearer' }).send(data);
  const update = (token: string, id: string, data: object) =>
    api.put(base + '/' + id).auth(token, { type: 'bearer' }).send(data);
  const complete = (token: string, id: string) =>
    api.patch(base + '/' + id + '/complete').auth(token, { type: 'bearer' });

  it('rejects unauthenticated requests and invalid input without writing a task', async () => {
    const countBefore = await Task.countDocuments();
    await api.get(base).expect(401);
    await api.post(base).send({ title: 'Unowned' }).expect(401);
    for (const data of [{}, { title: ' ' }, { title: 'x'.repeat(201) },
      { title: 'Invalid priority', priority: 'UNKNOWN' },
      { title: 'Invalid date', due_date: '2026-02-30' }]) {
      const response = await create(data).expect(400);
      expect(response.body).toMatchObject({ success: false, error: { code: expect.any(String) } });
    }
    expect(await Task.countDocuments()).toBe(countBefore);
  });

  it('persists creation, editing and completion across fresh list requests', async () => {
    expect((await list(owner.token).expect(200)).body.data.tasks).toEqual([]);
    const created = (await create({
      title: '  Sprint verification  ', description: 'Original notes', priority: 'HIGH',
      due_date: '2026-12-01', status: 'COMPLETED', user_id: other.user._id
    }).expect(201)).body.data;
    const { _id: id } = created;
    expect(created).toMatchObject({
      title: 'Sprint verification', description: 'Original notes', status: 'TODO',
      priority: 'HIGH', user_id: owner.user._id, xp_reward: 30, completed_at: null
    });
    expect((await list(owner.token).query({ priority: 'HIGH', status: 'TODO' }).expect(200)).body.data.tasks)
      .toEqual([expect.objectContaining({ _id: id, due_date: '2026-12-01T00:00:00.000Z' })]);
    expect((await list(other.token).expect(200)).body.data.tasks).toEqual([]);

    await update(other.token, id, { title: 'Unauthorized edit' }).expect(403);
    await complete(other.token, id).expect(403);
    await update(owner.token, id, { title: ' ' }).expect(400);
    expect(await Task.findById(id).lean()).toMatchObject({ title: 'Sprint verification', status: 'TODO' });

    await update(owner.token, id, {
      title: 'Revised task', description: 'Updated notes', priority: 'LOW', due_date: null
    }).expect(200);
    expect((await list(owner.token).expect(200)).body.data.tasks).toEqual([expect.objectContaining({
      _id: id, title: 'Revised task', description: 'Updated notes', priority: 'LOW',
      xp_reward: 10, due_date: null
    })]);

    const previousXP = (await User.findById(owner.user._id).lean())!.total_xp;
    const completed = (await complete(owner.token, id).expect(200)).body.data;
    const repeated = (await complete(owner.token, id).expect(200)).body.data;
    expect(completed).toMatchObject({ status: 'COMPLETED', completed_at: expect.any(String), xp_earned: 10 });
    expect(repeated.xp_earned).toBe(0);
    expect(repeated.completed_at).toBe(completed.completed_at);
    expect((await list(owner.token).query({ status: 'COMPLETED' }).expect(200)).body.data.tasks)
      .toEqual([expect.objectContaining({ _id: id, completed_at: completed.completed_at })]);
    expect((await User.findById(owner.user._id).lean())!.total_xp).toBe(previousXP + 10);
  });

  it('accepts a 200-character title and distinguishes malformed IDs from missing tasks', async () => {
    const title = 'x'.repeat(200);
    const accepted = await create({ title }).expect(201);
    expect(accepted.body.data.title).toBe(title);
    await Task.deleteOne({ _id: accepted.body.data._id });

    const missing = new mongoose.Types.ObjectId().toString();
    await update(owner.token, 'malformed', { title: 'Valid' }).expect(400);
    await complete(owner.token, 'malformed').expect(400);
    await update(owner.token, missing, { title: 'Valid' }).expect(404);
    await complete(owner.token, missing).expect(404);
  });
});
