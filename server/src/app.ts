import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware';

const app: Application = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint (gốc)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Health check API v1 (chuẩn JSON Envelope Pattern theo DOC-11)
app.get('/api/v1/health', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const isConnected = dbState === 1;

  res.status(200).json({
    success: true,
    data: {
      status: 'UP',
      database: dbStatusMap[dbState] || 'unknown',
      databaseConnected: isConnected,
      environment: process.env.NODE_ENV || 'development'
    },
    message: isConnected
      ? 'System is healthy and database is connected'
      : 'System is running but database is disconnected',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
export { app };
