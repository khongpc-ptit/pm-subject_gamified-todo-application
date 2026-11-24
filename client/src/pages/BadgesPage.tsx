import '../components/badges/badges.css';
import { BadgeCard } from '../components/badges/BadgeCard';
import type { Badge } from '../services/badgeService';

interface BadgesPageProps {
  badges: Badge[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

export function BadgesPage({ badges, loading, error, onRetry }: BadgesPageProps) {
  return (
    <section aria-labelledby="showcase-title">
      <div className="page-title">
        <div>
          <h1 id="showcase-title">Bộ sưu tập huy hiệu</h1>
          {!loading && !error && <p>Đã mở khóa {badges.filter(badge => badge.is_unlocked).length}/{badges.length} huy hiệu</p>}
        </div>
      </div>
      {loading && <p role="status">Đang tải huy hiệu…</p>}
      {!loading && error && (
        <div className="card" role="alert">
          <p>Không thể tải huy hiệu.</p>
          <button type="button" onClick={onRetry}>Thử lại</button>
        </div>
      )}
      {!loading && !error && badges.length === 0 && <p className="card">Chưa có huy hiệu trong bộ sưu tập.</p>}
      {!loading && !error && badges.length > 0 &&
        <div className="badge-showcase-grid">
          {badges.map(badge => <BadgeCard key={badge._id} badge={badge} />)}
        </div>}
    </section>
  );
}
