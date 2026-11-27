import { useEffect, useRef, useState } from 'react';
import type { Badge } from '../../services/badgeService';

export function BadgeUnlockModal({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [failedIcon, setFailedIcon] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog className="badge-unlock-dialog" ref={dialog} aria-labelledby="badge-unlock-title"
      onCancel={event => { event.preventDefault(); onClose(); }}>
      <div className="badge-confetti" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <span key={index}
          style={{ left: (8 + index * 8) + '%', animationDelay: (index % 4) * 90 + 'ms' }} />)}
      </div>
      {badge.icon_url && !failedIcon && (
        <img
          src={badge.icon_url}
          alt={badge.title}
          width={72}
          height={72}
          loading="lazy"
          decoding="async"
          className="badge-unlock-icon"
          onError={() => setFailedIcon(true)}
        />
      )}
      <p className="eyebrow">Huy hiệu mới</p>
      <h2 id="badge-unlock-title">{badge.title}</h2>
      <p>{badge.description}</p>
      <button type="button" className="primary" onClick={onClose}>Tiếp tục chinh phục</button>
    </dialog>
  );
}
