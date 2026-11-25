import { useCallback, useEffect, useRef, useState } from 'react';
import { badgeService, type Badge } from '../services/badgeService';

export function useBadges(userId?: string) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [pending, setPending] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const seen = useRef<Set<string> | null>(null);
  const active = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    active.current?.abort();
    const request = new AbortController();
    active.current = request;
    setLoading(true);
    setError(false);
    try {
      const catalog = await badgeService.list(request.signal);
      if (request.signal.aborted) return;
      const unlocked = catalog.filter(badge => badge.is_unlocked);
      if (seen.current) {
        const fresh = unlocked.filter(badge => !seen.current!.has(badge.id));
        if (fresh.length) setPending(current => [...current, ...fresh]);
      }
      seen.current ??= new Set();
      for (const badge of unlocked) seen.current.add(badge.id);
      setBadges(catalog);
    } catch {
      if (!request.signal.aborted) setError(true);
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    seen.current = null;
    setBadges([]);
    setPending([]);
    void refresh();
    return () => active.current?.abort();
  }, [refresh]);

  return {
    badges, loading, error, refresh,
    unlocked: pending[0],
    acknowledge: () => setPending(current => current.slice(1))
  };
}
