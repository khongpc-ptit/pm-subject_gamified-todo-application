import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from './config/db';
import { startStreakCronJob, stopStreakCronJob } from './cron/streakResetJob';

console.log('[Worker] Khởi tạo Render Background Worker cho Gamified To-Do...');

async function startWorker(): Promise<void> {
  try {
    await connectDB();
    console.log('[Worker] Đã kết nối cơ sở dữ liệu MongoDB thành công.');

    const runImmediately = process.env.RUN_ON_STARTUP === 'true';
    startStreakCronJob({ runImmediately });

    console.log('[Worker] Background Worker đã sẵn sàng và đang lắng nghe tác vụ định kỳ.');
  } catch (error) {
    console.error('[Worker] Lỗi khởi động Background Worker:', error);
    process.exit(1);
  }
}

// Xử lý dừng tiến trình an toàn (Graceful Shutdown)
async function shutdown(signal: string): Promise<void> {
  console.log(`[Worker] Nhận tín hiệu ${signal}. Đang tắt Worker an toàn...`);
  stopStreakCronJob();
  await disconnectDB();
  console.log('[Worker] Đã đóng tất cả kết nối. Tạm biệt!');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startWorker();
