import React from 'react';
import type { Task } from '../types/task.types';

interface TaskRowProps {
  task: Task;
  onToggleComplete?: (task: Task) => void;
  onEdit?: (task: Task) => void;
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Vừa',
  HIGH: 'Cao'
};

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  onToggleComplete,
  onEdit
}) => {
  const isCompleted = task.status === 'COMPLETED';

  // Định dạng ngày hiển thị DD/MM/YYYY
  const formattedDueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : 'Không hạn';

  return (
    <div className={`task-row ${isCompleted ? 'completed' : ''}`}>
      <button
        type="button"
        className={`check ${isCompleted ? 'done' : ''}`}
        aria-label={`${isCompleted ? 'Chuyển về TODO' : 'Hoàn thành'}: ${task.title}`}
        onClick={() => onToggleComplete?.(task)}
      >
        {isCompleted ? '✓' : ''}
      </button>

      <div className="task-text">
        <b>{task.title}</b>
        <small>
          <span className={`priority ${task.priority}`} aria-hidden="true" />
          {PRIORITY_LABELS[task.priority] || task.priority}
          {' · '}
          {formattedDueDate}
          {task.status === 'IN_PROGRESS' ? ' · Đang làm' : ''}
        </small>
      </div>

      <span className="reward">+{task.xp_reward} XP</span>

      <button
        type="button"
        className="edit"
        aria-label={`Sửa ${task.title}`}
        onClick={() => onEdit?.(task)}
      >
        ✎
      </button>
    </div>
  );
};
