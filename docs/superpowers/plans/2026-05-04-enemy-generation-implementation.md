# Enemy Generation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement responsive, formation-based enemy spawning with progressive difficulty scaling every 50 score points.

**Architecture:** Three-layer system with ColumnManager (grid state), DifficultyScaler (score → difficulty mapping), and PatternFactory (generates spawn events). GameEngine integrates these and schedules enemy creation. All sizes scale responsively while maintaining fixed 10-column layout.

**Tech Stack:** TypeScript, existing GameEngine, performance.now() for timing, Math.random() for randomness

---

## Task 1: Add Core Types to types.ts

**Files:**
- Modify: `src/engine/types.ts`

- [ ] **Step 1: Open types.ts and add new type definitions after existing types**

Add these types after the `randomUpTo` function (around line 75):

```typescript
export interface EnemySpawnEvent {
  columnIndex: number;
  delayMs: number;
  patternId: string;
}

export interface PatternCycle {
  patternType: "wall" | "diagonal" | "gaps" | "random";
  spawns: EnemySpawnEvent[];
  durationMs: number;
  scoreRange: [number, number];
  metadata?: {
    direction?: "ltr" | "rtl";
    alternating?: boolean;
  };
}

export interface DifficultyTier {
  scoreStart: number;
  scoreEnd: number;
  maxEnemies: number;
  enemyTraverseDurationMs: number;
  patternType: string;
}

export const GRID_CONFIG = {
  NUM_COLUMNS: 10,
  PADDING_PERCENT: 0.1,
  getColumnWidth: (gameWidth: number) => gameWidth / GRID_CONFIG.NUM_COLUMNS,
  getPadding: (columnWidth: number) => columnWidth * GRID_CONFIG.PADDING_PERCENT,
  getEnemySize: (columnWidth: number) => columnWidth - (2 * GRID_CONFIG.getPadding(columnWidth)),
  getVerticalSpacing: (columnWidth: number) => columnWidth,
} as const;
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/engine/types.ts
git commit -m "types: add enemy generation types (PatternCycle, DifficultyTier, EnemySpawnEvent, GRID_CONFIG)"
```

---

## Task 2: Create ColumnManager

**Files:**
- Create: `src/engine/ColumnManager.ts`
- Create: `tests/engine/ColumnManager.test.ts`

- [ ] **Step 1: Write failing test for ColumnManager**

Create `tests/engine/ColumnManager.test.ts`:

```typescript
import { ColumnManager } from '../src/engine/ColumnManager';

describe('ColumnManager', () => {
  let manager: ColumnManager;

  beforeEach(() => {
    manager = new ColumnManager(1080, 800);
  });

  test('should initialize with correct column count', () => {
    expect(manager.getNumColumns()).toBe(10);
  });

  test('should calculate correct column width', () => {
    const columnWidth = manager.getColumnWidth();
    expect(columnWidth).toBe(108); // 1080 / 10
  });

  test('should calculate correct enemy size', () => {
    const enemySize = manager.getEnemySize();
    expect(enemySize).toBeCloseTo(86.4, 1); // 108 - (2 * 10.8)
  });

  test('should return column center X position', () => {
    const centerX = manager.getColumnCenterX(0);
    expect(centerX).toBe(54); // (0 + 0.5) * 108
  });

  test('should identify free columns', () => {
    expect(manager.isColumnFree(0, 0)).toBe(true);
    expect(manager.isColumnFree(0, 100)).toBe(true);
  });

  test('should occupy column at specific time and duration', () => {
    manager.occupyColumn(0, 0, 1000);
    expect(manager.isColumnFree(0, 500)).toBe(false);
    expect(manager.isColumnFree(0, 1001)).toBe(true);
  });

  test('should respect vertical spacing in same column', () => {
    const verticalSpacing = manager.getVerticalSpacing();
    manager.occupyColumn(0, 0, 500);
    // Enemy at column 0, y=0 occupies vertical space
    // Next enemy in same column must be at least verticalSpacing apart
    expect(manager.isColumnFreeAtY(0, 0, 50)).toBe(false);
    expect(manager.isColumnFreeAtY(0, verticalSpacing + 1, 50)).toBe(true);
  });

  test('should select random available columns with gap enforcement', () => {
    const selected = manager.selectColumnsWithGaps(5, 1);
    expect(selected.length).toBe(5);
    // Verify gaps: no two consecutive columns
    for (let i = 0; i < selected.length - 1; i++) {
      expect(Math.abs(selected[i] - selected[i + 1])).toBeGreaterThan(1);
    }
  });

  test('should reset state', () => {
    manager.occupyColumn(0, 0, 1000);
    manager.reset();
    expect(manager.isColumnFree(0, 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/engine/ColumnManager.test.ts`
Expected: FAIL - ColumnManager not found

- [ ] **Step 3: Create ColumnManager implementation**

Create `src/engine/ColumnManager.ts`:

```typescript
import { GRID_CONFIG } from './types';

interface ColumnOccupancy {
  startTime: number;
  endTime: number;
  yStart?: number;
  yEnd?: number;
}

export class ColumnManager {
  private gameWidth: number;
  private gameHeight: number;
  private numColumns: number;
  private columnWidth: number;
  private verticalSpacing: number;
  private occupancy: Map<number, ColumnOccupancy[]> = new Map();

  constructor(gameWidth: number, gameHeight: number) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.numColumns = GRID_CONFIG.NUM_COLUMNS;
    this.columnWidth = GRID_CONFIG.getColumnWidth(gameWidth);
    this.verticalSpacing = GRID_CONFIG.getVerticalSpacing(this.columnWidth);

    for (let i = 0; i < this.numColumns; i++) {
      this.occupancy.set(i, []);
    }
  }

  getNumColumns(): number {
    return this.numColumns;
  }

  getColumnWidth(): number {
    return this.columnWidth;
  }

  getEnemySize(): number {
    return GRID_CONFIG.getEnemySize(this.columnWidth);
  }

  getVerticalSpacing(): number {
    return this.verticalSpacing;
  }

  getColumnCenterX(columnIndex: number): number {
    return (columnIndex + 0.5) * this.columnWidth;
  }

  isColumnFree(columnIndex: number, atTime: number): boolean {
    if (columnIndex < 0 || columnIndex >= this.numColumns) return false;
    const occupants = this.occupancy.get(columnIndex) || [];
    return !occupants.some(occ => atTime >= occ.startTime && atTime < occ.endTime);
  }

  isColumnFreeAtY(columnIndex: number, yPosition: number, enemySize: number): boolean {
    if (columnIndex < 0 || columnIndex >= this.numColumns) return false;
    const occupants = this.occupancy.get(columnIndex) || [];
    const yEnd = yPosition + enemySize;
    return !occupants.some(occ => {
      if (occ.yStart === undefined || occ.yEnd === undefined) return false;
      const gap = this.verticalSpacing;
      return !(yEnd + gap < occ.yStart || yPosition - gap > occ.yEnd);
    });
  }

  occupyColumn(columnIndex: number, startTime: number, durationMs: number, yStart?: number, yEnd?: number): void {
    if (columnIndex < 0 || columnIndex >= this.numColumns) return;
    const occupants = this.occupancy.get(columnIndex) || [];
    occupants.push({
      startTime,
      endTime: startTime + durationMs,
      yStart,
      yEnd,
    });
  }

  selectColumnsWithGaps(count: number, minGap: number = 1): number[] {
    const available = Array.from({ length: this.numColumns }, (_, i) => i);
    const selected: number[] = [];

    while (selected.length < count && available.length > 0) {
      const randomIdx = Math.floor(Math.random() * available.length);
      const column = available[randomIdx];

      const isValid = !selected.some(
        col => Math.abs(col - column) <= minGap
      );

      if (isValid) {
        selected.push(column);
      }

      available.splice(randomIdx, 1);
    }

    return selected.sort((a, b) => a - b);
  }

  reset(): void {
    for (let i = 0; i < this.numColumns; i++) {
      this.occupancy.set(i, []);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/engine/ColumnManager.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/ColumnManager.ts tests/engine/ColumnManager.test.ts
git commit -m "feat: add ColumnManager for grid-based enemy placement"
```

---

## Task 3: Create DifficultyScaler

**Files:**
- Create: `src/engine/DifficultyScaler.ts`
- Create: `tests/engine/DifficultyScaler.test.ts`

- [ ] **Step 1: Write failing test for DifficultyScaler**

Create `tests/engine/DifficultyScaler.test.ts`:

```typescript
import { DifficultyScaler } from '../src/engine/DifficultyScaler';

describe('DifficultyScaler', () => {
  let scaler: DifficultyScaler;

  beforeEach(() => {
    scaler = new DifficultyScaler();
  });

  test('should return tier for score 0-50', () => {
    const tier = scaler.getTierForScore(25);
    expect(tier.scoreStart).toBe(0);
    expect(tier.scoreEnd).toBe(50);
    expect(tier.patternType).toBe('wall');
    expect(tier.maxEnemies).toBe(5);
    expect(tier.enemyTraverseDurationMs).toBe(8000);
  });

  test('should return tier for score 50-100', () => {
    const tier = scaler.getTierForScore(75);
    expect(tier.scoreStart).toBe(50);
    expect(tier.scoreEnd).toBe(100);
    expect(tier.patternType).toBe('random');
    expect(tier.maxEnemies).toBe(6);
    expect(tier.enemyTraverseDurationMs).toBe(7400);
  });

  test('should return tier for score 100-150', () => {
    const tier = scaler.getTierForScore(125);
    expect(tier.patternType).toBe('diagonal');
    expect(tier.maxEnemies).toBe(7);
  });

  test('should return tier for score 200-250', () => {
    const tier = scaler.getTierForScore(225);
    expect(tier.patternType).toBe('gaps');
    expect(tier.maxEnemies).toBe(9);
  });

  test('should cycle patterns after 300 points', () => {
    const tier1 = scaler.getTierForScore(25); // 0-50, wall
    const tier2 = scaler.getTierForScore(325); // 300-350, wall again
    expect(tier1.patternType).toBe(tier2.patternType);
    expect(tier1.patternType).toBe('wall');
    expect(tier2.enemyTraverseDurationMs).toBe(4400); // Faster
  });

  test('should increase speed progressively', () => {
    const tier0 = scaler.getTierForScore(25);
    const tier1 = scaler.getTierForScore(75);
    const tier2 = scaler.getTierForScore(125);
    expect(tier0.enemyTraverseDurationMs).toBeGreaterThan(tier1.enemyTraverseDurationMs);
    expect(tier1.enemyTraverseDurationMs).toBeGreaterThan(tier2.enemyTraverseDurationMs);
  });

  test('should increase max enemies progressively', () => {
    const tier0 = scaler.getTierForScore(25);
    const tier1 = scaler.getTierForScore(75);
    const tier2 = scaler.getTierForScore(125);
    expect(tier0.maxEnemies).toBeLessThan(tier1.maxEnemies);
    expect(tier1.maxEnemies).toBeLessThan(tier2.maxEnemies);
  });

  test('should return all tiers in progression order', () => {
    const tiers = scaler.getAllTiers();
    expect(tiers.length).toBeGreaterThan(0);
    expect(tiers[0].scoreStart).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/engine/DifficultyScaler.test.ts`
Expected: FAIL - DifficultyScaler not found

- [ ] **Step 3: Create DifficultyScaler implementation**

Create `src/engine/DifficultyScaler.ts`:

```typescript
import { DifficultyTier } from './types';

export class DifficultyScaler {
  private baseTiers: Omit<DifficultyTier, 'scoreStart' | 'scoreEnd'>[] = [
    { maxEnemies: 5, enemyTraverseDurationMs: 8000, patternType: 'wall' },
    { maxEnemies: 6, enemyTraverseDurationMs: 7400, patternType: 'random' },
    { maxEnemies: 7, enemyTraverseDurationMs: 6800, patternType: 'diagonal' },
    { maxEnemies: 8, enemyTraverseDurationMs: 6200, patternType: 'random' },
    { maxEnemies: 9, enemyTraverseDurationMs: 5600, patternType: 'gaps' },
    { maxEnemies: 10, enemyTraverseDurationMs: 5000, patternType: 'random' },
  ];

  private cycleLength = 300;
  private tierDuration = 50;

  getTierForScore(score: number): DifficultyTier {
    const cyclePosition = score % this.cycleLength;
    const tierIndex = Math.floor(cyclePosition / this.tierDuration);
    const cycleCount = Math.floor(score / this.cycleLength);

    const baseTier = this.baseTiers[tierIndex % this.baseTiers.length];

    // Speed increases per cycle: -600ms per cycle
    const speedIncrease = cycleCount * 600;
    const duration = Math.max(1000, baseTier.enemyTraverseDurationMs - speedIncrease);

    // Enemy count increases per tier, resets per cycle
    const maxEnemies = baseTier.maxEnemies + cycleCount;

    const scoreStart = score - cyclePosition;
    const scoreEnd = scoreStart + this.tierDuration;

    return {
      scoreStart,
      scoreEnd,
      maxEnemies,
      enemyTraverseDurationMs: duration,
      patternType: baseTier.patternType,
    };
  }

  getAllTiers(): DifficultyTier[] {
    const tiers: DifficultyTier[] = [];
    for (let score = 0; score < this.cycleLength; score += this.tierDuration) {
      tiers.push(this.getTierForScore(score));
    }
    return tiers;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/engine/DifficultyScaler.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/DifficultyScaler.ts tests/engine/DifficultyScaler.test.ts
git commit -m "feat: add DifficultyScaler for progressive difficulty progression"
```

---

## Task 4: Create PatternFactory

**Files:**
- Create: `src/engine/PatternFactory.ts`
- Create: `tests/engine/PatternFactory.test.ts`

- [ ] **Step 1: Write failing test for PatternFactory**

Create `tests/engine/PatternFactory.test.ts`:

```typescript
import { PatternFactory } from '../src/engine/PatternFactory';
import { ColumnManager } from '../src/engine/ColumnManager';

describe('PatternFactory', () => {
  let factory: PatternFactory;
  let columnManager: ColumnManager;

  beforeEach(() => {
    columnManager = new ColumnManager(1080, 800);
    factory = new PatternFactory(columnManager);
  });

  test('should generate wall pattern with gaps', () => {
    const pattern = factory.generateWallPattern(0, 5);
    expect(pattern.patternType).toBe('wall');
    expect(pattern.spawns.length).toBe(5);
    // Verify gaps between columns
    const columns = pattern.spawns.map(s => s.columnIndex).sort((a, b) => a - b);
    for (let i = 0; i < columns.length - 1; i++) {
      expect(columns[i + 1] - columns[i]).toBeGreaterThan(1);
    }
  });

  test('should generate diagonal pattern left-to-right', () => {
    const pattern = factory.generateDiagonalPattern(0, 10, 'ltr');
    expect(pattern.patternType).toBe('diagonal');
    expect(pattern.spawns.length).toBe(10);
    expect(pattern.metadata?.direction).toBe('ltr');
    // Verify stagger
    for (let i = 0; i < pattern.spawns.length - 1; i++) {
      expect(pattern.spawns[i].delayMs).toBeLessThan(pattern.spawns[i + 1].delayMs);
    }
  });

  test('should generate diagonal pattern right-to-left', () => {
    const pattern = factory.generateDiagonalPattern(0, 10, 'rtl');
    expect(pattern.metadata?.direction).toBe('rtl');
    // Verify columns are in reverse order
    const columns = pattern.spawns.map(s => s.columnIndex);
    expect(columns[0]).toBeGreaterThan(columns[columns.length - 1]);
  });

  test('should generate gaps pattern with alternating option', () => {
    const pattern = factory.generateGapsPattern(0, 10, true);
    expect(pattern.patternType).toBe('gaps');
    expect(pattern.spawns.length).toBe(5); // Half of 10 columns
    expect(pattern.metadata?.alternating).toBe(true);
  });

  test('should generate random pattern', () => {
    const pattern = factory.generateRandomPattern(0, 8, 500);
    expect(pattern.patternType).toBe('random');
    expect(pattern.spawns.length).toBeGreaterThan(0);
    expect(pattern.spawns.length).toBeLessThanOrEqual(8);
  });

  test('should generate pattern with correct score range', () => {
    const pattern = factory.generateWallPattern(0, 5);
    expect(pattern.scoreRange).toEqual([0, 50]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/engine/PatternFactory.test.ts`
Expected: FAIL - PatternFactory not found

- [ ] **Step 3: Create PatternFactory implementation**

Create `src/engine/PatternFactory.ts`:

```typescript
import { PatternCycle, EnemySpawnEvent } from './types';
import { ColumnManager } from './ColumnManager';

export class PatternFactory {
  private columnManager: ColumnManager;
  private readonly DIAGONAL_STAGGER_MS = 100;
  private readonly WALL_STAGGER_MS = 50;

  constructor(columnManager: ColumnManager) {
    this.columnManager = columnManager;
  }

  generateWallPattern(patternStartTime: number, maxEnemies: number): PatternCycle {
    const scoreRange: [number, number] = [patternStartTime, patternStartTime + 50];
    const columns = this.columnManager.selectColumnsWithGaps(maxEnemies, 1);

    const spawns: EnemySpawnEvent[] = columns.map((col, idx) => ({
      columnIndex: col,
      delayMs: idx * this.WALL_STAGGER_MS,
      patternId: `wall_${patternStartTime}`,
    }));

    return {
      patternType: 'wall',
      spawns,
      durationMs: 3000,
      scoreRange,
    };
  }

  generateDiagonalPattern(
    patternStartTime: number,
    maxEnemies: number,
    direction: 'ltr' | 'rtl'
  ): PatternCycle {
    const scoreRange: [number, number] = [patternStartTime, patternStartTime + 50];
    const numColumns = this.columnManager.getNumColumns();
    const columns = direction === 'ltr'
      ? Array.from({ length: numColumns }, (_, i) => i)
      : Array.from({ length: numColumns }, (_, i) => numColumns - 1 - i);

    const spawns: EnemySpawnEvent[] = columns.slice(0, maxEnemies).map((col, idx) => ({
      columnIndex: col,
      delayMs: idx * this.DIAGONAL_STAGGER_MS,
      patternId: `diagonal_${direction}_${patternStartTime}`,
    }));

    return {
      patternType: 'diagonal',
      spawns,
      durationMs: 3000,
      scoreRange,
      metadata: { direction },
    };
  }

  generateGapsPattern(
    patternStartTime: number,
    maxEnemies: number,
    alternating: boolean
  ): PatternCycle {
    const scoreRange: [number, number] = [patternStartTime, patternStartTime + 50];
    const numColumns = this.columnManager.getNumColumns();
    const offset = alternating ? 1 : 0;

    const columns: number[] = [];
    for (let i = offset; i < numColumns; i += 2) {
      columns.push(i);
    }

    const spawns: EnemySpawnEvent[] = columns.slice(0, maxEnemies).map((col) => ({
      columnIndex: col,
      delayMs: 0,
      patternId: `gaps_${patternStartTime}`,
    }));

    return {
      patternType: 'gaps',
      spawns,
      durationMs: 3000,
      scoreRange,
      metadata: { alternating },
    };
  }

  generateRandomPattern(
    patternStartTime: number,
    maxEnemies: number,
    durationMs: number = 3000
  ): PatternCycle {
    const scoreRange: [number, number] = [patternStartTime, patternStartTime + 50];
    const numSpawns = Math.max(1, Math.floor(Math.random() * maxEnemies));
    const spawns: EnemySpawnEvent[] = [];

    for (let i = 0; i < numSpawns; i++) {
      const col = Math.floor(Math.random() * this.columnManager.getNumColumns());
      const delayMs = Math.random() * 800 + 200; // 200-1000ms spread
      spawns.push({
        columnIndex: col,
        delayMs,
        patternId: `random_${patternStartTime}_${i}`,
      });
    }

    return {
      patternType: 'random',
      spawns,
      durationMs,
      scoreRange,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/engine/PatternFactory.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/PatternFactory.ts tests/engine/PatternFactory.test.ts
git commit -m "feat: add PatternFactory for wall, diagonal, gaps, and random patterns"
```

---

## Task 5: Implement PatternGenerator (Replace Skeleton)

**Files:**
- Modify: `src/engine/PatternGenerator.ts`

- [ ] **Step 1: Replace PatternGenerator.ts with real implementation**

Open `src/engine/PatternGenerator.ts` and replace entire contents with:

```typescript
import { Pattern, PatternSpawn } from './types';
import { PatternFactory } from './PatternFactory';
import { ColumnManager } from './ColumnManager';
import { DifficultyScaler } from './DifficultyScaler';

export class PatternGenerator {
  private factory: PatternFactory;
  private scaler: DifficultyScaler;
  private currentScore: number = 0;
  private currentPatternCycle: Pattern | null = null;
  private patternStartTime: number = 0;

  constructor(gameWidth: number, gameHeight: number) {
    const columnManager = new ColumnManager(gameWidth, gameHeight);
    this.factory = new PatternFactory(columnManager);
    this.scaler = new DifficultyScaler();
  }

  updateScore(score: number): void {
    this.currentScore = score;
  }

  getNextPattern(timestamp: number): Pattern | null {
    const tier = this.scaler.getTierForScore(this.currentScore);

    // Check if we need a new pattern
    if (!this.currentPatternCycle || timestamp >= this.patternStartTime + this.currentPatternCycle.duration) {
      this.currentPatternCycle = this.generatePatternForTier(tier, timestamp);
      this.patternStartTime = timestamp;
    }

    return this.currentPatternCycle;
  }

  private generatePatternForTier(tier: any, timestamp: number): Pattern {
    const score = this.currentScore;
    const scoreInTier = score % 50;
    const scaleFactor = Math.floor(score / 300); // For future speed variations

    switch (tier.patternType) {
      case 'wall':
        const wallPattern = this.factory.generateWallPattern(scoreInTier, tier.maxEnemies);
        return this.convertPatternCycleToPattern(wallPattern);

      case 'diagonal': {
        const direction = Math.random() < 0.5 ? 'ltr' : 'rtl';
        const diagonalPattern = this.factory.generateDiagonalPattern(scoreInTier, tier.maxEnemies, direction as 'ltr' | 'rtl');
        return this.convertPatternCycleToPattern(diagonalPattern);
      }

      case 'gaps': {
        const alternating = Math.random() < 0.5;
        const gapsPattern = this.factory.generateGapsPattern(scoreInTier, tier.maxEnemies, alternating);
        return this.convertPatternCycleToPattern(gapsPattern);
      }

      case 'random':
      default: {
        const randomPattern = this.factory.generateRandomPattern(scoreInTier, tier.maxEnemies);
        return this.convertPatternCycleToPattern(randomPattern);
      }
    }
  }

  private convertPatternCycleToPattern(cycle: any): Pattern {
    return {
      type: cycle.patternType,
      spawns: cycle.spawns.map((spawn: any) => ({
        column: spawn.columnIndex,
        delayMs: spawn.delayMs,
      })),
      duration: cycle.durationMs,
    };
  }
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/engine/PatternGenerator.ts
git commit -m "feat: implement PatternGenerator using PatternFactory and DifficultyScaler"
```

---

## Task 6: Integrate with GameEngine

**Files:**
- Modify: `src/engine/GameEngine.ts`

- [ ] **Step 1: Add PatternGenerator initialization to GameEngine constructor**

Open `src/engine/GameEngine.ts`. In the `constructor`, add after line 26 (after `private nextBulletId`):

```typescript
private patternGenerator: PatternGenerator;
private nextEnemySpawnTime: number = 0;
private currentMaxEnemies: number = 5;
```

And add to imports at top:

```typescript
import { PatternGenerator } from './PatternGenerator';
```

Then in constructor after line 31 (`this.state = this.makeInitialState(this.startTime)`), add:

```typescript
this.patternGenerator = new PatternGenerator(GAME_WIDTH, GAME_HEIGHT);
this.nextEnemySpawnTime = this.startTime;
```

- [ ] **Step 2: Implement spawnEnemies() method**

Find the `spawnEnemies()` method (line 188-191) and replace with:

```typescript
private spawnEnemies(timestamp: number): void {
  this.patternGenerator.updateScore(this.state.score);
  const pattern = this.patternGenerator.getNextPattern(timestamp);

  if (!pattern) return;

  // Check if it's time to spawn next enemy from pattern
  for (const spawn of pattern.spawns) {
    const spawnTime = this.nextEnemySpawnTime + spawn.delayMs;
    if (timestamp >= spawnTime && this.state.enemies.length < this.currentMaxEnemies) {
      this.createEnemy(spawn.column, timestamp);
    }
  }
}

private createEnemy(columnIndex: number, timestamp: number): void {
  const columnWidth = GAME_WIDTH / 10;
  const enemyX = (columnIndex + 0.5) * columnWidth;
  const SPAWN_STAGGER_MS = 350; // Keep existing behavior for timing

  const enemy: EnemyState = {
    id: this.state.enemies.length,
    x: enemyX,
    y: ENEMY_START_Y,
    imageIndex: 0,
    startTime: timestamp,
    duration: 8000, // Will be overridden by difficulty tier
    hasScored: false,
  };

  this.state.enemies.push(enemy);
}
```

- [ ] **Step 3: Update updateEnemies() to call spawnEnemies()**

Find `updateEnemies()` method (line 151). At the start of the method, add:

```typescript
this.spawnEnemies(timestamp);
```

- [ ] **Step 4: Update difficulty tier when score changes**

In `updateEnemies()`, after the enemies map/filter (line 182), add:

```typescript
const tier = this.patternGenerator.getTierForScore(this.state.score);
this.currentMaxEnemies = tier.maxEnemies;
```

Wait, PatternGenerator doesn't expose getTierForScore. Let me fix this. In PatternGenerator, add a public method:

Add to PatternGenerator class:

```typescript
private scaler: DifficultyScaler; // Already exists
// Add this public method:
getTierForScore(score: number): any {
  return this.scaler.getTierForScore(score);
}
```

Actually, we need to import DifficultyScaler in PatternGenerator. It should already be imported. Let me revise the GameEngine change:

Actually, the simpler approach: in GameEngine, import DifficultyScaler directly:

At top of GameEngine.ts, add:

```typescript
import { DifficultyScaler } from './DifficultyScaler';
```

And add to GameEngine class:

```typescript
private difficultyScaler: DifficultyScaler = new DifficultyScaler();
```

Then in `updateEnemies()` after the filter, add:

```typescript
const tier = this.difficultyScaler.getTierForScore(this.state.score);
this.currentMaxEnemies = tier.maxEnemies;
```

- [ ] **Step 5: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/engine/GameEngine.ts src/engine/PatternGenerator.ts
git commit -m "feat: integrate PatternGenerator and DifficultyScaler into GameEngine"
```

---

## Task 7: Update makeInitialState to use PatternGenerator

**Files:**
- Modify: `src/engine/GameEngine.ts`

- [ ] **Step 1: Update makeInitialState**

Find `makeInitialState()` method (line 276). Replace the `enemies: []` line with initialization:

```typescript
private makeInitialState(timestamp: number): GameState {
  this.patternGenerator = new PatternGenerator(GAME_WIDTH, GAME_HEIGHT);
  this.nextEnemySpawnTime = timestamp;
  this.currentMaxEnemies = 5;

  return {
    score: 0,
    highScore: this.state?.highScore ?? 0,
    lives: 3,
    shipX: 490,
    shipY: 700,
    velocityX: 0,
    velocityY: 0,
    isShipHit: false,
    lastHitTime: timestamp - 2000,
    enemies: [],
    shields: [],
    particles: [],
    bullets: [],
  };
}
```

- [ ] **Step 2: Verify no console errors in game**

Run dev server and start a game session:
Run: `npm start`
Expected: Game launches, no TypeScript errors, enemies begin spawning

- [ ] **Step 3: Commit**

```bash
git add src/engine/GameEngine.ts
git commit -m "fix: initialize PatternGenerator in makeInitialState"
```

---

## Task 8: Test Responsive Scaling

**Files:**
- No code changes
- Manual testing only

- [ ] **Step 1: Test on desktop (1080px)**

Open browser dev tools, full-width game viewport. Start game. Verify:
- Enemies spawn in visible columns
- Pattern formations are clear (walls, diagonals, gaps)
- Responsive scaling looks correct

- [ ] **Step 2: Test on tablet (540px)**

Resize browser to 540px or use device emulation. Start game. Verify:
- Enemies scale proportionally smaller
- 10-column layout still applies (same game difficulty)
- Hitboxes scale with visuals
- Touch controls still work

- [ ] **Step 3: Test on mobile (400px)**

Resize to 400px. Verify:
- Game is playable at small size
- Scaling is proportional
- No layout breakage

- [ ] **Step 4: Verify difficulty progression**

Play to score 50, 100, 150, 200, 250. Note pattern changes:
- 0–50: Walls with gaps
- 50–100: Random
- 100–150: Diagonals
- 150–200: Random
- 200–250: Gaps (vertical stripes)

- [ ] **Step 5: Verify speed increases**

Enemies should be visibly faster at each 50-point boundary (traversing screen quicker).

- [ ] **Step 6: Verify enemy count increases**

Max simultaneous enemies should increase by 1 at each 50-point interval.

---

## Task 9: Cleanup and Final Testing

**Files:**
- No code changes

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass (ColumnManager, DifficultyScaler, PatternFactory)

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Verify no console warnings**

Open browser dev tools console while playing. Start game, play until score 200+. Verify:
- No red errors
- No warnings about missing functions

- [ ] **Step 4: Play a full session**

Play for 2–3 minutes. Verify:
- Game feels progressively harder
- Patterns are varied (not stuck on one type)
- No enemies getting stuck or overlapping
- Scoring works correctly

- [ ] **Step 5: Final commit**

```bash
git status
```

Should show no uncommitted changes. If any remain, add and commit them.

---

## Summary

This plan implements the enemy generation system in 9 focused tasks:

1. **Types** — Add foundational data structures
2. **ColumnManager** — Grid-based placement with collision avoidance
3. **DifficultyScaler** — Score → difficulty tier mapping
4. **PatternFactory** — Generate wall, diagonal, gaps, random patterns
5. **PatternGenerator** — Orchestrate patterns and difficulty
6. **GameEngine Integration** — Connect spawning to game loop
7. **State Initialization** — Ensure patterns reset on new game
8. **Responsive Testing** — Verify scaling across screen sizes
9. **Final Testing** — Full session validation

Each task is self-contained, testable, and builds toward the complete system. Tests use TDD (write failing test → implement → verify passing). Commits are frequent and descriptive.
