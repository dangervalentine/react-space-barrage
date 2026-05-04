# Aggressive Difficulty Scaling Design

**Date:** 2026-05-04  
**Scope:** Recalibrate `DifficultyScaler` to create an immediately threatening game that escalates faster.

## Problem

The current game is too easy at the start and takes too long to become difficult. Players experience an extended warm-up period before facing meaningful challenge—enemies are sparse, slow, and predictable for the first 2-3 minutes.

## Solution

Recalibrate `DifficultyScaler` with three changes:

1. **Aggressive base tier values** — Increase starting enemy counts and dramatically reduce starting enemy speed
2. **Shorter progression cycles** — Compress difficulty scaling so tiers escalate 50% faster
3. **Extended speed range** — Lower the minimum enemy speed from 1000ms to 500ms to provide more progression headroom

## Implementation Details

### Base Tier Values

Replace the current `baseTiers` array in `DifficultyScaler` with these values. These represent a single 200-point cycle and repeat:

| Tier | Enemies | Speed (ms) | Pattern |
|------|---------|-----------|---------|
| 0    | 7       | 2000      | wall    |
| 1    | 8       | 1900      | random  |
| 2    | 9       | 1800      | diagonal |
| 3    | 10      | 1700      | random  |
| 4    | 11      | 1600      | gaps    |
| 5    | 12      | 1500      | random  |

**Rationale:**
- Starting at 2000ms (vs 8000ms) creates immediate threat—enemies cross the screen in 2 seconds, leaving little time to react
- 7 enemies fills the screen with activity from the beginning
- 100ms speed decrements per tier preserve granularity and allow subtle progression changes
- Enemy count scaling (7→12) provides visible escalation within a cycle

### Progression Constants

Update these values in `DifficultyScaler`:

- **`cycleLength`**: Change from 300 to **200 points**
  - Cycles complete 50% faster, causing the player to advance through all 6 tiers twice as quickly
  
- **`tierDuration`**: Change from 50 to **35 points** per tier
  - Sharper transitions between tiers (one every 35 points instead of 50)
  
- **Speed scaling per cycle**: Change from -600ms to **-300ms**
  - Applied after each complete 200-point cycle
  - Each cycle: tiers drop from their base speed to 300ms lower
  - Cycle 0 (0-200pts): 2000-1500ms range
  - Cycle 1 (200-400pts): 1700-1200ms range
  - Cycle 2 (400-600pts): 1400-900ms range
  - Continues until hitting **500ms minimum** (vs 1000ms previously)

### Expected Progression Timeline

| Score | Elapsed Time | Enemies | Speed | Difficulty |
|-------|--------------|---------|-------|------------|
| 0-35  | ~0-30s       | 7       | 2000ms | Overwhelming |
| 35-70 | ~30-60s      | 8-9     | 1900-1800ms | Intense |
| 70-140 | ~60-120s    | 9-10    | 1800-1700ms | No reprieve |
| 200   | ~150s        | 11-12   | 1200-1300ms | Brutal |
| 400+  | ~300s+       | 15+     | 500ms+ | Maximum intensity |

The game reaches "genuinely difficult" within 45-60 seconds (around 70-100 points), meeting the 1-minute target while being immediately threatening from the opening second.

## Changes Required

**File:** `src/engine/DifficultyScaler.ts`

1. Update `baseTiers` array (6 entries)
2. Change `cycleLength` from 300 to 200
3. Change `tierDuration` from 50 to 35
4. Change speed scaling from -600ms to -300ms per cycle
5. Change minimum speed from 1000ms to 500ms (in the `getTierForScore` method)
6. Update wave spawn delay calculations if needed (review `getWaveSpawnDelayMs`)

## Testing Strategy

1. **Playtest at score 0** — Verify game is immediately overwhelming with 7 enemies at 2000ms
2. **Playtest 35-point progression** — Confirm tier transitions are noticeable (~every 30 seconds)
3. **Playtest 200+ points** — Verify patterns and speeds are genuinely challenging
4. **Verify minimum speed floor** — Confirm speed bottoms out at 500ms and doesn't go lower

## Risk Assessment

- **Difficulty too high**: Players may quit immediately. If playtesting shows 2000ms is too aggressive, fall back to 3000-4000ms.
- **Speed floor too low**: 500ms enemies may create unfair situations. Monitor playtest feedback; can increase to 600-700ms if needed.
- **Cycle length too short**: 200-point cycles compress progression. Can adjust back toward 250 if gameplay feels chaotic.

All parameters are numeric and easy to tune during playtest.

## Acceptance Criteria

- ✅ Game feels immediately threatening at score 0 (7 enemies, 2000ms)
- ✅ Game becomes genuinely difficult within 1 minute of play
- ✅ Difficulty escalates visibly every tier (~35 points / ~30 seconds)
- ✅ No balance regressions in existing features (shields, patterns, scoring)
