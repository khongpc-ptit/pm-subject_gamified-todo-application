import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  gamificationService,
  type FreezeStreakResponseData
} from '../../services/gamificationService';
import { useGamification } from '../../context/GamificationContext';

export interface StreakCardProps {
  currentStreak?: number;
  streakFreezeCount?: number;
  isProtected?: boolean;
  onFreezeSuccess?: (data: FreezeStreakResponseData) => void;
  onToast?: (message: string) => void;
}

export const StreakCard: React.FC<StreakCardProps> = ({
  currentStreak: propStreak,
  streakFreezeCount: propFreezeCount,
  isProtected: propIsProtected,
  onFreezeSuccess,
  onToast
}) => {
  const context = useGamification();

  const [appliedResult, setAppliedResult] = useState<{
    baseFreeze: number | undefined;
    baseStreak: number | undefined;
    data: FreezeStreakResponseData;
  } | null>(null);

  const hasValidOverride =
    appliedResult !== null &&
    appliedResult.baseFreeze === propFreezeCount &&
    appliedResult.baseStreak === propStreak;

  const streak = hasValidOverride
    ? appliedResult.data.current_streak
    : propStreak !== undefined
      ? propStreak
      : context.currentStreak;

  const freezeCount = hasValidOverride
    ? appliedResult.data.streak_freeze_count
    : propFreezeCount !== undefined
      ? propFreezeCount
      : context.streakFreezeCount;

  const protectedToday = hasValidOverride
    ? (appliedResult.data.is_protected ?? true)
    : propIsProtected !== undefined
      ? propIsProtected
      : context.isStreakProtected;

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localToast, setLocalToast] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const notify = useCallback(
    (msg: string) => {
      if (onToast) {
        onToast(msg);
      } else {
        setLocalToast(msg);
        setTimeout(() => {
          setLocalToast((prev) => (prev === msg ? null : prev));
        }, 3200);
      }
    },
    [onToast]
  );

  useEffect(() => {
    if (!isConfirmOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submittingRef.current) {
        setIsConfirmOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConfirmOpen]);

  const handleConfirmFreeze = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const result = await gamificationService.freezeStreak();
      const nextFreeze = result.streak_freeze_count;
      const nextStreak = result.current_streak ?? streak;
      const nextProtected = result.is_protected ?? true;

      setAppliedResult({
        baseFreeze: propFreezeCount,
        baseStreak: propStreak,
        data: {
          ...result,
          streak_freeze_count: nextFreeze,
          current_streak: nextStreak,
          is_protected: nextProtected
        }
      });
      context.updateStreakFreeze(nextFreeze, nextStreak, nextProtected, result.frozen_date);
      onFreezeSuccess?.(result);

      setIsConfirmOpen(false);
      notify(
        result.message ||
          `Đã dùng 1 lượt đóng băng · Chuỗi ${nextStreak} ngày được bảo vệ!`
      );
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Không thể kích hoạt đóng băng chuỗi lúc này';
      notify(errorMessage);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const isTriggerDisabled = freezeCount <= 0 || protectedToday || isSubmitting;

  return (
    <div className="streak-card-group" data-testid="streak-card">
      {/* Khối Hiển thị Chuỗi Ngày Liên Tục & Ngọn Lửa Rực Sáng */}
      <section className="card flat streak-card-main">
        <div className="eyebrow">DAILY STREAK</div>
        <div className="streak-card-hero">
          <div
            className={`streak-card-flame ${streak > 0 ? 'active' : 'idle'}`}
            role="img"
            aria-label="Ngọn lửa streak rực sáng"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M13 2.5c.6 4.2-3 5.2-3 8.3-1.1-1-1.6-2.1-1.6-3.2C5.9 9.8 5 12.1 5 15a7 7 0 0 0 14 0c0-3.7-2.1-6.8-6-12.5Z" />
              <path
                d="M12 13.2c.2 2-1.9 2.7-1.9 4.5a2 2 0 0 0 4 0c0-1.3-.7-2.5-2.1-4.5Z"
                fill="#fff6dc"
                stroke="none"
              />
            </svg>
          </div>
          <div>
            <div className="metric" data-testid="streak-count">
              {streak} <span style={{ fontSize: '14px' }}>ngày</span>
            </div>
            <small className="streak-status-sub">
              {streak > 0 ? 'Đang duy trì phong độ rực cháy' : 'Hoàn thành 1 việc để thắp lửa'}
            </small>
          </div>
        </div>
        <p className="helper">
          Chuỗi tài khoản được đồng bộ theo múi giờ Việt Nam (UTC+7). Hoàn thành ít nhất 01 công
          việc hoặc thói quen mỗi ngày để giữ lửa.
        </p>
      </section>

      {/* Khối Đóng Băng Chuỗi Khẩn Cấp (Streak Freeze) */}
      <section className="card streak-freeze-card">
        <div className="eyebrow">STREAK PROTECTION</div>
        <h3 data-testid="freeze-count" className="freeze-count-heading">
          <span role="img" aria-label="Bông tuyết đóng băng">
            ❄️
          </span>{' '}
          {freezeCount} lượt đóng băng
        </h3>
        <p>
          {protectedToday
            ? 'Chuỗi ngày hôm nay của bạn đã được đóng băng bảo vệ an toàn.'
            : freezeCount > 0
              ? 'Bảo vệ chuỗi ngày hiện tại không bị reset khi có việc bận đột xuất.'
              : 'Bạn đã sử dụng hết lượt đóng băng khả dụng.'}
        </p>

        {protectedToday && (
          <div className="streak-protected-pill" data-testid="streak-protected-badge">
            ❄️ Đang bảo vệ chuỗi ngày hôm nay
          </div>
        )}

        <button
          type="button"
          data-testid="freeze-trigger-btn"
          className={isTriggerDisabled ? 'full' : 'primary full'}
          style={{ width: '100%' }}
          disabled={isTriggerDisabled}
          onClick={() => setIsConfirmOpen(true)}
          aria-label="Kích hoạt đóng băng khẩn cấp"
        >
          {protectedToday
            ? '✓ Đã bảo vệ chuỗi hôm nay'
            : freezeCount <= 0
              ? 'Không còn lượt đóng băng'
              : '❄️ Kích hoạt đóng băng khẩn cấp'}
        </button>
      </section>

      {/* Confirmation Dialog */}
      {isConfirmOpen && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="freeze-confirm-title"
          data-testid="freeze-confirm-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsConfirmOpen(false);
            }
          }}
        >
          <div className="modal">
            <div className="modal-head">
              <h2 id="freeze-confirm-title">Xác nhận đóng băng chuỗi?</h2>
              <button
                type="button"
                className="quiet small"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isSubmitting}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="celebrate">
              <div className="freeze-confirm-symbol" aria-hidden="true">
                ❄️
              </div>
              <h3>Bảo vệ chuỗi {streak} ngày liên tục</h3>
              <p>
                Sử dụng <strong>01 lượt đóng băng</strong> để bảo vệ chuỗi ngày hôm nay không bị
                reset về 0 trong đợt quét tự động lúc 00:05 (UTC+7).
              </p>
              <span className="pill outline">
                {freezeCount} lượt còn lại → {Math.max(0, freezeCount - 1)} lượt
              </span>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="quiet"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="primary"
                data-testid="freeze-confirm-btn"
                onClick={handleConfirmFreeze}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang kích hoạt…' : 'Xác nhận đóng băng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {localToast && (
        <div className="toast" role="status" aria-live="polite">
          {localToast}
        </div>
      )}
    </div>
  );
};

export default StreakCard;
