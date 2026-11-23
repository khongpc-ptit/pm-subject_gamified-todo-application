import React, { useState, useEffect, useRef } from 'react';
import type { Task, TaskPriority, TaskStatus, UpdateTaskRequestDTO } from '../types/task.types';

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: UpdateTaskRequestDTO) => Promise<void>;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; xp: number }[] = [
  { value: 'LOW', label: 'Thấp', xp: 10 },
  { value: 'MEDIUM', label: 'Vừa', xp: 20 },
  { value: 'HIGH', label: 'Cao', xp: 30 }
];

const STATUS_OPTIONS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'COMPLETED'];

const formatInitialDueDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // ignore
  }
  return '';
};

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'MEDIUM');
  const [dueDate, setDueDate] = useState(() => formatInitialDueDate(task?.due_date));
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'TODO');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Auto-focus vào ô tiêu đề khi mở modal
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Xử lý phím Escape để đóng modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Vui lòng nhập tiêu đề.');
      titleInputRef.current?.setAttribute('aria-invalid', 'true');
      titleInputRef.current?.focus();
      return;
    }

    if (trimmedTitle.length > 200) {
      setError('Tiêu đề công việc không được vượt quá 200 ký tự.');
      titleInputRef.current?.setAttribute('aria-invalid', 'true');
      titleInputRef.current?.focus();
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const payload: UpdateTaskRequestDTO = {
        title: trimmedTitle,
        description: description.trim(),
        priority,
        status,
        due_date: dueDate ? new Date(`${dueDate}T00:00:00.000Z`).toISOString() : null
      };

      await onSave(task._id, payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Cập nhật công việc thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      className="overlay"
      id="overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      data-testid="edit-task-overlay"
    >
      <div
        className="modal"
        id="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
      >
        <div className="modal-head">
          <h2 id="edit-modal-title">Chỉnh sửa công việc</h2>
          <button
            type="button"
            className="quiet"
            data-close
            aria-label="Đóng"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form id="edit-form" onSubmit={handleSubmit} noValidate>
          {/* Trường Tiêu đề */}
          <div className="field">
            <label htmlFor="edit-title">Tiêu đề</label>
            <input
              id="edit-title"
              ref={titleInputRef}
              type="text"
              maxLength={200}
              value={title}
              aria-invalid={!!error}
              aria-describedby={error ? 'edit-error' : undefined}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Nhập tiêu đề công việc"
            />
            {error && (
              <div id="edit-error" className="error" role="alert">
                {error}
              </div>
            )}
          </div>

          {/* Trường Mô tả */}
          <div className="field">
            <label htmlFor="edit-desc">Mô tả</label>
            <textarea
              id="edit-desc"
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Thêm ghi chú hoặc mô tả chi tiết"
            />
          </div>

          {/* Trường Độ ưu tiên */}
          <div className="field">
            <label htmlFor="edit-priority">Ưu tiên</label>
            <select
              id="edit-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} · {opt.xp} XP
                </option>
              ))}
            </select>
          </div>

          {/* Trường Hạn chót */}
          <div className="field">
            <label htmlFor="edit-due">Hạn chót</label>
            <input
              id="edit-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Trường Trạng thái */}
          <div className="field">
            <label htmlFor="edit-status">Trạng thái</label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <p className="helper">
            Đổi ưu tiên sau khi hoàn thành không cộng thêm XP. Chuyển khỏi COMPLETED thu hồi XP đã nhận.
          </p>

          <div className="modal-actions">
            <button
              type="button"
              data-close
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="primary"
              disabled={submitting}
            >
              {submitting ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
