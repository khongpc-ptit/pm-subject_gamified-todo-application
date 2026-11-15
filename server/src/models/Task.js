const mongoose = require('mongoose');

const PRIORITY_XP_MAP = {
  LOW: 10,
  MEDIUM: 20,
  HIGH: 30
};

const taskSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM'
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
      default: 'TODO',
      index: true
    },
    due_date: {
      type: Date,
      default: null
    },
    xp_reward: {
      type: Number,
      default: 20
    },
    completed_at: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
);

// Compound index for optimal dashboard query by user and status
taskSchema.index({ user_id: 1, status: 1 });

// Automatically compute xp_reward based on priority before saving
taskSchema.pre('save', function (next) {
  if (this.priority && PRIORITY_XP_MAP[this.priority]) {
    this.xp_reward = PRIORITY_XP_MAP[this.priority];
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);
module.exports = { Task, PRIORITY_XP_MAP };
