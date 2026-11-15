const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password_hash: {
      type: String,
      required: true
    },
    full_name: {
      type: String,
      required: true,
      trim: true
    },
    current_level: {
      type: Number,
      default: 1
    },
    total_xp: {
      type: Number,
      default: 0
    },
    current_streak: {
      type: Number,
      default: 0
    },
    last_active_date: {
      type: String,
      default: null // Format: YYYY-MM-DD
    },
    streak_freeze_count: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
