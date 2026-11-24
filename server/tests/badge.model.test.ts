import mongoose from 'mongoose';
import { Badge } from '../src/models/Badge';
import { UserBadge } from '../src/models/UserBadge';
import { Notification } from '../src/models/Notification';
import { INITIAL_BADGES } from '../src/scripts/seedBadges';

describe('Badge, UserBadge & Notification Models Validation [TECH-S3-01]', () => {
  const validUserId = new mongoose.Types.ObjectId();
  const validBadgeId = new mongoose.Types.ObjectId();

  // =========================================================================
  // 1. Badge Model Tests
  // =========================================================================
  describe('1. Badge Model Schema & Validation', () => {
    it('should validate a valid badge document', () => {
      const badge = new Badge({
        code: 'FIRST_TASK',
        title: 'Khởi đầu nan',
        description: 'Hoàn thành công việc đầu tiên trong ứng dụng',
        icon_url: '/icons/badges/first-task.webp',
        condition_type: 'TASK_COUNT',
        condition_value: 1
      });

      const err = badge.validateSync();
      expect(err).toBeUndefined();
      expect(badge.code).toBe('FIRST_TASK');
      expect(badge.title).toBe('Khởi đầu nan');
      expect(badge.condition_type).toBe('TASK_COUNT');
      expect(badge.condition_value).toBe(1);
    });

    it('should fail validation when required fields are missing', () => {
      const emptyBadge = new Badge({});
      const err = emptyBadge.validateSync();

      expect(err).toBeDefined();
      expect(err?.errors['code']).toBeDefined();
      expect(err?.errors['title']).toBeDefined();
      expect(err?.errors['description']).toBeDefined();
      expect(err?.errors['icon_url']).toBeDefined();
      expect(err?.errors['condition_type']).toBeDefined();
      expect(err?.errors['condition_value']).toBeDefined();
    });

    it('should uppercase and trim code', () => {
      const badge = new Badge({
        code: '  streak_7  ',
        title: 'Bậc thầy kỷ luật',
        description: 'Duy trì 7 ngày liên tục',
        icon_url: '/icons/badges/streak-7.webp',
        condition_type: 'STREAK_DAYS',
        condition_value: 7
      });

      expect(badge.code).toBe('STREAK_7');
    });

    it('should accept valid condition_type enum values', () => {
      const types = ['TASK_COUNT', 'STREAK_DAYS', 'LEVEL_REACH'] as const;

      types.forEach(type => {
        const badge = new Badge({
          code: `BADGE_${type}`,
          title: `Tiêu đề ${type}`,
          description: `Mô tả ${type}`,
          icon_url: '/icons/badge.webp',
          condition_type: type,
          condition_value: 5
        });
        expect(badge.validateSync()).toBeUndefined();
      });
    });

    it('should reject invalid condition_type enum', () => {
      const badge = new Badge({
        code: 'INVALID_TYPE',
        title: 'Huy hiệu lỗi',
        description: 'Loại điều kiện không tồn tại',
        icon_url: '/icons/invalid.webp',
        // @ts-ignore
        condition_type: 'RANDOM_TYPE',
        condition_value: 5
      });

      const err = badge.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors['condition_type']).toBeDefined();
    });

    it('should reject condition_value less than 1', () => {
      const badge = new Badge({
        code: 'ZERO_VALUE',
        title: 'Huy hiệu 0',
        description: 'Giá trị ngưỡng bằng 0',
        icon_url: '/icons/zero.webp',
        condition_type: 'TASK_COUNT',
        condition_value: 0
      });

      const err = badge.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors['condition_value']).toBeDefined();
    });

    it('should reject string exceeding maxlength bounds', () => {
      const longTitle = 'A'.repeat(101);
      const longDesc = 'B'.repeat(501);

      const badge = new Badge({
        code: 'LONG_FIELDS',
        title: longTitle,
        description: longDesc,
        icon_url: '/icons/test.webp',
        condition_type: 'TASK_COUNT',
        condition_value: 1
      });

      const err = badge.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors['title']).toBeDefined();
      expect(err?.errors['description']).toBeDefined();
    });
  });

  // =========================================================================
  // 2. UserBadge Model Tests
  // =========================================================================
  describe('2. UserBadge Model Schema & Validation', () => {
    it('should validate a valid user badge document with default unlocked_at', () => {
      const userBadge = new UserBadge({
        user_id: validUserId,
        badge_id: validBadgeId
      });

      const err = userBadge.validateSync();
      expect(err).toBeUndefined();
      expect(userBadge.user_id).toEqual(validUserId);
      expect(userBadge.badge_id).toEqual(validBadgeId);
      expect(userBadge.unlocked_at).toBeInstanceOf(Date);
    });

    it('should fail validation when user_id or badge_id is missing', () => {
      const missingUserId = new UserBadge({ badge_id: validBadgeId });
      expect(missingUserId.validateSync()?.errors['user_id']).toBeDefined();

      const missingBadgeId = new UserBadge({ user_id: validUserId });
      expect(missingBadgeId.validateSync()?.errors['badge_id']).toBeDefined();
    });

    it('should have a unique compound index on user_id and badge_id', () => {
      const indexes = UserBadge.schema.indexes();
      const uniqueCompoundIndex = indexes.find(idx => {
        const fields = idx[0];
        const options = idx[1];
        return fields.user_id === 1 && fields.badge_id === 1 && options?.unique === true;
      });

      expect(uniqueCompoundIndex).toBeDefined();
    });
  });

  // =========================================================================
  // 3. Notification Model Tests
  // =========================================================================
  describe('3. Notification Model Schema & Validation', () => {
    it('should validate a valid notification with default values', () => {
      const notification = new Notification({
        user_id: validUserId,
        title: 'Chúc mừng bạn!',
        message: 'Bạn vừa hoàn thành xuất sắc mục tiêu ngày hôm nay.'
      });

      const err = notification.validateSync();
      expect(err).toBeUndefined();
      expect(notification.type).toBe('REMINDER');
      expect(notification.is_read).toBe(false);
      expect(notification.created_at).toBeInstanceOf(Date);
    });

    it('should fail validation when required fields are missing', () => {
      const emptyNotification = new Notification({});
      const err = emptyNotification.validateSync();

      expect(err).toBeDefined();
      expect(err?.errors['user_id']).toBeDefined();
      expect(err?.errors['title']).toBeDefined();
      expect(err?.errors['message']).toBeDefined();
    });

    it('should accept valid notification types', () => {
      const validTypes = ['REMINDER', 'ACHIEVEMENT', 'SYSTEM'] as const;

      validTypes.forEach(type => {
        const notif = new Notification({
          user_id: validUserId,
          title: `Thông báo ${type}`,
          message: `Nội dung ${type}`,
          type
        });
        expect(notif.validateSync()).toBeUndefined();
        expect(notif.type).toBe(type);
      });
    });

    it('should reject invalid notification type', () => {
      const notif = new Notification({
        user_id: validUserId,
        title: 'Thông báo',
        message: 'Nội dung',
        // @ts-ignore
        type: 'PROMOTION'
      });

      const err = notif.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors['type']).toBeDefined();
    });

    it('should have compound indexes for optimal querying', () => {
      const indexes = Notification.schema.indexes();

      const userUnreadIndex = indexes.find(idx => {
        const fields = idx[0];
        return fields.user_id === 1 && fields.is_read === 1;
      });
      expect(userUnreadIndex).toBeDefined();

      const userRecentIndex = indexes.find(idx => {
        const fields = idx[0];
        return fields.user_id === 1 && fields.created_at === -1;
      });
      expect(userRecentIndex).toBeDefined();
    });
  });

  // =========================================================================
  // 4. Initial Badges Seed Data Tests
  // =========================================================================
  describe('4. Initial Badges Seed Data Integrity', () => {
    it('should define exactly 10 initial badges', () => {
      expect(INITIAL_BADGES.length).toBe(10);
    });

    it('should have unique codes for all badges', () => {
      const codes = INITIAL_BADGES.map(b => b.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should cover all 3 condition types', () => {
      const conditionTypes = new Set(INITIAL_BADGES.map(b => b.condition_type));
      expect(conditionTypes.has('TASK_COUNT')).toBe(true);
      expect(conditionTypes.has('STREAK_DAYS')).toBe(true);
      expect(conditionTypes.has('LEVEL_REACH')).toBe(true);
    });

    it('should have valid format for every seed badge item', () => {
      INITIAL_BADGES.forEach(badge => {
        expect(badge.code).toBeTruthy();
        expect(badge.title).toBeTruthy();
        expect(badge.description).toBeTruthy();
        expect(badge.icon_url).toMatch(/\.webp$/);
        expect(badge.condition_value).toBeGreaterThanOrEqual(1);

        const modelInstance = new Badge(badge);
        expect(modelInstance.validateSync()).toBeUndefined();
      });
    });
  });
});
