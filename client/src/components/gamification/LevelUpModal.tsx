import React, { useEffect, useMemo, useRef } from 'react';
import { useGamification } from '../../context/GamificationContext';
import { getLevelTitle, calculateNextLevelXP } from '../../utils/gamificationUtils';
import { LEVEL_SYMBOLS } from './LevelBadge';

export interface LevelUpModalProps {
  isOpen?: boolean;
  newLevel?: number;
  oldLevel?: number;
  title?: string;
  totalXP?: number;
  onClose?: () => void;
}

// Màu sắc confetti rực rỡ
const CONFETTI_COLORS = [
  '#f1c40f', // Vàng gold
  '#2ecc71', // Xanh lá
  '#e74c3c', // Đỏ cam
  '#3498db', // Xanh dương
  '#9b59b6', // Tím
  '#ba8135', // Đồng gold cổ điển
  '#1abc9c', // Ngọc lam
  '#e67e22'  // Cam
];

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen: propIsOpen,
  newLevel: propNewLevel,
  title: propTitle,
  totalXP: propTotalXP,
  onClose: propOnClose
}) => {
  const context = useGamification();
  const modalRef = useRef<HTMLDivElement>(null);

  // Lấy dữ liệu từ props hoặc từ context nếu hiển thị toàn cục
  const isOpen = propIsOpen !== undefined ? propIsOpen : (context.levelUpModal?.isOpen ?? false);
  const newLevel = propNewLevel !== undefined ? propNewLevel : (context.levelUpModal?.newLevel ?? context.currentLevel);
  const info = useMemo(() => getLevelTitle(newLevel), [newLevel]);
  const title = propTitle || context.levelUpModal?.title || info.title;
  const totalXP = propTotalXP !== undefined ? propTotalXP : (context.levelUpModal?.totalXP ?? context.totalXP);
  const nextXP = useMemo(() => calculateNextLevelXP(newLevel), [newLevel]);

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      context.closeLevelUpModal();
    }
  };

  // Lắng nghe phím Escape để đóng modal và hỗ trợ Accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Tạo các mảnh pháo giấy confetti ngẫu nhiên
  const confettiPieces = useMemo(() => {
    return Array.from({ length: 40 }).map((_, index) => {
      const left = Math.random() * 100;
      const animationDelay = Math.random() * 2;
      const animationDuration = 2 + Math.random() * 2;
      const size = 6 + Math.random() * 8;
      const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
      const isCircle = index % 3 === 0;

      return {
        id: index,
        left: `${left}%`,
        animationDelay: `${animationDelay}s`,
        animationDuration: `${animationDuration}s`,
        width: `${size}px`,
        height: `${isCircle ? size : size * 1.5}px`,
        backgroundColor: color,
        borderRadius: isCircle ? '50%' : '2px',
        transform: `rotate(${Math.random() * 360}deg)`
      };
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const symbol = LEVEL_SYMBOLS[Math.min(6, Math.max(1, newLevel))] || '👑';

  return (
    <div
      className="overlay level-up-overlay"
      data-testid="level-up-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="presentation"
    >
      {/* Hiệu ứng Pháo giấy Confetti Animation */}
      <div className="confetti-container" aria-hidden="true" data-testid="confetti-container">
        {confettiPieces.map((piece) => (
          <div
            key={piece.id}
            className="confetti-piece"
            style={{
              left: piece.left,
              width: piece.width,
              height: piece.height,
              backgroundColor: piece.backgroundColor,
              borderRadius: piece.borderRadius,
              animationDelay: piece.animationDelay,
              animationDuration: piece.animationDuration,
              transform: piece.transform
            }}
          />
        ))}
      </div>

      <div
        className="modal level-up-modal-content"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-up-title"
        data-testid="level-up-modal"
      >
        <button
          type="button"
          className="modal-close"
          onClick={handleClose}
          aria-label="Đóng modal"
          data-testid="level-up-modal-close"
        >
          ×
        </button>

        <div className="celebrate level-up-body">
          {/* Biểu tượng Huy hiệu Cấp độ mới */}
          <div className="badge-symbol level-up-badge-symbol" data-testid="level-up-symbol">
            <span className="symbol-glyph">{symbol}</span>
          </div>

          <div className="eyebrow level-up-eyebrow">LEVEL UP · THĂNG CẤP ĐỘ</div>

          <h1 id="level-up-title" className="level-up-heading">
            {title} · Cấp {newLevel}
          </h1>

          <p className="level-up-desc">
            Từng nỗ lực nhỏ đang tạo nên sự khác biệt. Bạn đã thăng cấp thành công!
          </p>

          <div className="level-up-stats">
            <div className="stat-pill">
              <small>Tổng kinh nghiệm</small>
              <b>{totalXP} XP</b>
            </div>
            <div className="stat-pill">
              <small>Mục tiêu kế tiếp</small>
              <b>Cấp {newLevel + 1} ({nextXP} XP)</b>
            </div>
          </div>

          <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '24px' }}>
            <button
              type="button"
              className="primary full level-up-btn"
              onClick={handleClose}
              data-testid="level-up-continue-btn"
            >
              Tiếp tục chinh phục ↗
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal;
