# Wave Spawning System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a wave-based enemy spawning system that controls pattern frequency independently of pattern generation, making difficulty scaling tied to spawn frequency rather than internal pattern delays.

**Architecture:** WaveManager tracks timing between pattern spawns. DifficultyScaler provides wave delay values per tier. GameEngine detects score-based tier changes, updates wave delay, and spawns complete patterns when the wave timer fires.

**Tech Stack:** TypeScript, Jest for testing

---

### Task 1: Create WaveManager Class

**Files:**
- Create: `src/engine/WaveManager.ts`
- Create: `src/engine/WaveManager.test.ts`

- [ ] **Step 1: Write failing tests for WaveManager**

Create `src/engine/WaveManager.test.ts`:

```typescript
import { WaveManager } from './WaveManager';

describe('WaveManager', () => {
  it('should initialize with nextWaveTime set to 0', () => {
    const manager = new WaveManager(1000);
    expect(manager['nextWaveTime']).toBe(0);
  });

  it('shouldSpawnWave returns true when current time >= nextWaveTime', () => {
    const manager = new WaveManager(1000);
    manager['nextWaveTime'] = 1000;
    expect(manager.shouldSpawnWave(1000)).toBe(true);
    expect(manager.shouldSpawnWave(1001)).toBe(true);
  });

  it('shouldSpawnWave returns false when current time < nextWaveTime', () => {
    const manager = new WaveManager(1000);
    manager['nextWaveTime'] = 2000;
    expect(manager.shouldSpawnWave(1000)).toBe(false);
    expect(manager.shouldSpawnWave(1999)).toBe(false);
  });

  it('markWaveSpawned schedules next wave based on waveDelayMs', () => {
    const manager = new WaveManager(1000);
    manager.markWaveSpawned(5000);
    expect(manager['nextWaveTime']).toBe(6000);
  });

  it('setWaveDelay updates the delay for future waves', () => {
    const manager = new WaveManager(1000);
    manager.markWaveSpawned(5000);
    manager.setWaveDelay(500);
    manager.markWaveSpawned(6000);
    expect(manager['nextWaveTime']).toBe(6500);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/engine/WaveManager.test.ts
```

Expected: All tests fail with "WaveManager not found"

- [ ] **Step 3: Implement WaveManager class**

Create `src/engine/WaveManager.ts`:

```typescript
export class WaveManager {
  private nextWaveTime: number = 0;
  private waveDelayMs: number;

  constructor(initialDelayMs: number) {
    this.waveDelayMs = initialDelayMs;
  }

  setWaveDelay(delayMs: number): void {
    this.waveDelayMs = delayMs;
  }

  shouldSpawnWave(currentTime: number): boolean {
    return currentTime >= this.nextWaveTime;
  }

  markWaveSpawned(currentTime: number): void {
    this.nextWaveTime = currentTime + this.waveDelayMs;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- src/engine/WaveManager.test.ts
```

Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/engine/WaveManager.ts src/engine/WaveManager.test.ts
git commit -m "feat: implement WaveManager for controlling spawn frequency"
```

---

### Task 2: Enhance DifficultyScaler with waveDelayMs

**Files:**
- Modify: `src/engine/DifficultyScaler.ts`
- Modify: `src/engine/DifficultyScaler.test.ts`

- [ ] **Step 1: Write failing test for waveDelayMs**

Open `src/engine/DifficultyScaler.test.ts` and add:

```typescript
describe('waveDelayMs', () => {
  it('should return 1000ms for tier 0', () => {
    const scaler = new DifficultyScaler();
    const tier = scaler.getTierForScore(25); // tier 0
    expect(scaler.waveDelayMs(tier)).toBe(1000);
  });

  it('should return 800ms for tier 1', () => {
    const scaler = new DifficultyScaler();
    const tier = scaler.getTierForScore(75); // tier 1
    expect(scaler.waveDelayMs(tier)).toBe(800);
  });

  it('should return 600ms for tier 2', () => {
    const scaler = new DifficultyScaler();
    const tier = scaler.getTierForScore(125); // tier 2
    expect(scaler.waveDelayMs(tier)).toBe(600);
  });

  it('should return 400ms for tier 3+', () => {
    const scaler = new DifficultyScaler();
    const tier = scaler.getTierForScore(200); // tier 3+
    expect(scaler.waveDelayMs(tier)).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/engine/DifficultyScaler.test.ts
```

Expected: Tests fail with "waveDelayMs is not defined"

- [ ] **Step 3: Implement waveDelayMs method**

Open `src/engine/DifficultyScaler.ts` and add this method:

```typescript
waveDelayMs(tier: DifficultyTier): number {
  switch (tier.tier) {
    case 0:
      return 1000;
    case 1:
      return 800;
    case 2:
      return 600;
    default:
      return 400;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- src/engine/DifficultyScaler.test.ts
```

Expected: New tests pass

- [ ] **Step 5: Commit**

```bash
git add src/engine/DifficultyScaler.ts src/engine/DifficultyScaler.test.ts
git commit -m "feat: add waveDelayMs method to DifficultyScaler"
```

---

### Task 3: Simplify PatternFactory (Remove Spawn Delays)

**Files:**
- Modify: `src/engine/PatternFactory.ts`
- Reference: `src/engine/types.ts` (review but don't modify unless needed)

- [ ] **Step 1: Review current PatternFactory implementation**

Open `src/engine/PatternFactory.ts` and examine how spawns are generated. Look for places where `delayMs` is assigned to spawns.

- [ ] **Step 2: Remove delayMs from generated spawns**

In PatternFactory, update all spawn generation to use `delayMs: 0` (or remove the field if the type allows):

Find all lines like:
```typescript
spawns: [
  { columnIndex: 0, delayMs: 0 },
  { columnIndex: 1, delayMs: 100 },
  ...
]
```

Change to:
```typescript
spawns: [
  { columnIndex: 0, delayMs: 0 },
  { columnIndex: 1, delayMs: 0 },
  ...
]
```

(Set all `delayMs: 0` since WaveManager will handle timing)

- [ ] **Step 3: Run existing tests to verify no regression**

```bash
npm test -- src/engine/PatternFactory.test.ts
```

Expected: Tests pass (functionality unchanged for pattern generation)

- [ ] **Step 4: Commit**

```bash
git add src/engine/PatternFactory.ts
git commit -m "refactor: remove spawn delay logic from PatternFactory"
```

---

### Task 4: Integrate WaveManager into GameEngine

**Files:**
- Modify: `src/engine/GameEngine.ts`
- Modify: `src/engine/GameEngine.test.ts`

- [ ] **Step 1: Import WaveManager and initialize in GameEngine constructor**

Open `src/engine/GameEngine.ts` and add to imports:

```typescript
import { WaveManager } from './WaveManager';
```

Add to class properties:

```typescript
private waveManager: WaveManager;
```

Update `makeInitialState` to initialize WaveManager:

```typescript
private makeInitialState(timestamp: number): GameState {
  this.patternGenerator = new PatternGenerator(GAME_WIDTH, GAME_HEIGHT);
  this.waveManager = new WaveManager(1000); // Start with 1 second delay
  this.nextEnemySpawnTime = timestamp;
  this.currentMaxEnemies = 5;

  return {
    // ... rest of state
  };
}
```

- [ ] **Step 2: Add tier tracking to GameEngine**

Add to class properties:

```typescript
private currentTier: number = 0;
```

- [ ] **Step 3: Replace spawnEnemies logic to use WaveManager**

Replace the entire `spawnEnemies` method with:

```typescript
private spawnEnemies(timestamp: number): void {
  this.patternGenerator.updateScore(this.state.score);

  const tier = this.difficultyScaler.getTierForScore(this.state.score);

  // Update wave delay if tier changed
  if (tier.tier !== this.currentTier) {
    this.currentTier = tier.tier;
    const delayMs = this.difficultyScaler.waveDelayMs(tier);
    this.waveManager.setWaveDelay(delayMs);
    console.log(`[TIER] Advanced to tier ${tier.tier}, waveDelayMs=${delayMs}`);
  }

  // Check if current pattern has expired or doesn't exist
  if (!this.currentPattern || timestamp >= this.currentPatternStartTime + this.currentPattern.durationMs) {
    this.currentPattern = this.patternGenerator.getNextPattern(timestamp);
    this.currentPatternStartTime = timestamp;
    this.executedSpawns.clear();
    console.log(`[PATTERN] New pattern: type=${this.currentPattern?.patternType}, spawns=${this.currentPattern?.spawns.length}, maxEnemies=${tier.maxEnemies}, score=${this.state.score}`);
  }

  if (!this.currentPattern) return;

  // Spawn all enemies from pattern when wave is ready
  if (this.waveManager.shouldSpawnWave(timestamp)) {
    for (let i = 0; i < this.currentPattern.spawns.length; i++) {
      const spawn = this.currentPattern.spawns[i];

      if (this.state.enemies.length < tier.maxEnemies && !this.executedSpawns.has(`${i}`)) {
        console.log(`[SPAWN] Enemy #${i} at column ${spawn.columnIndex}, enemies.length=${this.state.enemies.length}/${tier.maxEnemies}`);
        this.createEnemy(spawn.columnIndex, timestamp);
        this.executedSpawns.add(`${i}`);
      }
    }

    this.waveManager.markWaveSpawned(timestamp);
  }
}
```

- [ ] **Step 4: Update currentMaxEnemies assignment**

In `updateEnemies`, remove the old line `this.currentMaxEnemies = tier.maxEnemies;` if it exists (we're tracking it differently now)

- [ ] **Step 5: Run existing tests**

```bash
npm test -- src/engine/GameEngine.test.ts
```

Expected: Tests pass or clearly show what needs adjustment

- [ ] **Step 6: Commit**

```bash
git add src/engine/GameEngine.ts
git commit -m "feat: integrate WaveManager for pattern spawn frequency"
```

---

### Task 5: Manual Testing & Game Feel Verification

**Files:**
- No files to modify (testing phase)

- [ ] **Step 1: Build and start the game**

```bash
npm run start
```

- [ ] **Step 2: Play through score 0-50 (Tier 0)**

Observe:
- Enemies spawn in waves with ~1 second delay between patterns
- Wall patterns show all enemies at once
- Difficulty feels appropriately easy

- [ ] **Step 3: Play through score 50-100 (Tier 1)**

Observe:
- Wave delay decreases to ~800ms
- Enemies spawn faster
- More enemies on screen (maxEnemies increased)
- Difficulty noticeably harder

- [ ] **Step 4: Play through score 100-150 (Tier 2)**

Observe:
- Wave delay now ~600ms
- Even more pressure
- Game feels appropriately challenging

- [ ] **Step 5: Verify no regressions**

Check:
- Bullets still kill enemies
- Shield pickups work
- Collision detection works
- Score tracking works
- Game over condition works

- [ ] **Step 6: If issues found, document and create separate bugfix tasks**

If everything works, proceed to next step.

- [ ] **Step 7: Commit manual testing notes (optional)**

```bash
git commit -m "test: manual verification of wave spawning system" --allow-empty
```

---

### Task 6: Console Log Cleanup (Optional)

**Files:**
- Modify: `src/engine/GameEngine.ts`

- [ ] **Step 1: Remove or quiet debug console.log statements**

The `spawnEnemies` method has several `console.log` statements added during development. Either:
- Remove them entirely, or
- Wrap in `if (DEBUG)` check, or
- Move to trace level logging

For now, remove them:

```typescript
// Remove these lines:
// console.log(`[SPAWN] Enemy #${i}...`);
// console.log(`[PATTERN] New pattern...`);
// console.log(`[TIER] Advanced to tier...`);
```

- [ ] **Step 2: Run tests one final time**

```bash
npm test
```

Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/engine/GameEngine.ts
git commit -m "chore: remove debug logging from spawn logic"
```

---

## Spec Coverage Checklist

- ✅ WaveManager class created and tested
- ✅ DifficultyScaler.waveDelayMs() implemented
- ✅ PatternFactory simplified (no spawn delays)
- ✅ GameEngine integrated with WaveManager
- ✅ Tier-based wave delay scaling (1000ms → 400ms)
- ✅ Score-based tier progression preserved
- ✅ Pattern behavior unchanged (still define enemy positions)
