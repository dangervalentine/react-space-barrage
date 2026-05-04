# Game Over Leaderboard — Design

## Goal

On player death, show a fake arcade leaderboard. Persist scores in localStorage so they survive reloads.

## User Flow

1. Player dies → `engine.isShipHit` becomes `true`.
2. App captures the final score and replaces `<GameCanvas>` with `<GameOverScreen>` inside the cabinet bezel.
3. If the score qualifies for the top 10, the screen prompts for a 3-letter name (uppercase alpha, `maxLength={3}`) and a SUBMIT button. Submitting persists the entry.
4. The screen then shows the top-10 board. The new entry (or, if the score didn't qualify, the player's would-be rank) is highlighted. Non-qualifying scores show "YOUR SCORE: N — RANK M" below the board.
5. PLAY AGAIN tears down and rebuilds the engine, returning to the live canvas.

## Modules

### `src/utils/leaderboard.ts` (new)

Pure module — no React, no DOM beyond `localStorage`.

```ts
export interface LeaderboardEntry { name: string; score: number; }
export const SEED_ENTRIES: LeaderboardEntry[]; // 10 hard-coded arcade entries, descending
export function loadLeaderboard(): LeaderboardEntry[];
export function saveLeaderboard(entries: LeaderboardEntry[]): void;
export function qualifies(score: number, board: LeaderboardEntry[]): boolean;
export function insert(board: LeaderboardEntry[], entry: LeaderboardEntry): LeaderboardEntry[];
export function getRank(score: number, board: LeaderboardEntry[]): number; // 1-based
```

- Storage key: `space-barrage-leaderboard`.
- `loadLeaderboard` returns `SEED_ENTRIES` (a fresh copy) if the key is missing, JSON-invalid, or the parsed value isn't an array of valid entries.
- `qualifies(score, board)`: `board.length < 10 || score > board[board.length - 1].score`. Tie does not qualify.
- `insert`: returns a new array, sorted by `score` descending, capped at 10.
- `getRank`: 1-based position the score would occupy (no cap — used to display "rank 14").
- Seed entries: 10 fixed `{name, score}` pairs with arcade-style initials and a descending spread (e.g. ACE/9000 down to BOB/500). Exact values chosen during implementation.

### `src/Components/GameOverScreen.tsx` (new)

```ts
interface Props { score: number; onPlayAgain: () => void; }
```

Internal state: `phase: 'entry' | 'board'` and `name: string`.

- On mount: load board, decide initial phase. `entry` if `qualifies(score, board)`, otherwise `board`.
- `entry` view: "NEW HIGH SCORE", `<input value={name} maxLength={3}>` that filters input to `[A-Z]` (uppercase as the user types), SUBMIT button (disabled when `name.length === 0`). Submit calls `insert` + `saveLeaderboard`, captures the new board, sets `phase = 'board'`.
- `board` view: ordered list of the current top 10 (rank, name, score). The newly inserted entry is visually highlighted. If the player didn't qualify, show "YOUR SCORE: {score} — RANK {getRank(score, board)}" below the list. PLAY AGAIN button calls `props.onPlayAgain`.
- Styling lives in `GameOverScreen.module.css`, matching the cabinet aesthetic of `LandingScreen`.

### `src/App.tsx` (modified)

- Add state: `finalScore: number | null`.
- In the engine's `onUpdate` callback path (via `onUpdateRef`), watch for `isShipHit` transitioning `false → true`. On the transition, capture `state.score` into `finalScore`.
- Render decision inside the bezel:
  - `!started` → `<LandingScreen>` (unchanged)
  - `finalScore !== null` → `<GameOverScreen score={finalScore} onPlayAgain={handlePlayAgain} />`
  - else → `<GameCanvas>` (unchanged)
- `handlePlayAgain`: clears `finalScore`, sets `started` to trigger the existing engine-rebuild effect. (Implementation detail: may need to toggle `started` off/on within an effect, or restructure the engine effect to also depend on a "session id" counter — pick whichever is cleaner during implementation.)

### `src/engine/GameEngine.ts` (modified)

Remove the `SPACE` branch in `handleKeyDown` that resets state when `isShipHit` is true. Restart now happens via the App-level PLAY AGAIN button. The engine no longer self-restarts; it just halts simulation while `isShipHit` is true, which is the existing behavior.

## Data Flow

```
death → engine.isShipHit=true → App.onUpdate detects transition →
finalScore captured → <GameOverScreen> mounted →
  qualifies? entry → submit → save to localStorage → board view
  not qualifies? board view directly with rank
PLAY AGAIN → App rebuilds engine → <GameCanvas>
```

## Error Handling

- `localStorage` unavailable / throws (private mode, quota): `loadLeaderboard` falls back to `SEED_ENTRIES`; `saveLeaderboard` swallows the error (no UI feedback — the leaderboard just won't persist this session).
- Corrupt JSON / wrong shape: same as above, fall back to seed.

## Testing

`src/utils/leaderboard.test.ts` (vitest, jsdom):

- `loadLeaderboard` returns seed when storage empty.
- `loadLeaderboard` returns seed when storage value is malformed JSON.
- `loadLeaderboard` returns seed when stored value isn't a valid entry array.
- `loadLeaderboard` returns parsed entries when valid.
- `qualifies` true when board has fewer than 10 entries.
- `qualifies` true when score strictly greater than lowest.
- `qualifies` false on tie with lowest.
- `insert` keeps board sorted descending and capped at 10.
- `insert` drops the previous lowest when full.
- `getRank` returns correct 1-based rank for scores above, between, and below entries.
- `saveLeaderboard` round-trips through `loadLeaderboard`.

No engine tests — the only engine change is deleting a small branch.

## Out of Scope

- Real backend / shared leaderboard.
- Editing or clearing the leaderboard from the UI.
- Multiple difficulty boards.
- Animations beyond what fits naturally with existing CSS.
