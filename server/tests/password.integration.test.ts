import { createHash, randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { SMTPServer } from 'smtp-server';
import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/models/User';

const mongoUri = process.env.TEST_MONGODB_URI;
const describeWithMongo = mongoUri ? describe : describe.skip;
const api = request(app);
const base = '/api/v1/auth';
const password = 'fixture-password';

describeWithMongo('Password reset with MongoDB and SMTP', () => {
  const messages: { recipient: string; raw: string }[] = [];
  let rejectMail = false;
  let smtp: SMTPServer | undefined;

  beforeAll(async () => {
    process.env.JWT_SECRET = randomUUID();
    process.env.CLIENT_URL = 'http://localhost:3000';
    process.env.SMTP_HOST = '127.0.0.1';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_FROM = 'questline@example.test';
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    await mongoose.connect(mongoUri!, {
      dbName: 'questline_auth_test_' + randomUUID().replace(/-/g, ''),
      serverSelectionTimeoutMS: 5000
    });
    await User.init();

    const receiver = new SMTPServer({
      disabledCommands: ['AUTH', 'STARTTLS'],
      onData(stream, session, callback) {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.once('error', callback);
        stream.once('end', () => {
          if (rejectMail) {
            callback(new Error('Fixture mailbox unavailable'));
            return;
          }
          messages.push({
            recipient: session.envelope.rcptTo[0].address,
            raw: Buffer.concat(chunks).toString('utf8')
          });
          callback();
        });
      }
    });
    smtp = receiver;
    await new Promise<void>((resolve, reject) => {
      receiver.once('error', reject);
      receiver.listen(0, '127.0.0.1', resolve);
    });
    const address = receiver.server.address();
    if (!address || typeof address === 'string') throw new Error('No SMTP listener address');
    process.env.SMTP_PORT = String(address.port);
  }, 20000);

  afterAll(async () => {
    try {
      if (smtp) await new Promise<void>(resolve => smtp!.close(resolve));
      if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    } finally {
      await mongoose.disconnect();
    }
  });

  const register = (email: string) =>
    api.post(base + '/register').send({ email, password, full_name: 'Test Account' });
  const login = (email: string, value: string) =>
    api.post(base + '/login').send({ email, password: value });
  const forgot = (email: string) => api.post(base + '/forgot-password').send({ email });
  const reset = (token: string, value: string) =>
    api.post(base + '/reset-password').send({ token, password: value });
  const resetFields = (email: string) =>
    User.findOne({ email }).select('+reset_password_hash +reset_password_expires').orFail();
  const mailedToken = (email: string) => {
    const message = messages.at(-1)!;
    expect(message.recipient).toBe(email);
    const decoded = message.raw.replace(/=\r?\n/g, '').replace(/=3D/g, '=');
    const link = decoded.match(/http:\/\/localhost:3000\/reset-password\?token=[a-f0-9]{64}/)?.[0];
    expect(link).toBeDefined();
    return new URL(link!).searchParams.get('token')!;
  };

  it('delivers a private reset link and consumes it exactly once under concurrent requests', async () => {
    const email = 'reset@example.test';
    await register(email).expect(201);
    const before = messages.length;
    const unknown = await forgot('missing@example.test').expect(200);
    expect(messages).toHaveLength(before);
    const started = Date.now();
    const known = await forgot('  RESET@example.test ').expect(200);
    expect(known.body.message).toBe(unknown.body.message);
    expect(known.body.data).toEqual(unknown.body.data);
    expect(messages).toHaveLength(before + 1);

    const token = mailedToken(email);
    expect(JSON.stringify(known.body)).not.toContain(token);
    const stored = await resetFields(email);
    expect(stored.reset_password_hash).toBe(createHash('sha256').update(token).digest('hex'));
    expect(stored.reset_password_expires!.getTime()).toBeGreaterThanOrEqual(started + 15 * 60_000);
    expect(stored.reset_password_expires!.getTime()).toBeLessThanOrEqual(Date.now() + 15 * 60_000);

    const loginData = (await login(email, password).expect(200)).body.data;
    const profile = (await api.get(base + '/me').auth(loginData.token, { type: 'bearer' }).expect(200)).body.data;
    for (const data of [loginData.user, profile]) {
      expect(data).not.toHaveProperty('reset_password_hash');
      expect(data).not.toHaveProperty('reset_password_expires');
      expect(data).not.toHaveProperty('password_hash');
    }

    await reset(token, 'short').expect(400);
    await reset(token, 'x'.repeat(73)).expect(400);
    const results = await Promise.all([reset(token, 'first-new-password'), reset(token, 'second-new-password')]);
    expect(results.map(response => response.status).sort()).toEqual([200, 400]);
    const winner = results[0].status === 200 ? 'first-new-password' : 'second-new-password';
    const loser = results[0].status === 200 ? 'second-new-password' : 'first-new-password';
    await login(email, winner).expect(200);
    await login(email, loser).expect(401);
    await login(email, password).expect(401);
    await reset(token, 'another-password').expect(400);
    const updated = await resetFields(email);
    expect(updated.reset_password_hash).toBeUndefined();
    expect(updated.reset_password_expires).toBeUndefined();
  });

  it('rejects rotated and expired links and leaves the original password intact', async () => {
    const email = 'expired@example.test';
    await register(email).expect(201);
    await forgot(email).expect(200);
    const previous = mailedToken(email);
    await forgot(email).expect(200);
    const current = mailedToken(email);
    expect(current).not.toBe(previous);
    await reset(previous, 'new-password').expect(400);
    await User.updateOne({ email }, { reset_password_expires: new Date(0) });
    const response = await reset(current, 'new-password').expect(400);
    expect(response.body.error.code).toBe('INVALID_RESET_TOKEN');
    await login(email, password).expect(200);
  });

  it('cleans up a token after SMTP rejects delivery', async () => {
    const email = 'undelivered@example.test';
    await register(email).expect(201);
    rejectMail = true;
    try {
      await forgot(email).expect(500);
    } finally {
      rejectMail = false;
    }
    const stored = await resetFields(email);
    expect(stored.reset_password_hash).toBeUndefined();
    expect(stored.reset_password_expires).toBeUndefined();
    await login(email, password).expect(200);
  });
});
