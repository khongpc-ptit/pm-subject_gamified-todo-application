import { api, describeWithMongo, registerFixture, useSprint2Database } from './sprint2Fixture';

const base = '/api/v1/habits';

describeWithMongo('Sprint 2 habit workflows', () => {
  useSprint2Database();

  it('validates creation and limits list and archive operations to the owner', async () => {
    const owner = await registerFixture();
    const other = await registerFixture();
    const create = (title: string) => api.post(base).auth(owner.token, { type: 'bearer' }).send({ title });
    await create('   ').expect(400);
    await create('x'.repeat(201)).expect(400);
    const habit = (await create('Read for ten minutes').expect(201)).body.data;
    expect(habit).toMatchObject({ user_id: owner.user._id, current_streak: 0, logs: [] });
    const list = (token: string) => api.get(base).auth(token, { type: 'bearer' });
    const archive = (token: string) => api.delete(base + '/' + habit._id).auth(token, { type: 'bearer' });
    expect((await list(other.token).expect(200)).body.data.habits).toEqual([]);
    await archive(other.token).expect(403);
    expect((await list(owner.token).expect(200)).body.data.habits).toEqual([expect.objectContaining({ _id: habit._id })]);
    await archive(owner.token).expect(200);
    expect((await list(owner.token).expect(200)).body.data.habits).toEqual([]);
  });

  it('persists one daily check-in and rejects another without changing XP or streak', async () => {
    const owner = await registerFixture();
    const { body } = await api.post(base).auth(owner.token, { type: 'bearer' })
      .send({ title: 'Take a walk' }).expect(201);
    const checkIn = () => api.post(base + '/' + body.data._id + '/check-in').auth(owner.token, { type: 'bearer' });
    const first = (await checkIn().expect(200)).body.data;
    expect(first).toMatchObject({ xp_earned: 15, total_xp: 15, habit: { current_streak: 1 } });
    expect((await checkIn().expect(400)).body.error.code).toBe('HABIT_ALREADY_CHECKED_IN');
    const listed = (await api.get(base).auth(owner.token, { type: 'bearer' }).expect(200)).body.data.habits[0];
    expect(listed).toMatchObject({ current_streak: 1, logs: [expect.objectContaining({ xp_earned: 15 })] });
    const me = (await api.get('/api/v1/auth/me').auth(owner.token, { type: 'bearer' }).expect(200)).body.data;
    expect(me.total_xp).toBe(15);
  });
});
