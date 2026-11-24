import mongoose from 'mongoose';
import { User } from '../src/models/User';
import {
  levelService,
  LevelService
} from '../src/services/level.service';
import {
  calculateLevel,
  calculateRequiredXP,
  calculateNextLevelXP,
  calculateProgressPercent,
  getLevelTitle,
  checkLevelProgression,
  LEVEL_TITLES
} from '../src/utils/gamificationUtils';

describe('[US-S2-05 / TECH-S2-05] Level Progression Service & Formula', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Công thức tính cấp độ chuẩn: Level = floor(sqrt(Total_XP) / 10) + 1', () => {
    it('trả về Level 1 cho các giá trị khởi điểm và biên dưới (0 XP - 99 XP)', () => {
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(1)).toBe(1);
      expect(calculateLevel(50)).toBe(1);
      expect(calculateLevel(99)).toBe(1); // 99 XP vẫn là Level 1
    });

    it('trả về Level 2 chính xác tại mốc biên 100 XP và biên trên 399 XP', () => {
      expect(calculateLevel(100)).toBe(2); // 100 XP thăng lên Level 2
      expect(calculateLevel(101)).toBe(2);
      expect(calculateLevel(250)).toBe(2);
      expect(calculateLevel(399)).toBe(2); // 399 XP vẫn là Level 2
    });

    it('trả về Level 3 chính xác tại mốc biên 400 XP và biên trên 899 XP', () => {
      expect(calculateLevel(400)).toBe(3); // 400 XP thăng lên Level 3
      expect(calculateLevel(500)).toBe(3);
      expect(calculateLevel(899)).toBe(3); // 899 XP vẫn là Level 3
    });

    it('trả về Level 4 chính xác tại mốc biên 900 XP và biên trên 1599 XP', () => {
      expect(calculateLevel(900)).toBe(4); // 900 XP thăng lên Level 4
      expect(calculateLevel(1200)).toBe(4);
      expect(calculateLevel(1599)).toBe(4); // 1599 XP vẫn là Level 4
    });

    it('trả về Level 5 chính xác tại mốc biên 1600 XP và biên trên 2499 XP', () => {
      expect(calculateLevel(1600)).toBe(5); // 1600 XP thăng lên Level 5
      expect(calculateLevel(2000)).toBe(5);
      expect(calculateLevel(2499)).toBe(5); // 2499 XP vẫn là Level 5
    });

    it('trả về Level 6 tại mốc biên 2500 XP và Level 7 tại 3600 XP', () => {
      expect(calculateLevel(2500)).toBe(6);
      expect(calculateLevel(3599)).toBe(6);
      expect(calculateLevel(3600)).toBe(7);
      expect(calculateLevel(10000)).toBe(11); // 10000 XP -> sqrt(10000)/10 + 1 = 11
    });

    it('xử lý an toàn các giá trị biên bất thường (âm, null, undefined, NaN)', () => {
      expect(calculateLevel(-50)).toBe(1);
      expect(calculateLevel(-1)).toBe(1);
      expect(calculateLevel(NaN)).toBe(1);
      expect(calculateLevel(null as any)).toBe(1);
      expect(calculateLevel(undefined as any)).toBe(1);
      expect(calculateLevel('abc' as any)).toBe(1);
    });

    it('xử lý an toàn số thực (decimal Total_XP)', () => {
      expect(calculateLevel(99.99)).toBe(1);
      expect(calculateLevel(100.5)).toBe(2);
      expect(calculateLevel(399.99)).toBe(2);
      expect(calculateLevel(400.01)).toBe(3);
    });
  });

  describe('2. Công thức tính điểm kinh nghiệm ngưỡng để lên cấp: Required_XP(L) = (10 * (L - 1))^2', () => {
    it('trả về 0 XP cho Level 1 và các giá trị level <= 1', () => {
      expect(calculateRequiredXP(1)).toBe(0);
      expect(calculateRequiredXP(0)).toBe(0);
      expect(calculateRequiredXP(-2)).toBe(0);
      expect(calculateRequiredXP(NaN)).toBe(0);
    });

    it('tính toán chính xác Required_XP cho các mốc Level', () => {
      expect(calculateRequiredXP(2)).toBe(100);   // (10 * 1)^2 = 100
      expect(calculateRequiredXP(3)).toBe(400);   // (10 * 2)^2 = 400
      expect(calculateRequiredXP(4)).toBe(900);   // (10 * 3)^2 = 900
      expect(calculateRequiredXP(5)).toBe(1600);  // (10 * 4)^2 = 1600
      expect(calculateRequiredXP(6)).toBe(2500);  // (10 * 5)^2 = 2500
      expect(calculateRequiredXP(7)).toBe(3600);  // (10 * 6)^2 = 3600
    });
  });

  describe('3. Công thức tính điểm kinh nghiệm cần để đạt cấp kế tiếp: Next_Level_XP(L) = (10 * L)^2', () => {
    it('trả về 100 XP cho Level 1 hoặc level < 1', () => {
      expect(calculateNextLevelXP(1)).toBe(100);
      expect(calculateNextLevelXP(0)).toBe(100);
      expect(calculateNextLevelXP(-5)).toBe(100);
      expect(calculateNextLevelXP(NaN)).toBe(100);
    });

    it('tính toán chính xác Next_Level_XP cho các mốc Level', () => {
      expect(calculateNextLevelXP(2)).toBe(400);   // (10 * 2)^2 = 400
      expect(calculateNextLevelXP(3)).toBe(900);   // (10 * 3)^2 = 900
      expect(calculateNextLevelXP(4)).toBe(1600);  // (10 * 4)^2 = 1600
      expect(calculateNextLevelXP(5)).toBe(2500);  // (10 * 5)^2 = 2500
      expect(calculateNextLevelXP(6)).toBe(3600);  // (10 * 6)^2 = 3600
    });
  });

  describe('4. Tính toán tỷ lệ phần trăm tiến trình trong cấp hiện tại: Progress_Percent', () => {
    it('tính 0% khi vừa đạt mốc cấp độ mới', () => {
      expect(calculateProgressPercent(0, 1)).toBe(0);
      expect(calculateProgressPercent(100, 2)).toBe(0);
      expect(calculateProgressPercent(400, 3)).toBe(0);
    });

    it('tính chính xác tỷ lệ phần trăm tiến trình ở Level 1 (dải 0 - 100 XP)', () => {
      expect(calculateProgressPercent(25, 1)).toBe(25);
      expect(calculateProgressPercent(50, 1)).toBe(50);
      expect(calculateProgressPercent(75, 1)).toBe(75);
      expect(calculateProgressPercent(99, 1)).toBe(99);
    });

    it('tính chính xác tỷ lệ phần trăm tiến trình ở Level 2 (dải 100 - 400 XP, range 300)', () => {
      // (250 - 100) / 300 = 150 / 300 = 50%
      expect(calculateProgressPercent(250, 2)).toBe(50);
      // (175 - 100) / 300 = 75 / 300 = 25%
      expect(calculateProgressPercent(175, 2)).toBe(25);
      // (325 - 100) / 300 = 225 / 300 = 75%
      expect(calculateProgressPercent(325, 2)).toBe(75);
      // (399 - 100) / 300 = 299 / 300 = 99.67%
      expect(calculateProgressPercent(399, 2)).toBe(99.67);
    });

    it('tự động xác định level khi không truyền tham số level', () => {
      expect(calculateProgressPercent(50)).toBe(50);
      expect(calculateProgressPercent(250)).toBe(50);
    });

    it('chống lỗi chia cho 0 và clamp trong phạm vi [0, 100]', () => {
      expect(calculateProgressPercent(-10)).toBe(0);
      expect(calculateProgressPercent(0)).toBe(0);
      // Giả lập vượt range
      expect(calculateProgressPercent(500, 2)).toBe(100);
    });
  });

  describe('5. Danh hiệu cấp bậc (Level Titles)', () => {
    it('trả về danh hiệu chính xác theo từng cấp bậc', () => {
      expect(getLevelTitle(1)).toEqual({ level: 1, title: 'Tập sự', title_en: 'Novice' });
      expect(getLevelTitle(2)).toEqual({ level: 2, title: 'Chiến binh', title_en: 'Warrior' });
      expect(getLevelTitle(3)).toEqual({ level: 3, title: 'Tinh anh', title_en: 'Elite' });
      expect(getLevelTitle(4)).toEqual({ level: 4, title: 'Cao thủ', title_en: 'Master' });
      expect(getLevelTitle(5)).toEqual({ level: 5, title: 'Chuyên gia', title_en: 'Expert' });
      expect(getLevelTitle(6)).toEqual({ level: 6, title: 'Huyền thoại', title_en: 'Legendary' });
      expect(getLevelTitle(10)).toEqual({ level: 10, title: 'Huyền thoại', title_en: 'Legendary' });
    });

    it('levelService.getLevelTitle trả về tên tiếng Việt', () => {
      expect(levelService.getLevelTitle(1)).toBe('Tập sự');
      expect(levelService.getLevelTitle(2)).toBe('Chiến binh');
      expect(levelService.getLevelTitle(5)).toBe('Chuyên gia');
      expect(levelService.getLevelTitle(7)).toBe('Huyền thoại');
    });
  });

  describe('6. Kiểm tra thăng cấp tự động (checkLevelProgression & checkLevelUp)', () => {
    it('trả về level_up = false khi điểm kinh nghiệm tăng nhưng chưa qua ngưỡng cấp mới', () => {
      const result = checkLevelProgression(1, 80);
      expect(result.level_up).toBe(false);
      expect(result.old_level).toBe(1);
      expect(result.new_level).toBe(1);
      expect(result.current_level).toBe(1);
      expect(result.total_xp).toBe(80);
      expect(result.required_xp).toBe(0);
      expect(result.next_level_xp).toBe(100);
      expect(result.progress_percent).toBe(80);
      expect(result.title).toBe('Tập sự');
    });

    it('trả về level_up = true khi điểm kinh nghiệm vượt qua ngưỡng cấp mới (100 XP)', () => {
      const result = levelService.checkLevelUp(1, 100);
      expect(result.level_up).toBe(true);
      expect(result.old_level).toBe(1);
      expect(result.new_level).toBe(2);
      expect(result.current_level).toBe(2);
      expect(result.total_xp).toBe(100);
      expect(result.required_xp).toBe(100);
      expect(result.next_level_xp).toBe(400);
      expect(result.progress_percent).toBe(0);
      expect(result.title).toBe('Chiến binh');
    });

    it('hỗ trợ trường hợp thăng nhiều cấp cùng lúc (multi-level jump)', () => {
      // Từ 0 XP (Level 1) cộng 500 XP -> Level 3 (400 - 899 XP)
      const result = levelService.checkLevelUp(1, 500);
      expect(result.level_up).toBe(true);
      expect(result.old_level).toBe(1);
      expect(result.new_level).toBe(3);
      expect(result.current_level).toBe(3);
      expect(result.total_xp).toBe(500);
      expect(result.required_xp).toBe(400);
      expect(result.next_level_xp).toBe(900);
      // (500 - 400) / (900 - 400) = 100 / 500 = 20%
      expect(result.progress_percent).toBe(20);
      expect(result.title).toBe('Tinh anh');
    });

    it('trả về level_up = false khi điểm kinh nghiệm giảm do revert XP', () => {
      const result = levelService.checkLevelUp(2, 50);
      expect(result.level_up).toBe(false);
      expect(result.old_level).toBe(2);
      expect(result.new_level).toBe(1);
      expect(result.total_xp).toBe(50);
      expect(result.progress_percent).toBe(50);
    });
  });

  describe('7. Tích hợp LevelService với User model & Database queries', () => {
    it('processXPAddition cập nhật user.total_xp và thăng cấp thành công', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        total_xp: 80,
        current_level: 1,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser as any);

      const result = await levelService.processXPAddition(mockUser._id.toString(), 30);

      expect(mockUser.total_xp).toBe(110);
      expect(mockUser.current_level).toBe(2);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.level_up).toBe(true);
      expect(result.new_level).toBe(2);
      expect(result.title).toBe('Chiến binh');
    });

    it('processXPAddition không thăng cấp nếu chưa đạt ngưỡng', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        total_xp: 20,
        current_level: 1,
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser as any);

      const result = await levelService.processXPAddition(mockUser._id.toString(), 20);

      expect(mockUser.total_xp).toBe(40);
      expect(mockUser.current_level).toBe(1);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.level_up).toBe(false);
      expect(result.new_level).toBe(1);
    });

    it('getUserLevelProgress trả về thông tin chi tiết đầy đủ của user', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        total_xp: 250,
        current_level: 2
      };

      jest.spyOn(User, 'findById').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser)
      } as any);

      const progress = await levelService.getUserLevelProgress(mockUser._id.toString());

      expect(progress.current_level).toBe(2);
      expect(progress.total_xp).toBe(250);
      expect(progress.required_xp).toBe(100);
      expect(progress.next_level_xp).toBe(400);
      expect(progress.current_level_xp).toBe(150); // 250 - 100
      expect(progress.level_xp_range).toBe(300);   // 400 - 100
      expect(progress.progress_percent).toBe(50);  // 150 / 300 * 100
      expect(progress.title).toBe('Chiến binh');
      expect(progress.title_en).toBe('Warrior');
    });
  });
});
