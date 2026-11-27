/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { Navigation } from '../components/layout/Navigation';
import { BadgeCard } from '../components/badges/BadgeCard';
import { BadgeUnlockModal } from '../components/badges/BadgeUnlockModal';
import type { Badge } from '../services/badgeService';

const sampleBadge: Badge = {
  id: 'badge-webp-1',
  code: 'FIRST_TASK',
  title: 'Khởi đầu nan',
  description: 'Hoàn thành công việc đầu tiên',
  icon_url: '/icons/badges/first-task.webp',
  condition_type: 'TASK_COUNT',
  condition_value: 1,
  current_progress: 1,
  target: 1,
  progress_percent: 100,
  is_unlocked: true,
  unlocked_at: '2026-11-25T08:00:00.000Z'
};

describe('[US-S4-04 / TECH-S4-05] Mobile Responsive Navigation, Touch Targets & WebP Lazy Loading', () => {
  describe('1. Responsive Navigation Component (Sidebar + Bottom Nav + Hamburger Drawer)', () => {
    it('hiển thị cả Sidebar Desktop lẫn Mobile Bottom Navigation Bar với đủ các tab điều hướng', () => {
      const onNavigate = vi.fn();

      render(
        <Navigation
          currentScreen="dashboard"
          onNavigate={onNavigate}
          userName="Lê Mạnh Hùng"
          userEmail="hung@ptit.edu.vn"
        />
      );

      const mobileNav = screen.getByRole('navigation', { name: 'Điều hướng di động' });
      expect(mobileNav).toBeInTheDocument();

      const dashTab = within(mobileNav).getByRole('button', { name: 'Tab Tổng quan' });
      const habitsTab = within(mobileNav).getByRole('button', { name: 'Tab Thói quen' });
      const badgesTab = within(mobileNav).getByRole('button', { name: 'Tab Huy hiệu' });
      const profileTab = within(mobileNav).getByRole('button', { name: 'Tab Hồ sơ' });

      expect(dashTab).toHaveAttribute('aria-current', 'page');
      expect(habitsTab).not.toHaveAttribute('aria-current', 'page');

      fireEvent.click(habitsTab);
      expect(onNavigate).toHaveBeenCalledWith('habits');

      fireEvent.click(badgesTab);
      expect(onNavigate).toHaveBeenCalledWith('badges');

      fireEvent.click(profileTab);
      expect(onNavigate).toHaveBeenCalledWith('profile');
    });

    it('mở Hamburger Menu Drawer trên di động, hiển thị thông tin tài khoản, điều hướng và đăng xuất', () => {
      const onNavigate = vi.fn();
      const onLogout = vi.fn();

      render(
        <Navigation
          currentScreen="dashboard"
          onNavigate={onNavigate}
          onLogout={onLogout}
          userName="Lê Mạnh Hùng"
          userEmail="hung@ptit.edu.vn"
        />
      );

      const menuBtn = screen.getByRole('button', { name: 'Mở menu điều hướng' });
      expect(menuBtn).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(menuBtn);
      expect(menuBtn).toHaveAttribute('aria-expanded', 'true');

      const drawer = screen.getByRole('dialog', { name: 'Menu điều hướng di động' });
      expect(drawer).toHaveAttribute('aria-modal', 'true');
      expect(within(drawer).getByText('Lê Mạnh Hùng')).toBeInTheDocument();
      expect(within(drawer).getByText('hung@ptit.edu.vn')).toBeInTheDocument();

      // Điều hướng từ drawer sẽ đóng drawer tự động
      fireEvent.click(within(drawer).getByRole('button', { name: /Thói quen & Chuỗi/i }));
      expect(onNavigate).toHaveBeenCalledWith('habits');
      expect(screen.queryByRole('dialog', { name: 'Menu điều hướng di động' })).not.toBeInTheDocument();

      // Mở lại và đóng bằng phím Escape
      fireEvent.click(menuBtn);
      expect(screen.getByRole('dialog', { name: 'Menu điều hướng di động' })).toBeInTheDocument();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('dialog', { name: 'Menu điều hướng di động' })).not.toBeInTheDocument();

      // Mở lại và bấm Đăng xuất trong drawer
      fireEvent.click(menuBtn);
      const reopenedDrawer = screen.getByRole('dialog', { name: 'Menu điều hướng di động' });
      fireEvent.click(within(reopenedDrawer).getByRole('button', { name: /Đăng xuất/i }));
      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Hình ảnh huy hiệu WebP tối ưu & Lazy Loading', () => {
    it('BadgeCard hiển thị ảnh WebP kèm loading="lazy" và decoding="async"', () => {
      const { container } = render(<BadgeCard badge={sampleBadge} />);
      const img = container.querySelector('img');
      expect(img).not.toBeNull();
      expect(img).toHaveAttribute('src', '/icons/badges/first-task.webp');
      expect(img).toHaveAttribute('loading', 'lazy');
      expect(img).toHaveAttribute('decoding', 'async');
    });

    it('BadgeUnlockModal hiển thị ảnh WebP của huy hiệu kèm loading="lazy"', () => {
      HTMLDialogElement.prototype.showModal = vi.fn();
      HTMLDialogElement.prototype.close = vi.fn();

      const { container } = render(<BadgeUnlockModal badge={sampleBadge} onClose={vi.fn()} />);
      const img = container.querySelector('img');
      expect(img).not.toBeNull();
      expect(img).toHaveAttribute('src', '/icons/badges/first-task.webp');
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  describe('3. Hệ thống CSS Responsive & Chuẩn Touch Target ≥ 48x48px trong client/src/index.css', () => {
    it('định nghĩa đầy đủ breakpoints Mobile (320-480px), Tablet (481-768px), Desktop (>=1024px), chống overflow-x và touch target 48px', () => {
      const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');

      // Breakpoints chuẩn
      expect(css).toMatch(/@media\s*\(max-width:\s*480px\)/);
      expect(css).toMatch(/@media\s*\(min-width:\s*481px\)\s*and\s*\(max-width:\s*768px\)/);
      expect(css).toMatch(/@media\s*\(min-width:\s*1024px\)/);

      // Chống tràn ngang trên màn hình hẹp 320px-375px
      expect(css).toMatch(/overflow-x:\s*(clip|hidden)/);

      // Touch targets >= 48x48px
      expect(css).toMatch(/min-width:\s*48px/);
      expect(css).toMatch(/min-height:\s*48px/);

      // Mobile Bottom Navigation Bar & Drawer
      expect(css).toContain('.mobile-bottom-nav');
      expect(css).toContain('.mobile-drawer');
    });
  });
});
