import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { Task } from '../src/models/Task';
const id = '672a11112222333344445555';
const token = jwt.sign({ id, email: 'kien@example.com' }, 'test-secret');
beforeAll(() => { process.env.JWT_SECRET = 'test-secret'; });
afterEach(() => jest.restoreAllMocks());
it.each([{}, { title: '   ' }, { title: 'x'.repeat(201) }, { title: 'ok', priority: 'INVALID' }, { title: 'ok', due_date: '2026-02-30' }])('rejects invalid input %j', async body => {
  const response = await request(app).post('/api/v1/tasks').set('Authorization', `Bearer ${token}`).send(body);
  expect(response.status).toBe(400);
});
it('persists only the authenticated owner and server controlled defaults', async () => {
  jest.spyOn(Task.prototype, 'save').mockImplementation(async function (this: any) { return this; });
  const response = await request(app).post('/api/v1/tasks').set('Authorization', `Bearer ${token}`).send({ title: ' Test ', user_id: 'other', status: 'COMPLETED' });
  expect(response.status).toBe(201);
  expect(response.body.data).toMatchObject({ title: 'Test', user_id: id, status: 'TODO', priority: 'MEDIUM', xp_reward: 20, completed_at: null });
});
