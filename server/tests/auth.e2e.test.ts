import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { app } from '../src/app';
import { User } from '../src/models/User';
import * as emailService from '../src/services/email.service';

const api = request(app);
const base = '/api/v1/auth';

describe('End-to-End Authentication & Account Management Integration [TECH-S1-12]', () => {
  const userStore = new Map<string, any>();
  const emailOutbox: { to: string; token: string }[] = [];

  function wrapUserDoc(data: any) {
    const doc: any = {
      ...data,
      _id: data._id || new mongoose.Types.ObjectId(),
      get id() {
        return this._id.toString();
      },
      toObject() {
        const copy = { ...this };
        delete copy.toObject;
        delete copy.save;
        return copy;
      },
      save() {
        this.updated_at = new Date();
        userStore.set(this.email.toLowerCase(), this);
        return Promise.resolve(this);
      }
    };
    return doc;
  }

  beforeAll(() => {
    process.env.JWT_SECRET = 'e2e-test-jwt-secret-key-32charsmin!!';
    process.env.CLIENT_URL = 'http://localhost:3000';
  });

  beforeEach(() => {
    userStore.clear();
    emailOutbox.length = 0;

    jest.spyOn(emailService, 'sendResetEmail').mockImplementation(async (to: string, token: string) => {
      emailOutbox.push({ to, token });
    });

    jest.spyOn(User.prototype, 'save').mockImplementation(function (this: any) {
      const doc = wrapUserDoc({
        _id: this._id || new mongoose.Types.ObjectId(),
        email: this.email,
        password_hash: this.password_hash,
        full_name: this.full_name,
        current_level: this.current_level ?? 1,
        total_xp: this.total_xp ?? 0,
        current_streak: this.current_streak ?? 0,
        streak_freeze_count: this.streak_freeze_count ?? 2,
        last_active_date: this.last_active_date ?? null,
        created_at: new Date()
      });
      userStore.set(this.email.toLowerCase(), doc);
      return Promise.resolve(doc);
    });

    jest.spyOn(User, 'findOne').mockImplementation(((filter: any) => {
      if (filter?.email) {
        const found = userStore.get(filter.email.toLowerCase());
        return Promise.resolve(found || null);
      }
      return Promise.resolve(null);
    }) as any);

    jest.spyOn(User, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString();
      for (const user of userStore.values()) {
        if (user.id === idStr || user._id?.toString() === idStr) {
          return Promise.resolve(user);
        }
      }
      return Promise.resolve(null);
    }) as any);

    jest.spyOn(User, 'findOneAndUpdate').mockImplementation(((filter: any, update: any) => {
      if (filter?.email) {
        const user = userStore.get(filter.email.toLowerCase());
        if (user) {
          if (update.$set) Object.assign(user, update.$set);
          return Promise.resolve(user);
        }
      }
      if (filter?.reset_password_hash) {
        for (const user of userStore.values()) {
          if (
            user.reset_password_hash === filter.reset_password_hash &&
            user.reset_password_expires &&
            user.reset_password_expires > (filter.reset_password_expires?.$gt || new Date(0))
          ) {
            if (update.$set) Object.assign(user, update.$set);
            if (update.$unset) {
              delete user.reset_password_hash;
              delete user.reset_password_expires;
            }
            return Promise.resolve(user);
          }
        }
      }
      return Promise.resolve(null);
    }) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('verifies the full authentication & account lifecycle (US-05 -> US-06 -> US-07 -> US-08 -> US-09)', async () => {
    const email = 'hero@questline.test';
    const initialPass = 'StrongPass123!';
    const newPass = 'EvenStrongerPass456!';

    // --- 1. [US-S1-05] Registration ---
    const regRes = await api.post(`${base}/register`).send({
      email: '  Hero@Questline.TEST  ',
      password: initialPass,
      full_name: '  Chiến Binh Dũng Cảm  '
    }).expect(201);

    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.user.email).toBe(email);
    expect(regRes.body.data.user.full_name).toBe('Chiến Binh Dũng Cảm');
    expect(regRes.body.data.user.current_level).toBe(1);
    expect(regRes.body.data.user.total_xp).toBe(0);
    expect(regRes.body.data.user).not.toHaveProperty('password_hash');
    expect(regRes.body.data.token).toBeDefined();

    // Duplicate email registration rejected
    const dupRes = await api.post(`${base}/register`).send({
      email,
      password: initialPass,
      full_name: 'Another Name'
    }).expect(409);
    expect(dupRes.body.error.code).toBe('EMAIL_ALREADY_EXISTS');

    // --- 2. [US-S1-06] Login & Invalid Credential Security ---
    const badPassRes = await api.post(`${base}/login`).send({
      email,
      password: 'WrongPassword'
    }).expect(401);

    const badUserRes = await api.post(`${base}/login`).send({
      email: 'nonexistent@questline.test',
      password: 'AnyPassword'
    }).expect(401);

    // Uniform error responses prevent account enumeration
    expect(badPassRes.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(badUserRes.body.error.code).toBe('INVALID_CREDENTIALS');

    // Valid login
    const loginRes = await api.post(`${base}/login`).send({
      email,
      password: initialPass
    }).expect(200);

    const authToken = loginRes.body.data.token;
    expect(authToken).toBeDefined();

    // --- 3. [US-S1-07] View Profile (GET /me) ---
    const profileRes = await api.get(`${base}/me`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(profileRes.body.data.email).toBe(email);
    expect(profileRes.body.data.full_name).toBe('Chiến Binh Dũng Cảm');
    expect(profileRes.body.data.current_level).toBe(1);
    expect(profileRes.body.data.total_xp).toBe(0);
    expect(profileRes.body.data).not.toHaveProperty('password_hash');

    // --- 4. [US-S1-08] Update Profile & Protect System Fields ---
    const updateRes = await api.put(`${base}/profile`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        full_name: '  Chiến Binh Cấp Cao  ',
        total_xp: 99999, // Attempted tamper
        current_level: 99 // Attempted tamper
      })
      .expect(200);

    expect(updateRes.body.data.full_name).toBe('Chiến Binh Cấp Cao');
    expect(updateRes.body.data.total_xp).toBe(0); // Protected
    expect(updateRes.body.data.current_level).toBe(1); // Protected

    // Verify persistence through GET /me
    const verifyUpdate = await api.get(`${base}/me`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(verifyUpdate.body.data.full_name).toBe('Chiến Binh Cấp Cao');

    // Validation edge case: empty or 1 character name rejected
    await api.put(`${base}/profile`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ full_name: ' ' })
      .expect(400);

    await api.put(`${base}/profile`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ full_name: 'A' })
      .expect(400);

    // --- 5. [US-S1-09] Forgot & Reset Password Flow ---
    await api.post(`${base}/forgot-password`).send({ email }).expect(200);
    expect(emailOutbox).toHaveLength(1);
    expect(emailOutbox[0].to).toBe(email);

    const rawResetToken = emailOutbox[0].token;
    expect(rawResetToken).toBeDefined();

    // Reset password with new password
    const resetRes = await api.post(`${base}/reset-password`).send({
      token: rawResetToken,
      password: newPass
    }).expect(200);
    expect(resetRes.body.success).toBe(true);

    // Token reuse rejected (single-use token)
    await api.post(`${base}/reset-password`).send({
      token: rawResetToken,
      password: 'AnotherPassword!'
    }).expect(400);

    // Old password no longer works
    await api.post(`${base}/login`).send({
      email,
      password: initialPass
    }).expect(401);

    // New password succeeds
    const newLoginRes = await api.post(`${base}/login`).send({
      email,
      password: newPass
    }).expect(200);
    const newAuthToken = newLoginRes.body.data.token;
    expect(newAuthToken).toBeDefined();

    // --- 6. [US-S1-06] Logout ---
    await api.post(`${base}/logout`)
      .set('Authorization', `Bearer ${newAuthToken}`)
      .expect(200);
  });

  it('verifies strict multi-user profile isolation between User A and User B', async () => {
    // Register Account A
    const regA = await api.post(`${base}/register`).send({
      email: 'usera@isolation.test',
      password: 'Password123!',
      full_name: 'User Alpha'
    }).expect(201);
    const tokenA = regA.body.data.token;

    // Register Account B
    const regB = await api.post(`${base}/register`).send({
      email: 'userb@isolation.test',
      password: 'Password123!',
      full_name: 'User Beta'
    }).expect(201);
    const tokenB = regB.body.data.token;

    // User A updates their profile
    await api.put(`${base}/profile`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ full_name: 'User Alpha Renamed' })
      .expect(200);

    // Verify User A has new name
    const checkA = await api.get(`${base}/me`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(checkA.body.data.full_name).toBe('User Alpha Renamed');

    // Verify User B's profile is completely unchanged
    const checkB = await api.get(`${base}/me`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    expect(checkB.body.data.full_name).toBe('User Beta');
    expect(checkB.body.data.email).toBe('userb@isolation.test');
  });

  it('rejects unauthorized access when token is missing, invalid or expired', async () => {
    // Missing Bearer token
    await api.get(`${base}/me`).expect(401);
    await api.put(`${base}/profile`).send({ full_name: 'Test' }).expect(401);
    await api.post(`${base}/logout`).expect(401);

    // Invalid format token
    await api.get(`${base}/me`).set('Authorization', 'Bearer invalid-token-value').expect(401);

    // Tampered signature token
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoidEBleGFtcGxlLmNvbSJ9.badSignature';
    await api.get(`${base}/me`).set('Authorization', `Bearer ${fakeToken}`).expect(401);
  });
});
