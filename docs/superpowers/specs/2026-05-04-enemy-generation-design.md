# Enemy Generation System Design

**Date**: May 4, 2026  
**Scope**: Progressive difficulty, formation patterns, responsive scaling  
**Duration**: 5-minute game session  

---

## 1. Overview

The enemy generation system coordinates enemy spawning across difficulty tiers, pattern types, and responsive screen sizes. Enemies spawn in predetermined formations (walls, diagonals, gaps, random) that grow progressively harder to navigate as the player's score increases.

### Key Goals
- Progressive difficulty scaling with score (every 50 points)
- Intentional formation patterns mixed with randomness to prevent predictability fatigue
- Responsive layout: fixed column count, variable enemy size (scales with screen)
- Extensible pattern system for future additions (funnels, threading patterns)

---

## 2. Responsive Grid System

### Column Architecture

All enemy spawn positions are based on a **fixed column grid** that scales proportionally with screen size.

**Grid constants:**
```
NUM_COLUMNS = 10  // Always 10 columns, regardless of screen size
COLUMN_WIDTH = GAME_WIDTH / NUM_COLUMNS

// Derived scaling values
PADDING = COLUMN_WIDTH * 0.1  // 10% padding on each side
ENEMY_SIZE = COLUMN_WIDTH - (2 * PADDING)  // Scales with screen
VERTICAL_SPACING = COLUMN_WIDTH  // Grid aspect ratio 1:1
```

**Examples across screen sizes:**

| Screen Width | Column Width | Enemy Size | Padding |
|---|---|---|---|
| 1080px | 108px | ~86px | ~11px |
| 540px | 54px | ~43px | ~5.4px |
| 400px | 40px | ~32px | ~4px |

### Spawn Positioning

Enemies spawn at discrete column indices (0–9). Multiple enemies can occupy the same column, provided they maintain `VERTICAL_SPACING` between them vertically.

**Column center calculation:**
```typescript
const columnCenterX = (columnIndex + 0.5) * COLUMN_WIDTH;
```

**Collision avoidance:** No two enemies in the same column can have vertical positions within `VERTICAL_SPACING` of each other.

---

## 3. Difficulty Progression

Difficulty increases every 50 points, with three parameters scaling:
1. **Pattern type** (wall → random → diagonal → etc.)
2. **Enemy traverse speed** (discrete jump, not gradual)
3. **Max simultaneous enemies** (soft cap, increases by 1 per interval)

### Progression Table

| Score Range | Pattern Type | Max Enemies | Traverse Duration (ms) | Notes |
|---|---|---|---|---|
| 0–50 | Wall | 5 | 8000 | Half-screen walls with gaps |
| 50–100 | Random | 6 | 7400 | Varied spawn timing & columns |
| 100–150 | Diagonal | 7 | 6800 | L→R and R→L staggered waves |
| 150–200 | Random | 8 | 6200 | Unpredictable, keeps pressure |
| 200–250 | Gaps | 9 | 5600 | Every other column filled |
| 250–300 | Random | 10 | 5000 | Final ramp before cycle repeat |
| 300–350 | Wall | 11 | 4400 | Cycle repeats, faster |
| 350–400 | Diagonal | 12 | 3800 | ... (continues) |

**Speed scaling:** Enemy traverse duration decreases by ~600ms per 50-point interval. By score 300, enemies traverse at 3.4× baseline speed.

---

## 4. Pattern Definitions

### Wall Pattern (Scores 0–50, 300–350, etc.)

**Behavior:** Spawns a subset of columns with guaranteed gaps, never filling the entire row.

- Select `max_enemies` columns randomly from 10
- Enforce: at least 1 empty column between any two selected columns
- All selected columns spawn at the same time interval (staggered by ~50ms for smoothness)
- Example spawns:
  - Max 5: `[1, 3, 5, 7, 9]` or `[0, 2, 4, 6, 8]` or `[2, 4, 6, 8, 10]`
  - Max 8: `[0, 2, 3, 5, 6, 8, 9]` (leaves 1 gap total)

**Visual intent:** A wall formation with intentional weak points for the player to navigate through.

### Diagonal Pattern (Scores 100–150, 350–400, etc.)

**Behavior:** Enemies spawn in a diagonal stagger, creating a visual slash downward.

**Left-to-right direction:**
- Columns: `[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]`
- Stagger: 100ms between each spawn
- Visual: diagonal line moving down-right

**Right-to-left direction:**
- Columns: `[9, 8, 7, 6, 5, 4, 3, 2, 1, 0]`
- Stagger: 100ms between each spawn
- Visual: diagonal line moving down-left

Patterns alternate direction for variety within the 50-point window.

### Gap Pattern (Scores 200–250)

**Behavior:** Fills either odd or even columns (creates vertical lines with gaps).

- 50/50 coin flip each cycle: alternate columns or stay the same?
- If alternating: `[1, 3, 5, 7, 9]` → next cycle → `[0, 2, 4, 6, 8]`
- If staying: `[1, 3, 5, 7, 9]` → next cycle → re-roll (may alternate or not)

**Visual intent:** Vertical striped wall the player threads between.

### Random Pattern (Scores 50–100, 150–200, 250–300, etc.)

**Behavior:** Unpredictable spawns to break pattern fatigue.

- Spawn 1–2 enemies at random columns (max enemy count cap enforced)
- Randomized spawn intervals: 200–800ms
- No column constraints—can fill densely or sparsely

**Visual intent:** Keeps gameplay unpredictable, forces adaptation.

### Future Patterns (Extensible, not in MVP)

**Funnel Pattern:** Diagonal enemies converging in the middle, then dispersing into columns.  
**Threading Pattern:** Tall column of alternating enemy-gap-enemy, forcing the player to thread a needle.

These are noted in code structure but not implemented initially.

---

## 5. Core Data Structures

### Enemy Spawn Event

```typescript
interface EnemySpawnEvent {
  columnIndex: number;        // 0–9
  delayMs: number;            // Delay relative to pattern start time
  patternId: string;          // e.g., "wall_0", "diagonal_ltr_1"
}
```

### Pattern Cycle

```typescript
interface PatternCycle {
  patternType: "wall" | "diagonal" | "gaps" | "random";
  spawns: EnemySpawnEvent[];
  durationMs: number;         // How long pattern lasts before next transition
  scoreRange: [number, number];
  metadata?: {
    direction?: "ltr" | "rtl";  // For diagonals
    alternating?: boolean;       // For gaps
  };
}
```

### Difficulty Tier

```typescript
interface DifficultyTier {
  scoreStart: number;
  scoreEnd: number;
  maxEnemies: number;
  enemyTraverseDurationMs: number;
  patternType: string;
}
```

---

## 6. System Architecture

### Three-Layer Design

**Layer 1: Column Manager**
- Maintains grid state (which columns are occupied, when they free up)
- Validates spawn requests (no overlaps within `VERTICAL_SPACING`)
- Provides utilities for pattern generators to query available columns

**Layer 2: Pattern Engine**
- Generates pattern cycles based on current score
- Returns spawn events scheduled at specific times
- Handles pattern transitions at 50-point boundaries

**Layer 3: Difficulty Scaler**
- Determines current difficulty tier from score
- Updates max enemy count, traverse speed at boundaries
- Signals pattern transitions to Pattern Engine

### Integration with GameEngine

The existing `spawnEnemies()` TODO method will:
1. Query current score and difficulty tier
2. Ask Pattern Engine for next spawn events
3. Schedule enemy creation at target timestamps
4. Update Column Manager with occupied lanes
5. Enforce max enemy cap (don't spawn if cap reached)

Enemies are recycled after exiting the screen (marked `removedAt`, ready for reuse). No hard deletion.

---

## 7. Game Flow (Session)

1. **Score 0–50:** Walls spawn with gaps, player learns to navigate
2. **Score 50–100:** Random enemies keep pressure variable
3. **Score 100–150:** Diagonals challenge directional dodging
4. **Score 150–200:** Random breaks predictability
5. **Score 200–250:** Gaps create vertical threading challenge
6. **Score 250–300:** Random final ramp-up
7. **Score 300+:** Patterns repeat with 3.4× speed, progressively harder until game ends (~5 minutes)

---

## 8. Design Rationale

**Fixed columns, variable sizing:** Ensures the game plays identically on mobile (540px), tablet (1080px), and desktop—only visual scale changes.

**Pattern + random mix:** Patterns teach specific dodging skills; random phases prevent memorization and keep players adapting.

**50-point intervals:** Clear progression milestones, simple scoring threshold for difficulty changes.

**Soft enemy caps:** Prevents overwhelming; scales naturally with difficulty.

**Column-based spawning:** Eliminates position overlap, creates clean formation visuals, enables predictable pattern design.

**Vertical grid spacing:** 1:1 aspect ratio maintains consistent spatial relationships across screen sizes.

---

## 9. Known Limitations & Future Work

- **Initial patterns only:** Wall, diagonal, gaps, random. Funnels and threading patterns deferred.
- **No dynamic speed curves:** Speed is step-wise at 50-point boundaries, not gradual within intervals.
- **Single enemy type:** Using one of three available enemy variations; others reserved for future.
- **No adaptive difficulty:** Difficulty scales by score only, not by player performance.

---

## 10. Testing Checklist (for implementation)

- [ ] Enemies spawn at correct column positions across screen sizes
- [ ] No collision/overlap within same column (respects `VERTICAL_SPACING`)
- [ ] Wall patterns always have gaps (never fill entire row)
- [ ] Diagonal stagger creates visible diagonal line visually
- [ ] Max enemy cap enforced (no more than tier allows)
- [ ] Speed increases at each 50-point boundary
- [ ] Pattern transitions trigger correctly at score thresholds
- [ ] Random pattern spawns vary unpredictably
- [ ] Gap pattern coin-flip works (alternates or re-rolls)
- [ ] Responsive scaling: 540px and 1080px play identically (scaled)
- [ ] Enemies recycle properly after exiting screen
