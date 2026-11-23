import mongoose from 'mongoose';
import { Habit } from '../src/models/Habit';

describe('Habit Model Validation & Schema Tests [TECH-S2-01]', () => {
  const validUserId = new mongoose.Types.ObjectId();

  it('should validate a valid habit document with default values', () => {
    const habit = new Habit({
      user_id: validUserId,
      title: 'Đọc sách 30 phút mỗi ngày'
    });

    const err = habit.validateSync();
    expect(err).toBeUndefined();
    expect(habit.frequency).toBe('DAILY');
    expect(habit.target_days).toBe(7);
    expect(habit.current_streak).toBe(0);
    expect(habit.is_active).toBe(true);
    expect(habit.logs).toEqual([]);
  });

  it('should fail validation if user_id is missing', () => {
    const habit = new Habit({
      title: 'Tập gym 45 phút'
    });

    const err = habit.validateSync();
    expect(err).toBeDefined();
    expect(err?.errors['user_id']).toBeDefined();
  });

  it('should fail validation if title is missing', () => {
    const habit = new Habit({
      user_id: validUserId
    });

    const err = habit.validateSync();
    expect(err).toBeDefined();
    expect(err?.errors['title']).toBeDefined();
  });

  it('should fail validation if title exceeds 200 characters', () => {
    const longTitle = 'A'.repeat(201);
    const habit = new Habit({
      user_id: validUserId,
      title: longTitle
    });

    const err = habit.validateSync();
    expect(err).toBeDefined();
    expect(err?.errors['title']).toBeDefined();
  });

  it('should trim whitespace from title', () => {
    const habit = new Habit({
      user_id: validUserId,
      title: '   Uống đủ 2L nước   '
    });

    expect(habit.title).toBe('Uống đủ 2L nước');
  });

  it('should only accept valid frequency enum values', () => {
    const validDaily = new Habit({
      user_id: validUserId,
      title: 'Thiền định',
      frequency: 'DAILY'
    });
    expect(validDaily.validateSync()).toBeUndefined();

    const validWeekly = new Habit({
      user_id: validUserId,
      title: 'Chạy bộ cuối tuần',
      frequency: 'WEEKLY'
    });
    expect(validWeekly.validateSync()).toBeUndefined();

    const invalidFrequency = new Habit({
      user_id: validUserId,
      title: 'Đi bơi',
      // @ts-ignore
      frequency: 'MONTHLY'
    });
    const err = invalidFrequency.validateSync();
    expect(err).toBeDefined();
    expect(err?.errors['frequency']).toBeDefined();
  });

  it('should validate target_days range between 1 and 7', () => {
    const habitMin = new Habit({
      user_id: validUserId,
      title: 'Viết nhật ký',
      target_days: 1
    });
    expect(habitMin.validateSync()).toBeUndefined();

    const habitMax = new Habit({
      user_id: validUserId,
      title: 'Viết nhật ký',
      target_days: 7
    });
    expect(habitMax.validateSync()).toBeUndefined();

    const habitUnder = new Habit({
      user_id: validUserId,
      title: 'Viết nhật ký',
      target_days: 0
    });
    expect(habitUnder.validateSync()?.errors['target_days']).toBeDefined();

    const habitOver = new Habit({
      user_id: validUserId,
      title: 'Viết nhật ký',
      target_days: 8
    });
    expect(habitOver.validateSync()?.errors['target_days']).toBeDefined();
  });

  it('should validate embedded logs schema', () => {
    const habit = new Habit({
      user_id: validUserId,
      title: 'Học tiếng Anh',
      logs: [
        {
          log_date: '2026-11-20',
          is_completed: true,
          xp_earned: 15
        }
      ]
    });

    const err = habit.validateSync();
    expect(err).toBeUndefined();
    expect(habit.logs.length).toBe(1);
    expect(habit.logs[0].log_date).toBe('2026-11-20');
    expect(habit.logs[0].is_completed).toBe(true);
    expect(habit.logs[0].xp_earned).toBe(15);
  });

  it('should reject invalid log_date format in embedded logs', () => {
    const habit = new Habit({
      user_id: validUserId,
      title: 'Học tiếng Anh',
      logs: [
        {
          log_date: '20-11-2026', // Sai định dạng YYYY-MM-DD
          is_completed: true,
          xp_earned: 15
        }
      ]
    });

    const err = habit.validateSync();
    expect(err).toBeDefined();
    expect(err?.errors['logs.0.log_date']).toBeDefined();
  });

  it('should have compound index on user_id and is_active', () => {
    const indexes = Habit.schema.indexes();
    const compoundIndex = indexes.find(idx => {
      const fields = idx[0];
      return fields.user_id === 1 && fields.is_active === 1;
    });

    expect(compoundIndex).toBeDefined();
  });
});
