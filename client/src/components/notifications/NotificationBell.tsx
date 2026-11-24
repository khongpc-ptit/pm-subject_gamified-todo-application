import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { notificationService, type Notification, type NotificationInbox } from '../../services/notificationService';
import { NotificationDropdown } from './NotificationDropdown';
import './notifications.css';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [inbox, setInbox] = useState<NotificationInbox | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  const mutation = useRef(false);
  const mounted = useRef(false);
  const container = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useId();

  const refresh = useCallback(async () => {
    if (mutation.current) return;
    request.current?.abort();
    const active = new AbortController();
    request.current = active;
    setLoading(true);
    try {
      const result = await notificationService.list(active.signal);
      if (active.signal.aborted) return;
      setInbox(result);
      setError('');
    } catch {
      if (!active.signal.aborted) setError('Không thể tải thông báo.');
    } finally {
      if (!active.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(); }, 30_000);
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      request.current?.abort();
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  async function markRead(item?: Notification) {
    if (mutation.current || item?.is_read) return;
    mutation.current = true;
    request.current?.abort();
    setBusy(true);
    setLoading(false);
    setError('');
    try {
      const result = item ? await notificationService.markRead(item._id) : await notificationService.markAllRead();
      if (!mounted.current) return;
      setInbox(previous => previous && ({
        unread_count: result.unread_count,
        notifications: previous.notifications.map(notice =>
          !item || notice._id === item._id ? { ...notice, is_read: true } : notice
        )
      }));
    } catch {
      if (mounted.current) setError('Không thể cập nhật trạng thái đã đọc.');
    } finally {
      mutation.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  const unread = inbox?.unread_count ?? 0;
  return (
    <div className="notification-bell" ref={container}>
      <button type="button" className="notification-toggle" ref={toggle}
        aria-label={unread ? 'Thông báo, ' + unread + ' chưa đọc' : 'Thông báo'}
        aria-controls={open ? panel : undefined} aria-expanded={open}
        onClick={() => { if (!open) void refresh(); setOpen(!open); }}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {unread > 0 && <span className="notification-count" aria-hidden="true">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && <NotificationDropdown id={panel} inbox={inbox} error={error} loading={loading} busy={busy}
        onRetry={refresh} onRead={markRead} onReadAll={() => void markRead()} />}
    </div>
  );
}
