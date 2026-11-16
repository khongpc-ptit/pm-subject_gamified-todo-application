import mongoose from 'mongoose';

/**
 * Kết nối tới cơ sở dữ liệu MongoDB (Docker local hoặc MongoDB Atlas Cloud)
 * Áp dụng Connection Pooling và timeout theo chuẩn DOC-11 (Mục 1.2 & 4.3)
 */
export const connectDB = async (customUri?: string): Promise<typeof mongoose> => {
  try {
    const mongoUri = customUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/gamified_todo';
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    const host = conn.connection?.host || 'localhost';
    console.log(`[MongoDB] Connected successfully to: ${host}`);
    return conn;
  } catch (error: any) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

/**
 * Đóng kết nối MongoDB an toàn khi shutdown hoặc sau khi kết thúc test
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('[MongoDB] Connection closed successfully.');
  } catch (error: any) {
    console.error(`[MongoDB] Error disconnecting: ${error.message}`);
  }
};
