import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/models/User';
import * as email from '../src/services/email.service';
afterEach(() => jest.restoreAllMocks());
it('sends reset email without exposing token in the response', async () => {
  jest.spyOn(User, 'findOneAndUpdate').mockResolvedValue({ email: 'kien@example.com' } as any);
  const send = jest.spyOn(email, 'sendResetEmail').mockResolvedValue(undefined);
  const response = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'kien@example.com' });
  expect(response.status).toBe(200);
  expect(send.mock.calls[0][1]).toMatch(/^[a-f0-9]{64}$/);
  expect(JSON.stringify(response.body)).not.toContain(send.mock.calls[0][1]);
});
it('atomically consumes reset token and rejects reuse', async () => {
  const update = jest.spyOn(User, 'findOneAndUpdate').mockResolvedValueOnce({} as any).mockResolvedValueOnce(null);
  const body = { token: 'a'.repeat(64), password: 'newpassword123' };
  expect((await request(app).post('/api/v1/auth/reset-password').send(body)).status).toBe(200);
  expect((await request(app).post('/api/v1/auth/reset-password').send(body)).status).toBe(400);
  expect(update.mock.calls[0][0]).toMatchObject({ reset_password_expires: { $gt: expect.any(Date) } });
  expect(update.mock.calls[0][1]).toMatchObject({ $unset: { reset_password_hash: 1, reset_password_expires: 1 } });
});
