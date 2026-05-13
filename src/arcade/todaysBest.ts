// web/app/_arcade/todaysBest.ts
//
// Single-value localStorage helper for guests. Stores their best score
// of the current calendar day (player's local timezone), expires at
// next local midnight. Read returns null if expired (treats as "no
// entry today"). set() only writes if the new score beats the current
// non-expired score.
//
// Per-game key convention: `arcade-<game>:todaysBest`.
//
// SSR-safe: typeof window === 'undefined' returns null and skips writes.

export interface TodaysBestEntry {
  score: number;
  expiresAt: number; // epoch ms
}

function nextLocalMidnight(): number {
  const d = new Date();
  // setHours(24, 0, 0, 0) sets to next midnight in local timezone.
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

function isValidEntry(value: unknown): value is TodaysBestEntry {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.score === 'number' && typeof v.expiresAt === 'number';
}

export interface TodaysBest {
  get(): TodaysBestEntry | null;
  set(score: number): void;
  clear(): void;
}

export function createTodaysBest(storageKey: string): TodaysBest {
  const get = (): TodaysBestEntry | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!isValidEntry(parsed)) return null;
      if (Date.now() > parsed.expiresAt) {
        // Expired — clear and treat as no entry.
        localStorage.removeItem(storageKey);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const set = (score: number): void => {
    if (typeof window === 'undefined') return;
    const current = get();
    if (current && score <= current.score) return;
    const entry: TodaysBestEntry = {
      score,
      expiresAt: nextLocalMidnight(),
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch {
      console.warn(`Failed to save todaysBest "${storageKey}"`);
    }
  };

  const clear = (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* swallow */
    }
  };

  return { get, set, clear };
}
