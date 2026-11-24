import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { Task } from '../src/models/Task';
const id = '672a11112222333344445555';
const token = jwt.sign({ id, email: 'kien@example.com' }, 'test-secret');
beforeAll(() => { process.env.JWT_SECRET = 'test-secret'; });
afterEach(() => jest.restoreAllMocks());
it('rejects malformed IDs', async () => {
  const response = await request(app).patch('/api/v1/tasks/invalid/complete').set('Authorization', `Bearer ${token}`);
  expect(response.status).toBe(400);
});
it('updates only owned incomplete tasks', async () => {
  const update = jest.spyOn(Task, 'findOneAndUpdate').mockResolvedValue({ _id: id, status: 'COMPLETED' } as any);
  const response = await request(app).patch(`/api/v1/tasks/${id}/complete`).set('Authorization', `Bearer ${token}`);
  expect(response.status).toBe(200);
  expect(update).toHaveBeenCalledWith({ _id: id, user_id: id, status: { $ne: 'COMPLETED' } }, { $set: { status: 'COMPLETED', completed_at: expect.any(Date), xp_earned: 0 } }, { new: true, runValidators: true });
});
it('preserves the first completion timestamp on retries', async () => {
  jest.spyOn(Task, 'findOneAndUpdate').mockResolvedValue(null);
  jest.spyOn(Task, 'findOne').mockResolvedValue({ _id: id, status: 'COMPLETED', completed_at: '2026-11-01' } as any);
  const response = await request(app).patch(`/api/v1/tasks/${id}/complete`).set('Authorization', `Bearer ${token}`);
  expect(response.body.data.completed_at).toBe('2026-11-01');
});
