import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';

describe('Database & Health Check Tests - [TECH-S1-00]', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('1. GET /health - Endpoint kiểm tra sức khỏe cơ bản phản hồi 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.timestamp).toBeDefined();
  });

  it('2. GET /api/v1/health - Trả về đúng JSON Envelope Pattern chuẩn DOC-11', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toBe('UP');
    expect(typeof res.body.data.database).toBe('string');
    expect(typeof res.body.data.databaseConnected).toBe('boolean');
    expect(res.body.data.environment).toBeDefined();
    expect(res.body.message).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
  });

  it('3. connectDB cấu hình kết nối Mongoose với Connection Pooling chuẩn xác', async () => {
    const mockMongoose = {
      connection: {
        host: '127.0.0.1',
        port: 27017,
        readyState: 1
      }
    };
    const connectSpy = jest.spyOn(mongoose, 'connect').mockResolvedValueOnce(mockMongoose as any);

    const result = await connectDB('mongodb://localhost:27017/gamified_todo_test');
    expect(connectSpy).toHaveBeenCalledWith(
      'mongodb://localhost:27017/gamified_todo_test',
      expect.objectContaining({
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
      })
    );
    expect(result).toBe(mockMongoose);
  });

  it('4. connectDB xử lý lỗi kết nối và ném exception trong môi trường test', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(mongoose, 'connect').mockRejectedValueOnce(new Error('ECONNREFUSED 127.0.0.1:27017'));

    await expect(connectDB('mongodb://invalid-host:27017/fail_db')).rejects.toThrow('ECONNREFUSED 127.0.0.1:27017');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('5. disconnectDB gọi mongoose.disconnect an toàn khi dừng ứng dụng', async () => {
    const disconnectSpy = jest.spyOn(mongoose, 'disconnect').mockResolvedValueOnce(undefined as any);

    await disconnectDB();
    expect(disconnectSpy).toHaveBeenCalled();
  });
});
