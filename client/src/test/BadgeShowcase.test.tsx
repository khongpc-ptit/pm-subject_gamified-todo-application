import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BadgesPage } from '../pages/BadgesPage';
import { useBadges } from '../hooks/useBadges';
import { badgeService, type Badge } from '../services/badgeService';

const locked: Badge = {
  _id: 'badge-1', code: 'FIRST_TASK', title: 'Khởi đầu nan', description: 'Hoàn thành công việc',
  icon_url: '/badge.webp', condition_type: 'TASK_COUNT', condition_value: 1,
  current_progress: 0, is_unlocked: false, unlocked_at: null
};
const earned: Badge = { ...locked, current_progress: 1, is_unlocked: true, unlocked_at: '2026-11-24T10:00:00Z' };

afterEach(() => vi.restoreAllMocks());

it('renders progress and earned dates, plus retry on failed load', () => {
  const retry = vi.fn();
  const { rerender } = render(<BadgesPage badges={[locked, { ...earned, _id: 'badge-2', title: 'Đã đạt' }]}
    loading={false} error={false} onRetry={retry} />);
  expect(screen.getByText(/1\/2 huy hiệu/)).toBeInTheDocument();
  expect(screen.getByRole('progressbar', { name: 'Tiến độ Khởi đầu nan' })).toHaveAttribute('value', '0');
  expect(screen.getByText(/Mở khóa/)).toHaveAttribute('datetime', earned.unlocked_at);
  rerender(<BadgesPage badges={[]} loading={false} error onRetry={retry} />);
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
  expect(retry).toHaveBeenCalledOnce();
});

it('celebrates new unlocks after baseline and does not repeat acknowledged badges', async () => {
  const previous = { ...earned, _id: 'older', title: 'Older badge' };
  const list = vi.spyOn(badgeService, 'list').mockResolvedValueOnce([locked, previous])
    .mockResolvedValue([earned, previous]);
  function ShowcaseState() {
    const { loading, refresh, unlocked, acknowledge } = useBadges('user-1');
    return <div>
      <button disabled={loading} onClick={() => void refresh()}>Refresh</button>
      {!loading && <p>Loaded</p>}
      {unlocked && <button onClick={acknowledge}>{unlocked.title}</button>}
    </div>;
  }
  render(<ShowcaseState />);
  await screen.findByText('Loaded');
  expect(screen.queryByText(previous.title)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  fireEvent.click(await screen.findByRole('button', { name: earned.title }));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await screen.findByText('Loaded');
  expect(screen.queryByText(earned.title)).not.toBeInTheDocument();
  expect(list).toHaveBeenCalledTimes(3);
});
