# Wave Engagement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve game pacing by slowing enemies (+500ms traverse duration) and increasing wave spawn frequency (300ms base, -10ms per tier).

**Architecture:** Two coordinated changes to DifficultyScaler: (1) increase baseTiers traverse durations uniformly, (2) replace switch-based waveDelayMs with formula-based calculation. No file structure changes; modifications are localized to DifficultyScaler.ts and its spec.

**Tech Stack:** TypeScript, Jest (existing test framework)

---

## Task 1: Update DifficultyScaler baseTiers with slower enemies

**Files:**
- Modify: `src/engine/DifficultyScaler.ts:17-24`

- [ ] **Step 1: Open DifficultyScaler.ts and locate baseTiers**

Navigate to line 17-24 where baseTiers is defined.

- [ ] **Step 2: Increase all enemyTraverseDurationMs values by 500ms**

Replace the baseTiers array. Change:
- 2000 → 2500
- 1900 → 2400
- 1800 → 2300
- 1700 → 2200
- 1600 → 2100
- 1500 → 2000

```typescript
private baseTiers: Omit<DifficultyTier, 'scoreStart' | 'scoreEnd'>[] = [
  { maxEnemies: 7, enemyTraverseDurationMs: 2500, patternType: 'wall' },
  { maxEnemies: 8, enemyTraverseDurationMs: 2400, patternType: 'random' },
  { maxEnemies: 9, enemyTraverseDurationMs: 2300, patternType: 'diagonal' },
  { maxEnemies: 10, enemyTraverseDurationMs: 2200, patternType: 'random' },
  { maxEnemies: 11, enemyTraverseDurationMs: 2100, patternType: 'gaps' },
  { maxEnemies: 12, enemyTraverseDurationMs: 2000, patternType: 'random' },
];
```

- [ ] **Step 3: Commit**

```bash
git add src/engine/DifficultyScaler.ts
git commit -m "feat: increase base enemy traverse duration by 500ms"
```

---

## Task 2: Update DifficultyScaler tests to reflect new enemy speeds

**Files:**
- Modify: `src/engine/DifficultyScaler.spec.ts:11-37`

- [ ] **Step 1: Update test expectations for new base speeds**

Update the test at line 14 to expect 2500 instead of 2000:

```typescript
it('should return tier 0 with 7 enemies at score 0', () => {
  const tier = scaler.getTierForScore(0);
  expect(tier.maxEnemies).toBe(7);
  expect(tier.enemyTraverseDurationMs).toBe(2500);
  expect(tier.patternType).toBe('wall');
});
```

Update the test at line 21 to expect 2400 instead of 1900:

```typescript
it('should return tier 1 with 8 enemies at score 35', () => {
  const tier = scaler.getTierForScore(35);
  expect(tier.maxEnemies).toBe(8);
  expect(tier.enemyTraverseDurationMs).toBe(2400);
  expect(tier.patternType).toBe('random');
});
```

Update the test at line 28 to expect 2200 instead of 1700 (cycle 1 reduction: 2500 - 300 = 2200):

```typescript
it('should apply cycle 1 speed reduction at score 200', () => {
  const tier = scaler.getTierForScore(200);
  expect(tier.maxEnemies).toBe(8);
  expect(tier.enemyTraverseDurationMs).toBe(2200); // 2500 - 300
  expect(tier.patternType).toBe('wall');
});
```

Update the test at line 35 to expect 1900 instead of 1400 (cycle 2 reduction: 2500 - 600 = 1900):

```typescript
it('should apply cycle 2 speed reduction at score 400', () => {
  const tier = scaler.getTierForScore(400);
  expect(tier.maxEnemies).toBe(9);
  expect(tier.enemyTraverseDurationMs).toBe(1900); // 2500 - 600
  expect(tier.patternType).toBe('wall');
});
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm test -- src/engine/DifficultyScaler.spec.ts
```

Expected output: All 4 tests in DifficultyScaler suite pass.

- [ ] **Step 3: Commit**

```bash
git add src/engine/DifficultyScaler.spec.ts
git commit -m "test: update difficulty scaler tests for new base speeds"
```

---

## Task 3: Add tests for new waveDelayMs formula

**Files:**
- Modify: `src/engine/DifficultyScaler.spec.ts` (add new test block after line 38)

- [ ] **Step 1: Add waveDelayMs test suite**

Add a new describe block after the getTierForScore tests (after line 38):

```typescript
describe('waveDelayMs', () => {
  it('should return 300ms for tier 0', () => {
    const tier = scaler.getTierForScore(0);
    expect(scaler.waveDelayMs(tier)).toBe(300);
  });

  it('should return 290ms for tier 1', () => {
    const tier = scaler.getTierForScore(35);
    expect(scaler.waveDelayMs(tier)).toBe(290);
  });

  it('should return 280ms for tier 2', () => {
    const tier = scaler.getTierForScore(70);
    expect(scaler.waveDelayMs(tier)).toBe(280);
  });

  it('should return 270ms for tier 3', () => {
    const tier = scaler.getTierForScore(105);
    expect(scaler.waveDelayMs(tier)).toBe(270);
  });

  it('should return 260ms for tier 4', () => {
    const tier = scaler.getTierForScore(140);
    expect(scaler.waveDelayMs(tier)).toBe(260);
  });

  it('should return 250ms for tier 5', () => {
    const tier = scaler.getTierForScore(175);
    expect(scaler.waveDelayMs(tier)).toBe(250);
  });

  it('should reset to 300ms at tier 0 of next cycle (score 200)', () => {
    const tier = scaler.getTierForScore(200);
    expect(scaler.waveDelayMs(tier)).toBe(300);
  });

  it('should not go below 150ms floor', () => {
    const tier = scaler.getTierForScore(1000);
    expect(scaler.waveDelayMs(tier)).toBeGreaterThanOrEqual(150);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/engine/DifficultyScaler.spec.ts
```

Expected output: The new waveDelayMs tests fail because the implementation still uses the old switch statement.

- [ ] **Step 3: Commit the tests**

```bash
git add src/engine/DifficultyScaler.spec.ts
git commit -m "test: add tests for formula-based waveDelayMs calculation"
```

---

## Task 4: Implement formula-based waveDelayMs

**Files:**
- Modify: `src/engine/DifficultyScaler.ts:102-116`

- [ ] **Step 1: Replace waveDelayMs switch statement with formula**

Replace the entire waveDelayMs method (lines 102-116) with:

```typescript
waveDelayMs(tier: DifficultyTier): number {
  const cyclePosition = tier.scoreStart % this.cycleLength;
  const tierIndex = Math.floor(cyclePosition / this.tierDuration);
  
  const baseDelay = 300;
  const decrementPerTier = 10;
  const minimumDelay = 150;
  
  const delay = baseDelay - (tierIndex * decrementPerTier);
  return Math.max(delay, minimumDelay);
}
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm test -- src/engine/DifficultyScaler.spec.ts
```

Expected output: All tests pass, including the new waveDelayMs tests.

- [ ] **Step 3: Commit**

```bash
git add src/engine/DifficultyScaler.ts
git commit -m "feat: implement formula-based wave delay calculation"
```

---

## Task 5: Verify all DifficultyScaler tests pass

**Files:**
- Test: `src/engine/DifficultyScaler.spec.ts`
- Test: `src/engine/WaveManager.test.ts`

- [ ] **Step 1: Run full test suite for DifficultyScaler**

```bash
npm test -- src/engine/DifficultyScaler.spec.ts
```

Expected output: 12 tests pass (4 original + 8 new waveDelayMs tests).

- [ ] **Step 2: Run WaveManager tests to ensure no regressions**

```bash
npm test -- src/engine/WaveManager.test.ts
```

Expected output: 5 tests pass (no changes needed).

- [ ] **Step 3: Run entire test suite to check for unexpected breakage**

```bash
npm test
```

Expected output: All tests pass with no new failures.

- [ ] **Step 4: Verify the changes visually**

Review the modified DifficultyScaler.ts to confirm:
- baseTiers all have +500ms to enemyTraverseDurationMs
- waveDelayMs uses formula: 300 - (tierIndex * 10), minimum 150ms
- All other methods unchanged

- [ ] **Step 5: Create final commit**

No additional files to add. All changes already committed in previous tasks.

---

## Summary

The implementation is complete when:
- ✅ All baseTiers enemyTraverseDurationMs values increased by 500ms
- ✅ waveDelayMs switched from switch statement to formula-based calculation
- ✅ Formula: 300ms base, -10ms per tier, 150ms floor
- ✅ All existing tests updated with new expected values
- ✅ New waveDelayMs tests added and passing
- ✅ Full test suite passes with no regressions
