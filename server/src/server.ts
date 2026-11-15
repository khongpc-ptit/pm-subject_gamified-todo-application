import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas / Local then start listening
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[Server] Gamified To-Do API is running on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err: Error) => {
    console.error('[Server] Failed to connect to database:', err.message);
  });
