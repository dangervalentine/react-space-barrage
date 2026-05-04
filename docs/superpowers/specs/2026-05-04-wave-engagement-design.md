# Wave Engagement Design
**Date:** 2026-05-04  
**Branch:** feature/mobile  
**Goal:** Improve game pacing by reducing downtime between waves while slowing individual enemies to prevent overwhelming the player.

## Problem Statement

Current gameplay experiences "boom-and-bust" pacing: periods of no enemies followed by sudden bursts. This creates lulls in engagement. Players want more constant action without feeling overwhelmed by fast-moving enemies.

## Solution Overview

Two coordinated changes to DifficultyScaler:

1. **Slow enemies uniformly** (+500ms traverse duration across all tiers)
2. **Speed up wave spawns** (continuous formula: 300ms base, -10ms per tier)

These changes apply at all difficulty levels and difficulty cycles.

## Detailed Changes

### Enemy Speed Scaling

**Current behavior:**
- Base tier durations: 2000ms, 1900ms, 1800ms, 1700ms, 1600ms, 1500ms
- Speed increases by -300ms per completed 200-point cycle
- Minimum floor: 500ms

**New behavior:**
- Base tier durations: 2500ms, 2400ms, 2300ms, 2200ms, 2100ms, 2000ms
- Speed scaling: -300ms per cycle (unchanged)
- Minimum floor: 500ms (unchanged)

**Impact:** Enemies move 500ms slower at all difficulty levels. A player has more time to react to individual threats while wave frequency maintains engagement.

### Wave Spawn Delay

**Current behavior:**
- Tier 0 (score 0-35, 200-235, etc): 1000ms
- Tier 1 (score 35-70, 235-270, etc): 800ms
- Tier 2 (score 70-105, 270-305, etc): 600ms
- Tier 3+ (score 105+, 305+, etc): 400ms

**New behavior:**
- Formula: `300ms - (tierIndex * 10ms)`
- Tier 0: 300ms
- Tier 1: 290ms
- Tier 2: 280ms
- Tier 3: 270ms
- Tier 4: 260ms
- Tier 5: 250ms
- Minimum floor: 150ms to prevent unrealistic spawn rates

**Implementation:** Modify `waveDelayMs()` to compute delay from tier index rather than switch statement.

## Implementation Areas

**File:** `src/engine/DifficultyScaler.ts`

1. Update `baseTiers` array: add 500ms to all `enemyTraverseDurationMs` values
2. Rewrite `waveDelayMs()` method: replace switch statement with formula-based calculation

**Testing:** Verify via existing unit tests in `src/engine/DifficultyScaler.spec.ts` and `src/engine/WaveManager.test.ts`.

## Verification Plan

1. Unit tests pass with new delay calculations
2. Manual play-test early game: enemies move noticeably slower, waves spawn steadily at ~300ms intervals
3. Manual play-test late game: progression feels smooth, no extreme delays or spawn rates
4. Check that minimum duration floor (500ms) and delay floor (150ms) behave correctly

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Game becomes too easy (slow enemies) | Offset by more frequent waves and existing score-based progression |
| Waves spawn too fast, overwhelming player | Continuous formula + 150ms floor keeps rhythm manageable |
| Late-game difficulty affected negatively | Speed scaling per cycle (-300ms) and enemy count scaling offset slower base speeds |

## Success Criteria

- ✅ Waves spawn at predictable, frequent intervals (no dead time)
- ✅ Early enemies move slower but don't feel trivial
- ✅ Difficulty progression remains meaningful
- ✅ All tests pass
- ✅ Game balance feels "right" in play-testing
