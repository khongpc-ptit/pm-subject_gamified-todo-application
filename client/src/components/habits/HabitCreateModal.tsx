import React, { useState, useEffect, useRef } from 'react';
import type { CreateHabitRequestDTO, HabitFrequency } from '../../types/habit.types';

interface HabitCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHabitRequestDTO) => Promise<void>;
}

export const HabitCreateModal: React.FC<HabitCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('DAILY');
  const [targetDays, setTargetDays] = useState<number>(7);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setFrequency('DAILY');
      setTargetDays(7);
      setError(null);
      setIsSubmitting(false);
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = title.trim();
    if (!trimmed) {
      setError('Vui lòng nhập tên thói quen.');
      titleInputRef.current?.focus();
      return;
    }

    if (trimmed.length > 200) {
      setError('Tên thói quen không được vượt quá 200 ký tự.');
      titleInputRef.current?.focus();
      return;
    }

    const target = Number(targetDays);
    if (!Number.isInteger(target) || target < 1 || target > 7) {
      setError('Mục tiêu phải là số nguyên từ 1 đến 7 ngày.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        title: trimmed,
        frequency,
        target_days: target
      });
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Không thể tạo thói quen. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="overlay"
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div id="modal" className="modal">
        <div className="modal-head">
          <h2 id="modal-title">Tạo thói quen</h2>
          <button
            type="button"
            className="quiet small"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
          >
            ✕
          </button>
        </div>

        <form id="habit-form" onSubmit={handleSubmit} noValidate>
          {/* Tên thói quen */}
          <div className="field">
            <label htmlFor="habit-title">Tên thói quen</label>
            <input
              id="habit-title"
              ref={titleInputRef}
              type="text"
              name="title"
              maxLength={200}
              placeholder="Ví dụ: Đọc sách 30 phút"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              aria-invalid={!!error}
              aria-describedby={error ? 'habit-error' : undefined}
              disabled={isSubmitting}
            />
            {error && (
              <div id="habit-error" className="error" role="alert">
                {error}
              </div>
            )}
          </div>

          {/* Chu kỳ lặp lại */}
          <div className="field">
            <label htmlFor="habit-frequency">Chu kỳ</label>
            <select
              id="habit-frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
              disabled={isSubmitting}
            >
              <option value="DAILY">Hằng ngày (DAILY)</option>
              <option value="WEEKLY">Hằng tuần (WEEKLY)</option>
            </select>
          </div>

          {/* Mục tiêu số ngày */}
          <div className="field">
            <label htmlFor="habit-target">Mục tiêu số ngày / chu kỳ</label>
            <input
              id="habit-target"
              type="number"
              min={1}
              max={7}
              value={targetDays}
              onChange={(e) => setTargetDays(Number(e.target.value))}
              disabled={isSubmitting}
            />
          </div>

          <p className="helper">
            Duy trì đều đặn để tích lũy chuỗi ngày và nhận +15 XP mỗi lần điểm danh.
          </p>

          <div className="modal-actions">
            <button
              type="button"
              className="quiet"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang tạo…' : 'Tạo thói quen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
