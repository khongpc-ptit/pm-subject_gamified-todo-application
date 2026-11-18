import React, { useState, useRef } from 'react';
import type { TaskPriority } from '../types/task.types';
import { taskService } from '../services/task.service';

interface QuickTaskFormProps {
  onTaskCreated?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const QuickTaskForm: React.FC<QuickTaskFormProps> = ({
  onTaskCreated,
  inputRef
}) => {
  const submittingRef = useRef(false);
  const [success, setSuccess] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setSuccess(false);
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề công việc');
      return;
    }

    if (title.trim().length > 200) {
      setError('Tiêu đề công việc không được vượt quá 200 ký tự');
      return;
    }

    setError(null);
    submittingRef.current = true;
    setSubmitting(true);

    try {
      await taskService.createTask({
        title: title.trim(),
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null
      });

      setTitle('');
      setDueDate('');
      setPriority('MEDIUM');
      setSuccess(true);
      onTaskCreated?.();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Không thể tạo công việc');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <section className="card">
      <div className="eyebrow">TẠO NHANH / NHẬP TIÊU ĐỀ VÀ ENTER</div>
      <form id="quick" noValidate onSubmit={handleSubmit}>
        <div className="quick">
          <div className="task-title">
            <label htmlFor="task-title">Tên công việc</label>
            <input
              ref={inputRef}
              id="task-title"
              name="title"
              placeholder="Bạn muốn hoàn thành điều gì?"
              maxLength={200}
              autoComplete="off"
              aria-describedby="quick-error"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="priority">Ưu tiên</label>
            <select
              id="priority"
              name="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              disabled={submitting}
            >
              <option value="LOW">Thấp · 10 XP</option>
              <option value="MEDIUM">Vừa · 20 XP</option>
              <option value="HIGH">Cao · 30 XP</option>
            </select>
          </div>

          <div>
            <label htmlFor="due">Hạn chót</label>
            <input
              id="due"
              type="date"
              name="due"
              aria-label="Hạn chót (không bắt buộc)"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={submitting}
            />
          </div>

          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? '…' : '＋ Thêm'}
          </button>
        </div>

        {success && <p role="status">T?o c?ng vi?c th?nh c?ng</p>}
        {error && (
          <div id="quick-error" className="error" role="alert">
            {error}
          </div>
        )}
      </form>
      <p className="helper">Tiêu đề bắt buộc · Hạn chót tùy chọn · Ưu tiên mặc định: Vừa</p>
    </section>
  );
};
