// web/app/_arcade/createSetting.ts
//
// Factory for per-game (or cross-game) localStorage-backed settings. Same
// shape as `_arcade/Leaderboard.ts` so the two helpers feel symmetric:
// each consumer calls a `create*()` function and gets back a small object
// of bound methods. Settings used today: asteroids' color scheme,
// space-barrage's ship variant, and the cross-game `lastEntryName`
// (initials prefilled on the high-score entry input).
//
// **SSR-safe.** Every browser API access is guarded by
// `typeof window === 'undefined'`. On the server, get() returns the default
// and does not cache, so the first client render still reads the real
// value from localStorage.
//
// **Cached.** First client-side get() reads from localStorage (canonical
// key first, then `legacyKeys` fallback in priority order). Subsequent
// get()s return the cached value. set() writes to the canonical key and
// updates the cache.
//
// **Storage-key convention** for the arcade subsystem:
//   - Per-game settings: `arcade-<game>:<setting>`
//     (e.g. `arcade-asteroids:colorScheme`, `arcade-space-barrage:shipVariant`)
//   - Cross-game settings: `arcade:<setting>`
//     (e.g. `arcade:lastEntryName`)
// Per-game leaderboards follow the same shape (`arcade-<game>:leaderboard`)
// and live in `_arcade/Leaderboard.ts` with matching `legacyKeys` support.
//
// **Legacy keys.** Used for one-way migration: get() reads the canonical
// key first, then falls through `legacyKeys` in order if missing. set()
// only writes to the canonical key. Legacy values linger in localStorage
// harmlessly — no auto-cleanup, since deleting on first set() can surprise
// users on a downgrade. Future cleanup can grep + remove explicitly.

export interface SettingOptions<T> {
  /** Returned when storage is empty/invalid or window is unavailable. */
  default: T;
  /** Type-narrowing validator applied to the deserialized raw value.
   *  Each consumer ships its own — typically a small literal-set check
   *  (e.g. `raw === 'a' || raw === 'b'`). */
  isValid: (raw: unknown) => raw is T;
  /** Custom serializer for non-string T. Default: `String(value)`. */
  serialize?: (value: T) => string;
  /** Custom deserializer for non-string T. Default: identity (the raw
   *  string is passed straight to `isValid`). For object/array values,
   *  ship `JSON.parse` here and a shape-check `isValid`. */
  deserialize?: (raw: string) => unknown;
  /** Older storage keys to read-fall-through to, in priority order. Used
   *  only on get() when the canonical key is missing — set() always writes
   *  to the canonical storageKey. Legacy values linger; no auto-cleanup. */
  legacyKeys?: ReadonlyArray<string>;
}

export interface Setting<T> {
  get: () => T;
  set: (value: T) => void;
}

export function createSetting<T>(
  storageKey: string,
  opts: SettingOptions<T>,
): Setting<T> {
  const { default: defaultValue, isValid, legacyKeys } = opts;
  const serialize = opts.serialize ?? ((v: T): string => String(v));
  const deserialize = opts.deserialize ?? ((raw: string): unknown => raw);

  // `cacheHit` distinguishes "not yet read" from "read and got default" so
  // T can include `null` / falsy values without confusing the load path.
  let cached: T | null = null;
  let cacheHit = false;

  const readKey = (key: string): T | null => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return null;
      const parsed = deserialize(raw);
      return isValid(parsed) ? parsed : null;
    } catch {
      // Private mode / quota / malformed data — fall through to next key.
      return null;
    }
  };

  const readFromStorage = (): T => {
    if (typeof window === 'undefined') return defaultValue;
    const fromCanonical = readKey(storageKey);
    if (fromCanonical !== null) return fromCanonical;
    if (legacyKeys) {
      for (const legacy of legacyKeys) {
        const fromLegacy = readKey(legacy);
        if (fromLegacy !== null) return fromLegacy;
      }
    }
    return defaultValue;
  };

  const get = (): T => {
    if (cacheHit) return cached as T;
    const value = readFromStorage();
    // Don't cache the SSR default — first client read should hit storage.
    if (typeof window !== 'undefined') {
      cached = value;
      cacheHit = true;
    }
    return value;
  };

  const set = (value: T): void => {
    cached = value;
    cacheHit = true;
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, serialize(value));
    } catch {
      // Quota / private mode — match createLeaderboard's silent failure.
      // The cache still reflects the new value for this session.
    }
  };

  return { get, set };
}
