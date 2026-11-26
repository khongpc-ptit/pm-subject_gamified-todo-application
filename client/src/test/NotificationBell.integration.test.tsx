import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { NotificationBell } from '../components/notifications/NotificationBell';
import { notificationService, type Notification } from '../services/notificationService';

const fixtures: Notification[] = [
  { id: '1', title: 'Badge unlocked', message: 'First task', type: 'ACHIEVEMENT', is_read: false, created_at: '2026-11-24T10:00:00Z' },
  { id: '2', title: 'Task reminder', message: 'Due today', type: 'REMINDER', is_read: false, created_at: '2026-11-24T09:00:00Z' },
  { id: '3', title: 'System update', message: 'You are up to date', type: 'SYSTEM', is_read: true, created_at: '2026-11-24T08:00:00Z' }
];

afterEach(() => vi.restoreAllMocks());

it('shows the count on the closed bell, lists notice types and marks one or all as read', async () => {
  vi.spyOn(notificationService, 'list').mockResolvedValue({ notifications: fixtures, total: 3, unread_count: 2 });
  const read = vi.spyOn(notificationService, 'markRead').mockResolvedValue({ unread_count: 1 });
  const readAll = vi.spyOn(notificationService, 'markAllRead').mockResolvedValue({ unread_count: 0 });
  render(<NotificationBell />);

  const toggle = await screen.findByRole('button', { name: 'Thông báo, 2 chưa đọc' });
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(toggle);
  const badge = await screen.findByRole('button', { name: /Badge unlocked/ });
  expect(badge).toHaveClass('notification-unread');
  expect(screen.getByRole('button', { name: /Task reminder/ })).toHaveClass('notification-unread');
  expect(screen.getByRole('button', { name: /System update/ })).not.toHaveClass('notification-unread');
  fireEvent.click(badge);
  await screen.findByRole('button', { name: 'Thông báo, 1 chưa đọc' });
  expect(read).toHaveBeenCalledWith('1');
  expect(badge).not.toHaveClass('notification-unread');

  fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu tất cả là đã đọc' }));
  await screen.findByRole('button', { name: 'Thông báo' });
  expect(readAll).toHaveBeenCalledOnce();
  expect(screen.getByRole('button', { name: /Task reminder/ })).not.toHaveClass('notification-unread');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(toggle).toHaveFocus();
  expect(screen.queryByRole('region', { name: 'Thông báo' })).not.toBeInTheDocument();
});

it('recovers from a load error, shows empty state and refreshes on focus', async () => {
  const list = vi.spyOn(notificationService, 'list').mockRejectedValue(new Error('Offline'));
  render(<div><button type="button">Outside</button><NotificationBell /></div>);
  fireEvent.click(screen.getByRole('button', { name: 'Thông báo' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải thông báo');
  list.mockResolvedValue({ notifications: [], total: 0, unread_count: 0 });
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
  expect(await screen.findByText('Không có thông báo nào')).toBeInTheDocument();
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }));
  expect(screen.queryByRole('region', { name: 'Thông báo' })).not.toBeInTheDocument();
  list.mockResolvedValue({ notifications: [fixtures[0]], total: 1, unread_count: 1 });
  fireEvent(window, new Event('focus'));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Thông báo, 1 chưa đọc' })).toBeInTheDocument());
});

it('refreshes when a user action can have created a notification', async () => {
  const list = vi.spyOn(notificationService, 'list').mockResolvedValueOnce({ notifications: [], total: 0, unread_count: 0 })
    .mockResolvedValue({ notifications: [fixtures[0]], total: 1, unread_count: 1 });
  const { rerender } = render(<NotificationBell refreshKey={0} />);
  await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
  rerender(<NotificationBell refreshKey={1} />);
  await screen.findByRole('button', { name: /1 ch\u01b0a \u0111\u1ecdc/ });
});
