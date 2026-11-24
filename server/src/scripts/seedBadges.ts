import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Badge } from '../models/Badge';
import { BadgeConditionType } from '../types/badge.types';

dotenv.config();

export interface ISeedBadgeItem {
  code: string;
  title: string;
  description: string;
  icon_url: string;
  condition_type: BadgeConditionType;
  condition_value: number;
}

export const INITIAL_BADGES: ISeedBadgeItem[] = [
  {
    code: 'FIRST_TASK',
    title: 'Khởi đầu nan',
    description: 'Hoàn thành công việc đầu tiên trong ứng dụng',
    icon_url: '/icons/badges/first-task.webp',
    condition_type: 'TASK_COUNT',
    condition_value: 1
  },
  {
    code: 'TASK_10',
    title: 'Tập trung cao độ',
    description: 'Hoàn thành 10 công việc để hình thành thói quen giải quyết việc',
    icon_url: '/icons/badges/task-10.webp',
    condition_type: 'TASK_COUNT',
    condition_value: 10
  },
  {
    code: 'TASK_50',
    title: 'Chiến binh chăm chỉ',
    description: 'Chinh phục cột mốc 50 công việc hoàn thành',
    icon_url: '/icons/badges/task-50.webp',
    condition_type: 'TASK_COUNT',
    condition_value: 50
  },
  {
    code: 'TASK_100',
    title: 'Bậc thầy hoàn thành',
    description: 'Đạt mốc 100 công việc hoàn thành xuất sắc',
    icon_url: '/icons/badges/task-100.webp',
    condition_type: 'TASK_COUNT',
    condition_value: 100
  },
  {
    code: 'STREAK_3',
    title: 'Khởi động chuỗi',
    description: 'Duy trì hoạt động liên tục trong 3 ngày',
    icon_url: '/icons/badges/streak-3.webp',
    condition_type: 'STREAK_DAYS',
    condition_value: 3
  },
  {
    code: 'STREAK_7',
    title: 'Bậc thầy kỷ luật',
    description: 'Duy trì chuỗi Streak 7 ngày liên tục không gián đoạn',
    icon_url: '/icons/badges/streak-7.webp',
    condition_type: 'STREAK_DAYS',
    condition_value: 7
  },
  {
    code: 'STREAK_30',
    title: 'Kỷ luật thép',
    description: 'Duy trì chuỗi Streak 30 ngày bền bỉ đáng kinh ngạc',
    icon_url: '/icons/badges/streak-30.webp',
    condition_type: 'STREAK_DAYS',
    condition_value: 30
  },
  {
    code: 'LEVEL_2',
    title: 'Bước lên nấc thang',
    description: 'Đạt Cấp độ 2 với 100 điểm kinh nghiệm (XP) tích lũy',
    icon_url: '/icons/badges/level-2.webp',
    condition_type: 'LEVEL_REACH',
    condition_value: 2
  },
  {
    code: 'LEVEL_5',
    title: 'Chuyên gia năng suất',
    description: 'Đạt Cấp độ 5 với 1,600 điểm kinh nghiệm (XP) tích lũy',
    icon_url: '/icons/badges/level-5.webp',
    condition_type: 'LEVEL_REACH',
    condition_value: 5
  },
  {
    code: 'LEVEL_10',
    title: 'Huyền thoại năng suất',
    description: 'Đạt Cấp độ 10 đỉnh cao với 8,100 điểm kinh nghiệm (XP)',
    icon_url: '/icons/badges/level-10.webp',
    condition_type: 'LEVEL_REACH',
    condition_value: 10
  }
];

export async function seedBadges(): Promise<{ inserted: number; updated: number; total: number }> {
  let inserted = 0;
  let updated = 0;

  for (const badgeData of INITIAL_BADGES) {
    const existing = await Badge.findOne({ code: badgeData.code });
    if (!existing) {
      await Badge.create(badgeData);
      inserted++;
    } else {
      await Badge.updateOne({ code: badgeData.code }, { $set: badgeData });
      updated++;
    }
  }

  return { inserted, updated, total: INITIAL_BADGES.length };
}

async function run(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gamified-todo';
  console.log(`[SeedBadges] Connecting to MongoDB: ${uri}`);

  try {
    await mongoose.connect(uri);
    console.log('[SeedBadges] Connected successfully.');

    const result = await seedBadges();
    console.log(`[SeedBadges] Completed: ${result.inserted} inserted, ${result.updated} updated (Total: ${result.total} badges).`);

    await mongoose.disconnect();
    console.log('[SeedBadges] Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('[SeedBadges] Error seeding badges:', error);
    process.exit(1);
  }
}

// Chạy trực tiếp nếu file được thực thi bằng CLI
if (require.main === module) {
  run();
}
