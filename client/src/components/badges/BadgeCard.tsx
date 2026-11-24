import { useState } from 'react';
import type { Badge } from '../../services/badgeService';

const units = { TASK_COUNT: 'công việc', STREAK_DAYS: 'ngày liên tiếp', LEVEL_REACH: 'cấp' };
const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'medium'
});

export function BadgeCard({ badge }: { badge: Badge }) {
  const [failedIcon, setFailedIcon] = useState(false);
  return (
    <article className={badge.is_unlocked ? 'showcase-badge showcase-badge-earned' : 'showcase-badge showcase-badge-locked'}>
      <div className="showcase-badge-icon" aria-hidden="true">
        {badge.icon_url && !failedIcon
          ? <img src={badge.icon_url} alt="" width={64} height={64} loading="lazy" decoding="async" onError={() => setFailedIcon(true)} />
          : <span>🏅</span>}
      </div>
      <h2>{badge.title}</h2>
      <p>{badge.description}</p>
      {badge.is_unlocked ? (
        badge.unlocked_at
          ? <time dateTime={badge.unlocked_at}>Mở khóa {dateFormat.format(new Date(badge.unlocked_at))}</time>
          : <span>Đã mở khóa</span>
      ) : (
        <>
          <progress
            aria-label={'Tiến độ ' + badge.title}
            max={Math.max(1, badge.condition_value)}
            value={Math.min(badge.condition_value, badge.current_progress)}
          />
          <small>{badge.current_progress}/{badge.condition_value} {units[badge.condition_type]}</small>
        </>
      )}
    </article>
  );
}
