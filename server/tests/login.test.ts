import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { User } from '../src/models/User';
beforeAll(() => { process.env.JWT_SECRET = 'test-secret'; });
afterEach(() => jest.restoreAllMocks());
it('rejects missing credentials', async () => { expect((await request(app).post('/api/v1/auth/login').send({})).status).toBe(400); });
it('uses the same error for unknown accounts and wrong passwords', async () => {
  jest.spyOn(User, 'findOne').mockResolvedValue(null);
  const response = await request(app).post('/api/v1/auth/login').send({ email: 'test@example.com', password: 'wrong' });
  expect(response.status).toBe(401); expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
});
it('checks bcrypt and returns a signed token without the password hash', async () => {
  const password_hash = await bcrypt.hash('password123', 10);
  const user = new User({ email: 'kien@example.com', full_name: 'Kien', password_hash });
  jest.spyOn(User, 'findOne').mockResolvedValue(user);
  const response = await request(app).post('/api/v1/auth/login').send({ email: ' KIEN@example.com ', password: 'password123' });
  expect(response.status).toBe(200); expect(response.body.data.user.password_hash).toBeUndefined();
  expect(jwt.verify(response.body.data.token, 'test-secret')).toMatchObject({ id: user.id, email: user.email });
});
it('rejects expired tokens', async () => {
  const token = jwt.sign({ id: '672a11112222333344445555', email: 'a@example.com' }, 'test-secret', { expiresIn: -1 });
  expect((await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`)).status).toBe(401);
});
