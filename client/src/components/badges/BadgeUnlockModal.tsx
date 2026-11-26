import { useEffect, useRef } from 'react';
import type { Badge } from '../../services/badgeService';

export function BadgeUnlockModal({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
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
      <p className="eyebrow">Huy hiệu mới</p>
      <h2 id="badge-unlock-title">{badge.title}</h2>
      <p>{badge.description}</p>
      <button type="button" className="primary" onClick={onClose}>Tiếp tục chinh phục</button>
    </dialog>
  );
}
