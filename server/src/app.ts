import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
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

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/v1/tasks', taskRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
export { app };
