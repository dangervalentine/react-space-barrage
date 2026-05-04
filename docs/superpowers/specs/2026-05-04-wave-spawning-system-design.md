# Wave Spawning System Design

**Date:** 2026-05-04  
**Context:** Making the game harder by controlling enemy spawn frequency through a wave system rather than individual spawn delays.

## Overview

Currently, enemies spawn according to internal delays defined in patterns. This makes the game easy at low scores because spawn frequency is constant. The new **Wave Spawning System** decouples pattern generation (which enemies appear) from wave timing (how frequently patterns spawn).

**Key Changes:**
- Patterns spawn complete formations at once (no internal spawn delays)
- WaveManager controls the frequency of pattern spawning
- Wave delay starts at ~1 second and decreases with difficulty
- Score-based tier progression remains unchanged (every 50 points)

## Architecture

### 1. WaveManager Class

**Purpose:** Track and manage the timing between pattern spawns.

```typescript
class WaveManager {
  private nextWaveTime: number = 0;
  private waveDelayMs: number = 1000;

  setWaveDelay(delayMs: number): void
  shouldSpawnWave(currentTime: number): boolean
  markWaveSpawned(currentTime: number): void
}
```

**Behavior:**
- `setWaveDelay(delayMs)` — Called when difficulty tier changes, sets the interval between pattern spawns
- `shouldSpawnWave(currentTime)` — Returns true if currentTime >= nextWaveTime
- `markWaveSpawned(currentTime)` — Schedules next wave: `nextWaveTime = currentTime + waveDelayMs`

**Responsibilities:**
- Does not know about patterns or enemy positions
- Does not know about difficulty; only stores the delay value passed to it
- Simply maintains a timestamp for "when should the next pattern spawn?"

### 2. DifficultyScaler Enhancement

Add a method that returns wave delay based on tier:

```typescript
waveDelayMs(tier: DifficultyTier): number {
  switch (tier.tier) {
    case 0: return 1000;  // score 0-50
    case 1: return 800;   // score 50-100
    case 2: return 600;   // score 100-150
    case 3: return 400;   // score 150+
  }
}
```

**Note:** These values are tunable for game balance. The intent is:
- Longer delays at low difficulty (slower spawning)
- Shorter delays at high difficulty (faster spawning, more enemies on screen)

### 3. PatternFactory Simplification

Remove all spawn delay logic from generated patterns. Patterns should only define:
- **Enemy positions** (which columns, formations, etc.)
- **Count** (maxEnemies for the current tier)
- **Type** (wall, diagonal, gaps, random)

Example: A wall pattern at tier 0 spawns 5 enemies in a horizontal line. A wall pattern at tier 2 spawns 8 enemies in a horizontal line. No spawn delays within patterns.

### 4. GameEngine Integration

**Tier Change Detection:**
```typescript
updateEnemies(timestamp: number): void {
  const tier = this.difficultyScaler.getTierForScore(this.state.score);
  
  if (tier !== this.currentTier) {
    this.currentTier = tier;
    const waveDelayMs = this.difficultyScaler.waveDelayMs(tier);
    this.waveManager.setWaveDelay(waveDelayMs);
  }
  
  // ... rest of enemy update logic
}
```

**Pattern Spawning:**
```typescript
spawnEnemies(timestamp: number): void {
  if (this.waveManager.shouldSpawnWave(timestamp)) {
    const pattern = this.patternGenerator.getNextPattern(timestamp);
    
    if (pattern) {
      // Spawn all enemies from pattern at once
      for (const spawn of pattern.spawns) {
        this.createEnemy(spawn.columnIndex, timestamp);
      }
      
      this.waveManager.markWaveSpawned(timestamp);
    }
  }
}
```

**Key Changes:**
- Remove individual spawn delay checking (`if (timestamp >= spawnTime)`)
- Spawn all enemies from a pattern when `shouldSpawnWave()` returns true
- Call `markWaveSpawned()` to schedule the next pattern

## Data Flow

```
1. Score increases (enemies destroyed, pass screen)
   ↓
2. Score % 50 === 0?
   ↓ (yes)
3. Tier changes → DifficultyScaler.getTierForScore()
   ↓
4. Update waveDelayMs via DifficultyScaler.waveDelayMs(tier)
   ↓
5. Pass delay to WaveManager.setWaveDelay()
   ↓
6. Each tick: WaveManager.shouldSpawnWave()
   ↓ (true)
7. PatternGenerator creates pattern for current tier
   ↓
8. Spawn all enemies from pattern at once
   ↓
9. WaveManager.markWaveSpawned() schedules next pattern
   ↓
10. Wait waveDelayMs, repeat from step 6
```

## Game Feel

**Low Difficulty (Score 0-50):**
- Wall pattern spawns 5 enemies
- New pattern every 1 second
- Enemies move slowly
- Screen fills gradually

**High Difficulty (Score 150+):**
- Wall pattern spawns 10 enemies (or as many as fit)
- New pattern every 400ms
- Enemies move fast
- Screen fills quickly, high pressure

## Implementation Strategy

1. Create `WaveManager` class
2. Add `waveDelayMs()` method to `DifficultyScaler`
3. Remove spawn delay logic from `PatternFactory` (patterns should define all enemies to spawn)
4. Update `GameEngine.spawnEnemies()` to use `WaveManager` instead of pattern delays
5. Add tier change detection and `waveManager.setWaveDelay()` call
6. Test: verify patterns spawn at correct intervals, difficulty scaling works

## Constraints & Assumptions

- Score-based tier progression (every 50 points) remains unchanged
- Pattern types (wall, diagonal, gaps, random) remain unchanged
- Enemy positions within patterns remain unchanged
- WaveManager only tracks timing; pattern generation is separate concern
- All enemies from a pattern spawn simultaneously (no stagger within patterns)

## Open Questions Resolved

- **Wave timing:** 1 second at tier 0, decreases with difficulty (tier-based, not time-based)
- **Pattern behavior:** Patterns define enemy arrangement; waves control spawn frequency
- **Difficulty scaling:** Enemy speed, maxEnemies, and waveDelayMs all adjust per tier
- **Pattern switching:** Still score-driven (every 50 points), not time-driven
