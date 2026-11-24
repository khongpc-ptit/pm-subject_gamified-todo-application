import { createHash, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app';
import { User } from '../src/models/User';
import * as emailService from '../src/services/email.service';

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

  const register = (email: string, fullName = 'Test Account', pass = password) =>
    api.post(base + '/register').send({ email, password: pass, full_name: fullName });
  const login = (email: string, value: string) =>
    api.post(base + '/login').send({ email, password: value });
  const me = (token: string) => api.get(base + '/me').auth(token, { type: 'bearer' });
  const updateProfile = (token: string, payload: Record<string, unknown>) =>
    api.put(base + '/profile').auth(token, { type: 'bearer' }).send(payload);

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

  it('verifies profile view, updates with validation, isolates Account A and B, and shields prohibited fields', async () => {
    const emailA = 'alpha@example.test';
    const emailB = 'beta@example.test';

    await register(emailA, 'User Alpha').expect(201);
    await register(emailB, 'User Beta').expect(201);

    const tokenA = (await login(emailA, password).expect(200)).body.data.token;
    const tokenB = (await login(emailB, password).expect(200)).body.data.token;

    // 1. Profile retrieval shows default gamification stats and no sensitive fields
    const resA = (await me(tokenA).expect(200)).body.data;
    expect(resA.email).toBe(emailA);
    expect(resA.full_name).toBe('User Alpha');
    expect(resA.current_level).toBe(1);
    expect(resA.total_xp).toBe(0);
    expect(resA.current_streak).toBe(0);
    expect(resA.streak_freeze_count).toBe(1);
    expect(resA).not.toHaveProperty('password_hash');
    expect(resA).not.toHaveProperty('reset_password_hash');

    // 2. Account A updates valid name and trims whitespace
    const updateRes = await updateProfile(tokenA, { full_name: '  User Alpha Updated  ' }).expect(200);
    expect(updateRes.body.data.full_name).toBe('User Alpha Updated');

    const refreshedA = (await me(tokenA).expect(200)).body.data;
    expect(refreshedA.full_name).toBe('User Alpha Updated');

    // 3. Account B profile remains unchanged (Cross-user isolation)
    const resB = (await me(tokenB).expect(200)).body.data;
    expect(resB.full_name).toBe('User Beta');
    expect(resB.email).toBe(emailB);

    // 4. Input validation: rejects empty, too short (< 2), and too long (> 100) names
    await updateProfile(tokenA, { full_name: '   ' }).expect(400);
    await updateProfile(tokenA, { full_name: 'X' }).expect(400);
    await updateProfile(tokenA, { full_name: 'X'.repeat(101) }).expect(400);

    // Existing record in DB remains intact after failed validation
    const unchangedA = (await me(tokenA).expect(200)).body.data;
    expect(unchangedA.full_name).toBe('User Alpha Updated');

    // 5. Shield prohibited fields: total_xp, current_level, email, password_hash cannot be tampered with
    const tamperRes = (await updateProfile(tokenA, {
      full_name: 'Alpha Shielded',
      total_xp: 99999,
      current_level: 50,
      current_streak: 100,
      streak_freeze_count: 50,
      email: 'hacker@example.test',
      password_hash: '$2b$10$malicioushashhere1234567890'
    }).expect(200)).body.data;

    expect(tamperRes.full_name).toBe('Alpha Shielded');
    expect(tamperRes.total_xp).toBe(0);
    expect(tamperRes.current_level).toBe(1);
    expect(tamperRes.current_streak).toBe(0);
    expect(tamperRes.streak_freeze_count).toBe(1);
    expect(tamperRes.email).toBe(emailA);

    // 6. Unauthorized access blocked without Bearer token
    await api.put(base + '/profile').send({ full_name: 'Anonymous Hacker' }).expect(401);
  });

  it('completes the full end-to-end auth lifecycle: register -> login -> profile -> forgot -> reset -> re-login -> logout', async () => {
    const email = 'lifecycle@example.test';
    const originalPassword = 'Initial-password-123';
    const newPassword = 'New-secure-password-456';

    // 1. Register
    const regRes = await register(email, 'Lifecycle User', originalPassword).expect(201);
    expect(regRes.body.success).toBe(true);

    // 2. Login
    const loginRes = await login(email, originalPassword).expect(200);
    const token = loginRes.body.data.token;

    // 3. Profile view & update
    const profile = (await me(token).expect(200)).body.data;
    expect(profile.email).toBe(email);
    await updateProfile(token, { full_name: 'Lifecycle Renamed' }).expect(200);

    // 4. Capture the token emitted by the email adapter. SMTP is covered separately.
    const delivery = jest.spyOn(emailService, 'sendResetEmail').mockResolvedValue(undefined);
    await api.post(base + '/forgot-password').send({ email }).expect(200);
    expect(delivery).toHaveBeenCalledTimes(1);
    const [recipient, rawResetToken] = delivery.mock.calls[0];
    expect(recipient).toBe(email);
    const userDoc = await User.findOne({ email }).select('+reset_password_hash +reset_password_expires').orFail();
    expect(userDoc.reset_password_hash).toBe(createHash('sha256').update(rawResetToken).digest('hex'));
    expect(userDoc.reset_password_expires!.getTime()).toBeGreaterThan(Date.now());

    // 5. Reset password with new password
    await api.post(base + '/reset-password').send({
      token: rawResetToken,
      password: newPassword
    }).expect(200);

    // 6. Token is single-use: replaying returns 400
    await api.post(base + '/reset-password').send({
      token: rawResetToken,
      password: 'Yet-another-password-789'
    }).expect(400);

    // 7. Old password no longer works
    await login(email, originalPassword).expect(401);

    // 8. New password works
    const newSession = (await login(email, newPassword).expect(200)).body.data;
    expect(newSession.token).toBeDefined();

    // 9. Logout terminates session
    await api.post(base + '/logout').auth(newSession.token, { type: 'bearer' }).expect(200);
  });
});
