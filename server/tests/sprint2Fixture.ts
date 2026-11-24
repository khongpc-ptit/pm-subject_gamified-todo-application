import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app';
import { Habit } from '../src/models/Habit';
import { Task } from '../src/models/Task';
import { User } from '../src/models/User';

const mongoUri = process.env.TEST_MONGODB_URI;
export const describeWithMongo = mongoUri ? describe : describe.skip;
export const api = request(app);

export function useSprint2Database() {
  beforeAll(async () => {
    process.env.JWT_SECRET = randomUUID();
    await mongoose.connect(mongoUri!, {
      dbName: 'questline_sprint2_test_' + randomUUID().replace(/-/g, ''),
      serverSelectionTimeoutMS: 5000
    });
    await Promise.all([User.init(), Habit.init(), Task.init()]);
  }, 20000);

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    } finally {
      await mongoose.disconnect();
    }
  });
}

export async function registerFixture() {
  const email = randomUUID() + '@example.test';
  const { body } = await api.post('/api/v1/auth/register')
    .send({ email, password: 'fixture-password', full_name: 'Sprint Two Fixture' })
    .expect(201);
  return body.data as { token: string; user: { _id: string } };
}
