import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { ensureNotificationIndexes } from './services/notificationService';
import { connectDB } from './config/db';
import { startStreakCronJob } from './cron/streakResetJob';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas / Local then start listening
connectDB()
  .then(ensureNotificationIndexes)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[Server] Gamified To-Do API is running on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);

      // Khởi động Scheduled Cronjob trừ khi được cấu hình tắt riêng
      if (process.env.DISABLE_CRON !== 'true' && process.env.NODE_ENV !== 'test') {
        startStreakCronJob();
      }
    });
  })
  .catch((err: Error) => {
    console.error('[Server] Failed to connect to database:', err.message);
  });
