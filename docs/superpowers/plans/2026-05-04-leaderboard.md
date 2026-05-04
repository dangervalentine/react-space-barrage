# Game Over Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a fake arcade leaderboard on game over, persist scores in localStorage.

**Architecture:** Pure utility module (`leaderboard.ts`) handles seed data + storage + qualification logic. New `GameOverScreen` React component handles 3-letter name entry and board display. `App.tsx` detects the game-over transition from the engine and swaps in the screen; PLAY AGAIN rebuilds the engine via a session counter. Engine loses its space-to-restart branch.

**Tech Stack:** React 18, TypeScript, Vitest (jsdom), CSS modules.

**Note for executor:** Do not run `git commit` and do not ask whether to commit. The user handles commits themselves.

---

## File Structure

- Create: `src/utils/leaderboard.ts` — pure leaderboard logic + localStorage persistence
- Create: `src/utils/leaderboard.test.ts` — vitest unit tests
- Create: `src/Components/GameOverScreen.tsx` — name entry + board UI
- Create: `src/Components/GameOverScreen.module.css` — styling
- Modify: `src/engine/GameEngine.ts` — remove space-to-restart branch
- Modify: `src/App.tsx` — game-over flow + engine rebuild via session counter

---

## Task 1: Leaderboard utility (TDD)

**Files:**
- Create: `src/utils/leaderboard.ts`
- Create: `src/utils/leaderboard.test.ts`

- [ ] **Step 1.1: Write failing tests**

Create `src/utils/leaderboard.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import {
  SEED_ENTRIES,
  loadLeaderboard,
  saveLeaderboard,
  qualifies,
  insert,
  getRank,
  type LeaderboardEntry,
} from './leaderboard';

const STORAGE_KEY = 'space-barrage-leaderboard';

describe('leaderboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('SEED_ENTRIES', () => {
    it('contains exactly 10 entries sorted descending by score', () => {
      expect(SEED_ENTRIES).toHaveLength(10);
      for (let i = 1; i < SEED_ENTRIES.length; i++) {
        expect(SEED_ENTRIES[i - 1].score).toBeGreaterThanOrEqual(SEED_ENTRIES[i].score);
      }
    });

    it('every entry has a 3-letter uppercase name', () => {
      for (const entry of SEED_ENTRIES) {
        expect(entry.name).toMatch(/^[A-Z]{3}$/);
      }
    });
  });

  describe('loadLeaderboard', () => {
    it('returns seed entries when storage is empty', () => {
      expect(loadLeaderboard()).toEqual(SEED_ENTRIES);
    });

    it('returns seed entries when stored value is malformed JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not-json');
      expect(loadLeaderboard()).toEqual(SEED_ENTRIES);
    });

    it('returns seed entries when stored value is not an array of entries', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ wrong: 'shape' }));
      expect(loadLeaderboard()).toEqual(SEED_ENTRIES);
    });

    it('returns seed entries when array contains invalid entries', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([{ name: 'AAA' }]));
      expect(loadLeaderboard()).toEqual(SEED_ENTRIES);
    });

    it('returns parsed entries when storage holds a valid array', () => {
      const stored: LeaderboardEntry[] = [
        { name: 'XYZ', score: 999 },
        { name: 'ABC', score: 100 },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      expect(loadLeaderboard()).toEqual(stored);
    });

    it('returns a fresh copy of seed entries (not a shared reference)', () => {
      const a = loadLeaderboard();
      const b = loadLeaderboard();
      expect(a).not.toBe(b);
    });
  });

  describe('saveLeaderboard', () => {
    it('round-trips through loadLeaderboard', () => {
      const entries: LeaderboardEntry[] = [{ name: 'ZZZ', score: 1 }];
      saveLeaderboard(entries);
      expect(loadLeaderboard()).toEqual(entries);
    });
  });

  describe('qualifies', () => {
    it('is true when board has fewer than 10 entries', () => {
      expect(qualifies(1, [])).toBe(true);
      expect(qualifies(1, SEED_ENTRIES.slice(0, 9))).toBe(true);
    });

    it('is true when score is strictly greater than the lowest', () => {
      const lowest = SEED_ENTRIES[SEED_ENTRIES.length - 1].score;
      expect(qualifies(lowest + 1, SEED_ENTRIES)).toBe(true);
    });

    it('is false on tie with the lowest entry', () => {
      const lowest = SEED_ENTRIES[SEED_ENTRIES.length - 1].score;
      expect(qualifies(lowest, SEED_ENTRIES)).toBe(false);
    });

    it('is false when score is below the lowest entry', () => {
      const lowest = SEED_ENTRIES[SEED_ENTRIES.length - 1].score;
      expect(qualifies(lowest - 1, SEED_ENTRIES)).toBe(false);
    });
  });

  describe('insert', () => {
    it('keeps board sorted descending and capped at 10', () => {
      const result = insert(SEED_ENTRIES, { name: 'NEW', score: 99999 });
      expect(result).toHaveLength(10);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
      }
      expect(result[0]).toEqual({ name: 'NEW', score: 99999 });
    });

    it('drops the previous lowest when board is full', () => {
      const previousLowest = SEED_ENTRIES[SEED_ENTRIES.length - 1];
      const result = insert(SEED_ENTRIES, { name: 'NEW', score: previousLowest.score + 1 });
      expect(result).not.toContainEqual(previousLowest);
      expect(result).toHaveLength(10);
    });

    it('does not mutate the input array', () => {
      const before = [...SEED_ENTRIES];
      insert(SEED_ENTRIES, { name: 'NEW', score: 99999 });
      expect(SEED_ENTRIES).toEqual(before);
    });
  });

  describe('getRank', () => {
    it('returns 1 for a score above all entries', () => {
      const top = SEED_ENTRIES[0].score;
      expect(getRank(top + 1, SEED_ENTRIES)).toBe(1);
    });

    it('returns the correct mid-board rank', () => {
      const board: LeaderboardEntry[] = [
        { name: 'AAA', score: 100 },
        { name: 'BBB', score: 80 },
        { name: 'CCC', score: 60 },
      ];
      expect(getRank(70, board)).toBe(3);
    });

    it('returns rank past the end for a score below the lowest', () => {
      const board: LeaderboardEntry[] = [
        { name: 'AAA', score: 100 },
        { name: 'BBB', score: 80 },
      ];
      expect(getRank(10, board)).toBe(3);
    });

    it('treats a tie as the lower rank (after the equal entry)', () => {
      const board: LeaderboardEntry[] = [
        { name: 'AAA', score: 100 },
        { name: 'BBB', score: 80 },
      ];
      expect(getRank(80, board)).toBe(3);
    });
  });
});
```

- [ ] **Step 1.2: Run tests, confirm they fail**

Run: `npx vitest run src/utils/leaderboard.test.ts`
Expected: All tests fail with module-not-found errors.

- [ ] **Step 1.3: Implement the utility**

Create `src/utils/leaderboard.ts`:

```ts
const STORAGE_KEY = 'space-barrage-leaderboard';
const MAX_ENTRIES = 10;

export interface LeaderboardEntry {
  name: string;
  score: number;
}

export const SEED_ENTRIES: ReadonlyArray<LeaderboardEntry> = [
  { name: 'ACE', score: 1000 },
  { name: 'ZAP', score: 900 },
  { name: 'NEO', score: 800 },
  { name: 'REX', score: 700 },
  { name: 'KAI', score: 600 },
  { name: 'JET', score: 500 },
  { name: 'VIC', score: 400 },
  { name: 'MAX', score: 300 },
  { name: 'PIX', score: 200 },
  { name: 'BOB', score: 100 },
];

const isValidEntry = (value: unknown): value is LeaderboardEntry => {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.name === 'string' && typeof v.score === 'number';
};

const seedCopy = (): LeaderboardEntry[] => SEED_ENTRIES.map((e) => ({ ...e }));

export const loadLeaderboard = (): LeaderboardEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedCopy();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isValidEntry)) return seedCopy();
    return parsed;
  } catch {
    return seedCopy();
  }
};

export const saveLeaderboard = (entries: LeaderboardEntry[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    console.warn('Failed to save leaderboard to localStorage');
  }
};

export const qualifies = (score: number, board: LeaderboardEntry[]): boolean => {
  if (board.length < MAX_ENTRIES) return true;
  return score > board[board.length - 1].score;
};

export const insert = (
  board: LeaderboardEntry[],
  entry: LeaderboardEntry,
): LeaderboardEntry[] => {
  const next = [...board, entry];
  next.sort((a, b) => b.score - a.score);
  return next.slice(0, MAX_ENTRIES);
};

export const getRank = (score: number, board: LeaderboardEntry[]): number => {
  let rank = 1;
  for (const entry of board) {
    if (entry.score >= score) rank += 1;
    else break;
  }
  return rank;
};
```

- [ ] **Step 1.4: Run tests, confirm they pass**

Run: `npx vitest run src/utils/leaderboard.test.ts`
Expected: All tests pass.

---

## Task 2: GameOverScreen component

**Files:**
- Create: `src/Components/GameOverScreen.tsx`
- Create: `src/Components/GameOverScreen.module.css`

- [ ] **Step 2.1: Create the stylesheet**

Create `src/Components/GameOverScreen.module.css`:

```css
@import url('../constants/colors.css');

.wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #200a0a 0%, #050203 80%);
  font-family: 'PressStart2P-Regular', monospace;
  color: var(--color-text);
  user-select: none;
  overflow: hidden;
}

.panel {
  position: relative;
  width: min(70%, 560px);
  background: var(--color-bg-base);
  padding: 24px 28px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  border: 2px solid var(--color-accent-pink, #f06);
  box-shadow: 0 0 24px rgba(255, 0, 102, 0.4);
}

.title {
  margin: 0;
  font-size: clamp(20px, 4vw, 32px);
  color: var(--color-accent-pink, #f06);
  letter-spacing: 0.1em;
}

.subtitle {
  margin: 0;
  font-size: clamp(10px, 1.6vw, 14px);
  color: var(--color-accent-yellow, #ffd23f);
}

.scoreLine {
  font-size: clamp(12px, 2vw, 16px);
}

.entryForm {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.nameInput {
  width: 6ch;
  padding: 8px 4px;
  text-align: center;
  font-family: inherit;
  font-size: clamp(20px, 4vw, 32px);
  letter-spacing: 0.4em;
  text-transform: uppercase;
  background: #000;
  color: var(--color-accent-green, #39ff14);
  border: 2px solid var(--color-accent-green, #39ff14);
  outline: none;
}

.button {
  font-family: inherit;
  font-size: clamp(10px, 1.8vw, 14px);
  padding: 10px 18px;
  background: var(--color-accent-pink, #f06);
  color: #000;
  border: none;
  cursor: pointer;
  letter-spacing: 0.1em;
}

.button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.board {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: clamp(10px, 1.6vw, 14px);
}

.row {
  display: grid;
  grid-template-columns: 3ch 4ch 1fr;
  gap: 12px;
  padding: 4px 6px;
}

.rowHighlight {
  background: rgba(255, 210, 63, 0.18);
  color: var(--color-accent-yellow, #ffd23f);
}

.rank {
  text-align: right;
}

.scoreCell {
  text-align: right;
}

.rankLine {
  margin-top: 4px;
  font-size: clamp(10px, 1.6vw, 14px);
  color: var(--color-accent-yellow, #ffd23f);
}
```

- [ ] **Step 2.2: Create the component**

Create `src/Components/GameOverScreen.tsx`:

```tsx
import React, { useMemo, useState } from 'react';
import {
  loadLeaderboard,
  saveLeaderboard,
  qualifies,
  insert,
  getRank,
  type LeaderboardEntry,
} from '../utils/leaderboard';
import styles from './GameOverScreen.module.css';

interface GameOverScreenProps {
  score: number;
  onPlayAgain: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, onPlayAgain }) => {
  const initialBoard = useMemo(() => loadLeaderboard(), []);
  const initiallyQualifies = useMemo(
    () => qualifies(score, initialBoard),
    [score, initialBoard],
  );

  const [board, setBoard] = useState<LeaderboardEntry[]>(initialBoard);
  const [phase, setPhase] = useState<'entry' | 'board'>(
    initiallyQualifies ? 'entry' : 'board',
  );
  const [name, setName] = useState('');
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    setName(cleaned);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length === 0) return;
    const entry: LeaderboardEntry = { name, score };
    const nextBoard = insert(board, entry);
    saveLeaderboard(nextBoard);
    setBoard(nextBoard);
    const idx = nextBoard.findIndex((b) => b === entry);
    setHighlightIndex(idx >= 0 ? idx : null);
    setPhase('board');
  };

  const playerRank = !initiallyQualifies ? getRank(score, board) : null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.panel}>
        <h1 className={styles.title}>GAME OVER</h1>
        <p className={styles.scoreLine}>SCORE: {score}</p>

        {phase === 'entry' ? (
          <form className={styles.entryForm} onSubmit={handleSubmit}>
            <p className={styles.subtitle}>★ NEW HIGH SCORE ★</p>
            <input
              className={styles.nameInput}
              value={name}
              onChange={handleNameChange}
              maxLength={3}
              autoFocus
              aria-label="Enter your initials"
            />
            <button
              type="submit"
              className={styles.button}
              disabled={name.length === 0}
            >
              SUBMIT
            </button>
          </form>
        ) : (
          <>
            <div className={styles.board}>
              {board.map((entry, i) => (
                <div
                  key={i}
                  className={`${styles.row} ${i === highlightIndex ? styles.rowHighlight : ''}`}
                >
                  <span className={styles.rank}>{i + 1}</span>
                  <span>{entry.name}</span>
                  <span className={styles.scoreCell}>{entry.score}</span>
                </div>
              ))}
            </div>
            {playerRank !== null && (
              <p className={styles.rankLine}>
                YOUR RANK: {playerRank}
              </p>
            )}
            <button type="button" className={styles.button} onClick={onPlayAgain}>
              PLAY AGAIN
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GameOverScreen;
```

- [ ] **Step 2.3: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors.

---

## Task 3: Remove engine self-restart

**Files:**
- Modify: `src/engine/GameEngine.ts:62-75` (the `handleKeyDown` SPACE branch)

- [ ] **Step 3.1: Replace the SPACE branch**

In `src/engine/GameEngine.ts`, find:

```ts
  handleKeyDown(keyCode: number): void {
    if (keyCode === KEYS.SPACE) {
      if (this.state.isShipHit) {
        this.startTime = performance.now();
        this.state = this.makeInitialState(this.startTime);
        this.lastTime = this.startTime;
        this.onUpdate(this.state);
      } else if (performance.now() - this.state.lastHitTime >= RESPAWN_DURATION_MS) {
        this.shoot();
      }
      return;
    }
    this.pressedKeys.add(keyCode);
  }
```

Replace with:

```ts
  handleKeyDown(keyCode: number): void {
    if (keyCode === KEYS.SPACE) {
      if (
        !this.state.isShipHit &&
        performance.now() - this.state.lastHitTime >= RESPAWN_DURATION_MS
      ) {
        this.shoot();
      }
      return;
    }
    this.pressedKeys.add(keyCode);
  }
```

- [ ] **Step 3.2: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3.3: Run engine tests**

Run: `npx vitest run src/engine`
Expected: All existing tests pass.

---

## Task 4: Wire game-over flow into App

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 4.1: Add imports and state**

In `src/App.tsx`, add the import alongside the existing component imports:

```tsx
import { GameOverScreen } from './Components/GameOverScreen';
```

In the `App` component body, replace this block:

```tsx
  const [started, setStarted] = useState(false);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const onUpdateRef = useRef<(state: GameState) => void>(() => {
    // Placeholder - will be set by GameCanvas
  });
```

with:

```tsx
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState(0);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const wasShipHitRef = useRef(false);
  const latestScoreRef = useRef(0);
  const onUpdateRef = useRef<(state: GameState) => void>(() => {
    // Placeholder - will be set by GameCanvas
  });
```

- [ ] **Step 4.2: Update the engine effect to depend on sessionId and detect game over**

Replace the existing engine `useEffect`:

```tsx
  useEffect(() => {
    if (!started) return;
    console.log('App mounted, starting engine');
    const newEngine = new GameEngine((state) => {
      onUpdateRef.current(state);
    });
    setEngine(newEngine);
    newEngine.start();

    return () => {
      console.log('App unmounting, stopping engine');
      newEngine.stop();
    };
  }, [started]);
```

with:

```tsx
  useEffect(() => {
    if (!started) return;
    wasShipHitRef.current = false;
    latestScoreRef.current = 0;

    const newEngine = new GameEngine((state) => {
      latestScoreRef.current = state.score;
      if (state.isShipHit && !wasShipHitRef.current) {
        wasShipHitRef.current = true;
        setFinalScore(latestScoreRef.current);
      }
      onUpdateRef.current(state);
    });
    setEngine(newEngine);
    newEngine.start();

    return () => {
      newEngine.stop();
    };
  }, [started, sessionId]);
```

- [ ] **Step 4.3: Add play-again handler and update render branch**

Add this handler above the existing `handleFireDown`:

```tsx
  const handlePlayAgain = () => {
    setFinalScore(null);
    setSessionId((id) => id + 1);
  };
```

Replace this JSX block inside the `screenBezel` div:

```tsx
        {started ? (
          <GameCanvas engine={engine} onUpdateRef={onUpdateRef} />
        ) : (
          <LandingScreen onStart={() => setStarted(true)} />
        )}
```

with:

```tsx
        {!started ? (
          <LandingScreen onStart={() => setStarted(true)} />
        ) : finalScore !== null ? (
          <GameOverScreen score={finalScore} onPlayAgain={handlePlayAgain} />
        ) : (
          <GameCanvas engine={engine} onUpdateRef={onUpdateRef} />
        )}
```

- [ ] **Step 4.4: Guard the fire button against game-over presses**

Replace:

```tsx
  const handleFireDown = () => {
    if (!started) {
      setStarted(true);
      return;
    }
    engine?.handleKeyDown(32);
  };
```

with:

```tsx
  const handleFireDown = () => {
    if (!started) {
      setStarted(true);
      return;
    }
    if (finalScore !== null) return;
    engine?.handleKeyDown(32);
  };
```

- [ ] **Step 4.5: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4.6: Run full test suite**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 4.7: Manual verification (dev server)**

Run: `npm start`

Verify in browser:
1. Start game, lose all 3 lives → GameOverScreen appears.
2. If score > 500 (lowest seed), 3-letter input is shown; type letters (lowercase auto-uppercases, digits/symbols are filtered, max 3 chars), submit → board shows with the new entry highlighted.
3. If score ≤ 500 (or 0), board shows immediately with "YOUR RANK: N" below.
4. PLAY AGAIN returns to a fresh game with lives=3 and score=0.
5. Reload the page, lose again → previously submitted entries persist on the board.
6. Check DevTools → Application → Local Storage: `space-barrage-leaderboard` key contains a JSON array.

---

## Self-Review Notes

- Spec coverage: leaderboard module (Task 1), GameOverScreen with both phases and rank display (Task 2), engine restart removal (Task 3), App wiring with rebuild via `sessionId` (Task 4). All spec sections covered.
- Type consistency: `LeaderboardEntry`, `loadLeaderboard`, `saveLeaderboard`, `qualifies`, `insert`, `getRank` names are identical across spec, tests, util, and component.
- The `GameOverScreen` finds the inserted entry via reference identity (`b === entry`) — works because `insert` preserves the same object reference in the returned array.
- The fire-button guard in 4.4 prevents the "press fire to start" handler from firing space at a stopped engine on the game-over screen; PLAY AGAIN is the only path back into a game.
