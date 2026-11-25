import type { Notification, NotificationInbox } from '../../services/notificationService';

const types: Record<Notification['type'], { icon: string; label: string }> = {
  ACHIEVEMENT: { icon: '🏆', label: 'Thành tích' },
  REMINDER: { icon: '⏰', label: 'Nhắc nhở' },
  SYSTEM: { icon: 'ℹ️', label: 'Hệ thống' }
};
const formatDate = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh'
});

interface Props {
  id: string;
  inbox: NotificationInbox | null;
  loading: boolean;
  error: string;
  busy: boolean;
  onRetry: () => void;
  onRead: (item: Notification) => void;
  onReadAll: () => void;
}

export function NotificationDropdown({ id, inbox, loading, error, busy, onRetry, onRead, onReadAll }: Props) {
  return (
    <section className="notification-dropdown" id={id} aria-labelledby={id + '-title'}>
      <div className="notification-heading">
        <h2 id={id + '-title'}>Thông báo</h2>
        <button className="small quiet" type="button" disabled={busy || !inbox?.unread_count} onClick={onReadAll}>
          Đánh dấu tất cả là đã đọc
        </button>
      </div>
      {loading && !inbox && <p className="notification-message" role="status">Đang tải thông báo…</p>}
      {error && <div className="notification-message" role="alert">
        <p>{error}</p>
        <button type="button" className="small" onClick={onRetry} disabled={busy}>Thử lại</button>
      </div>}
      {!loading && !error && inbox?.notifications.length === 0 &&
        <p className="notification-message">Không có thông báo nào</p>}
      {!!inbox?.notifications.length && (
        <ul className="notification-list">
          {inbox.notifications.map(item => (
            <li key={item.id}>
              <button
                type="button"
                className={'notification-item' + (item.is_read ? '' : ' notification-unread')}
                disabled={busy}
                onClick={() => onRead(item)}
              >
                <span className={'notification-type notification-' + item.type.toLowerCase()} title={types[item.type].label}>
                  <span aria-hidden="true">{types[item.type].icon}</span>
                  <span className="sr-only">{types[item.type].label}</span>
                </span>
                <span className="notification-copy">
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                  <time dateTime={item.created_at}>{formatDate.format(new Date(item.created_at))}</time>
                </span>
                {!item.is_read && <span className="notification-dot" aria-label="Chưa đọc" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
