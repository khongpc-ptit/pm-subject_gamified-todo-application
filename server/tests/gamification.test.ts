import { api, describeWithMongo, registerFixture, useSprint2Database } from './sprint2Fixture';

const base = '/api/v1/tasks';

describeWithMongo('Sprint 2 gamification workflows', () => {
  useSprint2Database();

  it('awards 10, 20 and 30 XP by priority and flags the exact Level 2 threshold', async () => {
    const { token } = await registerFixture();
    const awards = [
      { priority: 'LOW', xp: 10 },
      { priority: 'MEDIUM', xp: 20 },
      { priority: 'HIGH', xp: 30 },
      { priority: 'HIGH', xp: 30 },
      { priority: 'LOW', xp: 10 }
    ];
    let total = 0;
    for (const { priority, xp } of awards) {
      const task = (await api.post(base).auth(token, { type: 'bearer' })
        .send({ title: 'Task at ' + total, priority }).expect(201)).body.data;
      total += xp;
      const completed = (await api.patch(base + '/' + task._id + '/complete')
        .auth(token, { type: 'bearer' }).expect(200)).body.data;
      expect(completed).toMatchObject({
        xp_earned: xp, total_xp: total, current_level: total === 100 ? 2 : 1,
        level_up: total === 100, next_level_xp: total === 100 ? 400 : 100
      });
    }
  });

  it('clamps XP at 200 and subtracts only the amount awarded when undone', async () => {
    const { token } = await registerFixture();
    const createAndComplete = async () => {
      const created = (await api.post(base).auth(token, { type: 'bearer' })
        .send({ title: 'High priority task', priority: 'HIGH' }).expect(201)).body.data;
      return (await api.patch(base + '/' + created._id + '/complete')
        .auth(token, { type: 'bearer' }).expect(200)).body.data;
    };
    for (let count = 0; count < 6; count++) {
      const task = await createAndComplete();
      expect(task).toMatchObject({ xp_earned: 30, total_xp: (count + 1) * 30 });
    }
    const partial = await createAndComplete();
    expect(partial).toMatchObject({ xp_earned: 20, total_xp: 200, is_cap_reached: true });
    const capped = await createAndComplete();
    expect(capped).toMatchObject({ xp_earned: 0, total_xp: 200, is_cap_reached: true });
    const undo = (id: string) => api.put(base + '/' + id).auth(token, { type: 'bearer' }).send({ status: 'TODO' });
    const totalXP = async () => (await api.get('/api/v1/auth/me').auth(token, { type: 'bearer' }).expect(200)).body.data.total_xp;
    await undo(capped._id).expect(200);
    expect(await totalXP()).toBe(200);
    await undo(partial._id).expect(200);
    expect(await totalXP()).toBe(180);
    await undo(partial._id).expect(200);
    expect(await totalXP()).toBe(180);
  });
});
