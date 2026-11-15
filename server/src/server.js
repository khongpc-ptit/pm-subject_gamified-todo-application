require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas / Local then start listening
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[Server] Gamified To-Do API is running on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    console.error('[Server] Failed to connect to database:', err.message);
  });
