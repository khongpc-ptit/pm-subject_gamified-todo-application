import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { XPProgressBar } from '../components/gamification/XPProgressBar';
import { LevelBadge } from '../components/gamification/LevelBadge';
import { LevelUpModal } from '../components/gamification/LevelUpModal';
import { Header } from '../components/Header';
import { GamificationProvider, useGamification } from '../context/GamificationContext';

describe('Frontend: [TECH-S2-07] Gamification UI Components', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. XPProgressBar Component', () => {
    it('1.1. Render thanh tiến trình với giá trị cụ thể từ props', () => {
      // Level 1: 0 - 100 XP. 75 XP -> 75/100 XP · 75%
      render(<XPProgressBar xp={75} level={1} />);

      expect(screen.getByTestId('xp-progress-bar')).toBeInTheDocument();
      expect(screen.getByTestId('xp-text')).toHaveTextContent('75/100 XP · 75%');
      expect(screen.getByTestId('xp-next-level')).toHaveTextContent('Cấp 2 (còn 25 XP)');

      const progressFill = screen.getByTestId('progress-bar-fill');
      expect(progressFill).toHaveStyle({ width: '75%' });

      const progressbar = screen.getByRole('progressbar', { name: 'Tiến trình lên cấp' });
      expect(progressbar).toHaveAttribute('aria-valuenow', '75');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('1.2. Tính toán chính xác khi ở Level 2 (100 - 400 XP, range = 300 XP)', () => {
      // 250 XP ở Level 2 -> (250 - 100) / 300 = 150/300 = 50%
      render(<XPProgressBar xp={250} level={2} />);

      expect(screen.getByTestId('xp-text')).toHaveTextContent('150/300 XP · 50%');
      expect(screen.getByTestId('xp-next-level')).toHaveTextContent('Cấp 3 (còn 150 XP)');
      expect(screen.getByTestId('progress-bar-fill')).toHaveStyle({ width: '50%' });
    });

    it('1.3. Tự động lấy giá trị từ GamificationContext khi không truyền props', () => {
      render(
        <GamificationProvider initialXP={50} initialLevel={1}>
          <XPProgressBar />
        </GamificationProvider>
      );

      expect(screen.getByTestId('xp-text')).toHaveTextContent('50/100 XP · 50%');
      expect(screen.getByTestId('progress-bar-fill')).toHaveStyle({ width: '50%' });
    });

    it('1.4. Hỗ trợ ẩn meta text khi showMeta = false', () => {
      render(<XPProgressBar xp={80} level={1} showMeta={false} />);

      expect(screen.queryByTestId('xp-text')).not.toBeInTheDocument();
      expect(screen.getByTestId('progress-bar-fill')).toHaveStyle({ width: '80%' });
    });
  });

  describe('2. LevelBadge Component', () => {
    it('2.1. Render huy hiệu Level 1 với danh hiệu "Tập sự"', () => {
      render(<LevelBadge level={1} />);

      expect(screen.getByTestId('level-badge')).toBeInTheDocument();
      expect(screen.getByTestId('level-badge-icon')).toHaveTextContent('1');
      expect(screen.getByTestId('level-badge-info')).toHaveTextContent('CẤP 1 · TẬP SỰ');
      expect(screen.getByText('Tiến bộ mỗi ngày')).toBeInTheDocument();
    });

    it('2.2. Render đúng danh hiệu cho các Level khác nhau (Chiến binh, Tinh anh, Cao thủ, Chuyên gia, Huyền thoại)', () => {
      const { rerender } = render(<LevelBadge level={2} />);
      expect(screen.getByTestId('level-badge-info')).toHaveTextContent('CẤP 2 · CHIẾN BINH');

      rerender(<LevelBadge level={3} />);
      expect(screen.getByTestId('level-badge-info')).toHaveTextContent('CẤP 3 · TINH ANH');

      rerender(<LevelBadge level={4} />);
      expect(screen.getByTestId('level-badge-info')).toHaveTextContent('CẤP 4 · CAO THỦ');

      rerender(<LevelBadge level={5} />);
      expect(screen.getByTestId('level-badge-info')).toHaveTextContent('CẤP 5 · CHUYÊN GIA');

      rerender(<LevelBadge level={6} />);
      expect(screen.getByTestId('level-badge-info')).toHaveTextContent('CẤP 6 · HUYỀN THOẠI');

      rerender(<LevelBadge level={10} />);
      expect(screen.getByTestId('level-badge-info')).toHaveTextContent('CẤP 10 · HUYỀN THOẠI');
    });

    it('2.3. Hỗ trợ tùy biến subtitle và kích thước (sm, md, lg)', () => {
      render(<LevelBadge level={2} subtitle="Chiến binh chăm chỉ" size="lg" />);

      expect(screen.getByText('Chiến binh chăm chỉ')).toBeInTheDocument();
      expect(screen.getByTestId('level-badge')).toHaveClass('level-badge-lg');
    });

    it('2.4. Hỗ trợ chế độ iconOnly (chỉ hiển thị khiên cấp độ)', () => {
      render(<LevelBadge level={3} iconOnly />);

      expect(screen.getByTestId('level-badge-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('level-badge-info')).not.toBeInTheDocument();
    });
  });

  describe('3. LevelUpModal Component', () => {
    it('3.1. Không render modal khi isOpen = false', () => {
      const { container } = render(<LevelUpModal isOpen={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('3.2. Render chúc mừng khi isOpen = true với đầy đủ thông tin cấp độ và hiệu ứng Confetti', () => {
      render(
        <LevelUpModal
          isOpen={true}
          newLevel={2}
          oldLevel={1}
          title="Chiến binh"
          totalXP={115}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId('level-up-modal')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Chiến binh · Cấp 2');
      expect(screen.getByText(/Bạn đã thăng cấp thành công!/i)).toBeInTheDocument();
      expect(screen.getByText('115 XP')).toBeInTheDocument();
      expect(screen.getByText(/Cấp 3 \(400 XP\)/)).toBeInTheDocument();

      // Confetti animation
      expect(screen.getByTestId('confetti-container')).toBeInTheDocument();
    });

    it('3.3. Gọi onClose khi nhấn nút "Tiếp tục chinh phục"', () => {
      const handleClose = vi.fn();
      render(
        <LevelUpModal
          isOpen={true}
          newLevel={3}
          onClose={handleClose}
        />
      );

      const continueBtn = screen.getByTestId('level-up-continue-btn');
      fireEvent.click(continueBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('3.4. Gọi onClose khi nhấn nút đóng "×" hoặc click overlay', () => {
      const handleClose = vi.fn();
      render(
        <LevelUpModal
          isOpen={true}
          newLevel={2}
          onClose={handleClose}
        />
      );

      const closeBtn = screen.getByTestId('level-up-modal-close');
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);

      const overlay = screen.getByTestId('level-up-modal-overlay');
      fireEvent.click(overlay);
      expect(handleClose).toHaveBeenCalledTimes(2);
    });

    it('3.5. Đóng modal khi nhấn phím Escape', () => {
      const handleClose = vi.fn();
      render(
        <LevelUpModal
          isOpen={true}
          newLevel={2}
          onClose={handleClose}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. GamificationContext & State Synchronization', () => {
    // Component test trợ giúp để kiểm tra các hành vi của context
    const TestConsumer: React.FC = () => {
      const {
        totalXP,
        currentLevel,
        progressPercent,
        triggerGamificationUpdate,
        levelUpModal,
        closeLevelUpModal
      } = useGamification();

      return (
        <div>
          <span data-testid="ctx-xp">{totalXP}</span>
          <span data-testid="ctx-level">{currentLevel}</span>
          <span data-testid="ctx-progress">{progressPercent}</span>
          <button
            onClick={() =>
              triggerGamificationUpdate({
                total_xp: 150,
                current_level: 2,
                level_up: true,
                xp_earned: 30
              })
            }
          >
            Cộng XP & Lên cấp
          </button>
          <button
            onClick={() =>
              triggerGamificationUpdate({
                total_xp: 80,
                current_level: 1,
                level_up: false,
                xp_earned: 20
              })
            }
          >
            Cộng XP thường
          </button>
          {levelUpModal?.isOpen && (
            <div data-testid="modal-active">
              Modal đang mở cho Cấp {levelUpModal.newLevel}
              <button onClick={closeLevelUpModal}>Đóng</button>
            </div>
          )}
        </div>
      );
    };

    it('4.1. Cập nhật state Level/XP theo thời gian thực khi triggerGamificationUpdate', () => {
      render(
        <GamificationProvider initialXP={50} initialLevel={1}>
          <TestConsumer />
        </GamificationProvider>
      );

      expect(screen.getByTestId('ctx-xp')).toHaveTextContent('50');
      expect(screen.getByTestId('ctx-level')).toHaveTextContent('1');

      fireEvent.click(screen.getByText('Cộng XP thường'));

      expect(screen.getByTestId('ctx-xp')).toHaveTextContent('80');
      expect(screen.getByTestId('ctx-level')).toHaveTextContent('1');
      expect(screen.getByTestId('ctx-progress')).toHaveTextContent('80');
      expect(screen.queryByTestId('modal-active')).not.toBeInTheDocument();
    });

    it('4.2. Tự động kích hoạt LevelUpModal khi nhận cờ level_up: true', () => {
      render(
        <GamificationProvider initialXP={90} initialLevel={1}>
          <TestConsumer />
        </GamificationProvider>
      );

      fireEvent.click(screen.getByText('Cộng XP & Lên cấp'));

      expect(screen.getByTestId('ctx-xp')).toHaveTextContent('150');
      expect(screen.getByTestId('ctx-level')).toHaveTextContent('2');
      expect(screen.getByTestId('modal-active')).toHaveTextContent('Modal đang mở cho Cấp 2');

      // Đóng modal
      fireEvent.click(screen.getByText('Đóng'));
      expect(screen.queryByTestId('modal-active')).not.toBeInTheDocument();
    });
  });

  describe('5. Tích hợp Header Component', () => {
    it('5.1. Header render đồng bộ cả LevelBadge và XPProgressBar', () => {
      render(
        <GamificationProvider initialXP={380} initialLevel={2}>
          <Header />
        </GamificationProvider>
      );

      expect(screen.getByTestId('level-badge')).toBeInTheDocument();
      expect(screen.getByTestId('level-badge-icon')).toHaveTextContent('2');
      expect(screen.getByTestId('level-badge-info')).toHaveTextContent('CẤP 2 · CHIẾN BINH');

      expect(screen.getByTestId('xp-progress-bar')).toBeInTheDocument();
      // Level 2 (100 - 400 XP). 380 XP -> 280/300 XP · 93.33%
      expect(screen.getByTestId('xp-text')).toHaveTextContent('280/300 XP · 93.33%');
      expect(screen.getByTestId('xp-next-level')).toHaveTextContent('Cấp 3 (còn 20 XP)');
    });
  });
});
