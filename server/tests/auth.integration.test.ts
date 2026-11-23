import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/models/User';

const mongoUri = process.env.TEST_MONGODB_URI;
const describeWithMongo = mongoUri ? describe : describe.skip;
const api = request(app);
const base = '/api/v1/auth';
const password = 'fixture-password';

describeWithMongo('Authentication with MongoDB', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = randomUUID();
    await mongoose.connect(mongoUri!, {
      dbName: 'questline_auth_test_' + randomUUID().replace(/-/g, ''),
      serverSelectionTimeoutMS: 5000
    });
    await User.init();
  }, 20000);

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    } finally {
      await mongoose.disconnect();
    }
  });

  const register = (email: string) =>
    api.post(base + '/register').send({ email, password, full_name: 'Test Account' });
  const login = (email: string, value: string) =>
    api.post(base + '/login').send({ email, password: value });

  it('registers and normalizes email, then authenticates a public session', async () => {
    const email = 'session@example.test';
    const created = (await register('  SESSION@example.test ').expect(201)).body.data;
    expect(created.user.email).toBe(email);
    await register(email).expect(409);
    const stored = await User.findOne({ email }).orFail();
    expect(stored.password_hash).not.toBe(password);
    expect(await bcrypt.compare(password, stored.password_hash)).toBe(true);

    const wrong = await login(email, 'wrong-password').expect(401);
    const unknown = await login('unknown@example.test', 'wrong-password').expect(401);
    expect(wrong.body.error).toEqual(unknown.body.error);
    const signedIn = (await login(email, password).expect(200)).body.data;
    const me = (token: string) => api.get(base + '/me').auth(token, { type: 'bearer' });
    const profile = (await me(signedIn.token).expect(200)).body.data;
    for (const user of [created.user, signedIn.user, profile]) {
      expect(user).toMatchObject({ _id: stored.id, email });
      expect(user).not.toHaveProperty('password_hash');
      expect(user).not.toHaveProperty('reset_password_hash');
      expect(user).not.toHaveProperty('reset_password_expires');
    }
    await api.get(base + '/me').expect(401);
    await api.post(base + '/logout').expect(401);
    await api.post(base + '/logout').auth(signedIn.token, { type: 'bearer' }).expect(200);
    const claims = { id: stored.id, email };
    await me(jwt.sign(claims, process.env.JWT_SECRET!, { expiresIn: -1 })).expect(401);
    await me(jwt.sign(claims, 'untrusted-fixture-secret')).expect(401);
  });
});
