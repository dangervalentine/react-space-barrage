# Aggressive Difficulty Scaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recalibrate `DifficultyScaler` to create an immediately threatening game that escalates 50% faster, with enemies starting at 2000ms speed (vs 8000ms) and a 500ms floor (vs 1000ms).

**Architecture:** Single class refactor. Update the `baseTiers` array with aggressive starting values (7 enemies, 2000ms), change `cycleLength` to 200 and `tierDuration` to 35, adjust per-cycle speed scaling to -300ms, and lower the minimum speed threshold. No new classes or interfaces.

**Tech Stack:** TypeScript, Jest (existing test suite)

---

### Task 1: Update Base Tier Values

**Files:**
- Modify: `src/engine/DifficultyScaler.ts:17-24` (baseTiers array)

- [ ] **Step 1: Read the current baseTiers array**

Open `src/engine/DifficultyScaler.ts` and locate the `baseTiers` property. Note the current structure and order.

- [ ] **Step 2: Replace baseTiers with aggressive values**

Replace lines 17-24 (the entire `baseTiers` array) with:

```typescript
private baseTiers: Omit<DifficultyTier, 'scoreStart' | 'scoreEnd'>[] = [
  { maxEnemies: 7, enemyTraverseDurationMs: 2000, patternType: 'wall' },
  { maxEnemies: 8, enemyTraverseDurationMs: 1900, patternType: 'random' },
  { maxEnemies: 9, enemyTraverseDurationMs: 1800, patternType: 'diagonal' },
  { maxEnemies: 10, enemyTraverseDurationMs: 1700, patternType: 'random' },
  { maxEnemies: 11, enemyTraverseDurationMs: 1600, patternType: 'gaps' },
  { maxEnemies: 12, enemyTraverseDurationMs: 1500, patternType: 'random' },
];
```

**Verification:** Check that all 6 tiers are present with increasing enemy counts (7→12) and decreasing speed (2000→1500ms) and correct pattern types.

- [ ] **Step 3: Commit this change**

```bash
git add src/engine/DifficultyScaler.ts
git commit -m "feat: update base tier values to aggressive starting difficulty"
```

---

### Task 2: Update Progression Constants

**Files:**
- Modify: `src/engine/DifficultyScaler.ts:26-27` (cycleLength and tierDuration)

- [ ] **Step 1: Locate progression constants**

In `src/engine/DifficultyScaler.ts`, find the lines defining `cycleLength = 300` and `tierDuration = 50`.

- [ ] **Step 2: Update cycleLength**

Change line 26 from:
```typescript
private cycleLength = 300;
```

To:
```typescript
private cycleLength = 200;
```

- [ ] **Step 3: Update tierDuration**

Change line 27 from:
```typescript
private tierDuration = 50;
```

To:
```typescript
private tierDuration = 35;
```

**Verification:** Confirm both changes are present and reflect the new cycle/tier structure (200-point cycles, 35-point tiers = 6 tiers per cycle, same as before).

- [ ] **Step 4: Commit this change**

```bash
git add src/engine/DifficultyScaler.ts
git commit -m "feat: compress difficulty progression to 200-point cycles and 35-point tiers"
```

---

### Task 3: Update Speed Scaling Per Cycle

**Files:**
- Modify: `src/engine/DifficultyScaler.ts:51-54` (getTierForScore method, speed calculation)

- [ ] **Step 1: Locate the speed scaling calculation in getTierForScore**

In `getTierForScore` method around line 51-54, find:
```typescript
// Speed increases per cycle: -600ms per cycle
const speedIncrease = cycleCount * 600;
const duration = Math.max(1000, baseTier.enemyTraverseDurationMs - speedIncrease);
```

- [ ] **Step 2: Update speed scaling and minimum**

Replace those lines with:
```typescript
// Speed increases per cycle: -300ms per cycle
const speedIncrease = cycleCount * 300;
const duration = Math.max(500, baseTier.enemyTraverseDurationMs - speedIncrease);
```

**Changes:**
- Speed scaling from 600ms → 300ms per cycle
- Minimum speed from 1000ms → 500ms

**Verification:** Confirm the comment reflects -300ms, the multiplier is 300, and the minimum is 500.

- [ ] **Step 3: Commit this change**

```bash
git add src/engine/DifficultyScaler.ts
git commit -m "feat: adjust per-cycle speed scaling to -300ms and lower minimum to 500ms"
```

---

### Task 4: Run Existing Test Suite

**Files:**
- Test: `src/engine/DifficultyScaler.test.ts`

- [ ] **Step 1: Run the test suite**

```bash
npm test -- src/engine/DifficultyScaler.test.ts --watch=false
```

**Expected:** All existing tests pass. If any fail, it indicates a logic error in the changes above. Review the test failure, identify the mismatch, and fix the implementation.

- [ ] **Step 2: Verify playtest values manually**

In the same terminal, run Node interactively to spot-check the new difficulty progression:

```bash
node
```

Then in the Node REPL:

```javascript
const { DifficultyScaler } = require('./src/engine/DifficultyScaler.ts');
const scaler = new DifficultyScaler();

// Score 0: tier 0, cycle 0
console.log(scaler.getTierForScore(0));
// Expected: maxEnemies: 7, enemyTraverseDurationMs: 2000, patternType: 'wall', scoreStart: 0, scoreEnd: 35

// Score 35: tier 1, cycle 0
console.log(scaler.getTierForScore(35));
// Expected: maxEnemies: 8, enemyTraverseDurationMs: 1900, patternType: 'random', scoreStart: 35, scoreEnd: 70

// Score 200: tier 0, cycle 1 (new cycle)
console.log(scaler.getTierForScore(200));
// Expected: maxEnemies: 8, enemyTraverseDurationMs: 1700, patternType: 'wall', scoreStart: 200, scoreEnd: 235
// (cycle 1 adds -300ms to base 2000ms = 1700ms)

// Score 500: deep into cycle 2
console.log(scaler.getTierForScore(500));
// Expected: enemyTraverseDurationMs: 1400 (base 2000 - 600ms for cycles 1-2)
```

Exit with `Ctrl+D` or `.exit`.

**Verification:** Output matches expected values. If not, review the calculation logic.

- [ ] **Step 3: No additional commit needed**

Test runs are verification only, no code changes. All changes have been committed in previous tasks.

---

### Task 5: Manual Playtest

**Files:**
- Run: Game dev server

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open `localhost:5173` (or the port shown) in a browser.

- [ ] **Step 2: Play the game for ~30-60 seconds and observe**

**At score 0:**
- Game should feel immediately overwhelming
- 7 enemies on screen
- Enemies move relatively fast (2000ms across screen = 2 seconds)
- Pattern should be "wall"

**At ~35-70 points (~30-60 seconds):**
- Enemy count increases to 8-9
- Speed noticeably increases (1900-1800ms)
- Pattern should cycle through random/diagonal
- Game should feel genuinely challenging, not just hectic

**Notes:**
- If game feels too easy, values are too high (reduce enemy count or increase speed)
- If game feels unfair (enemies too fast to react), reduce speed slightly
- If enemy count feels chaotic, reduce by 1-2 from baseTiers

- [ ] **Step 3: Document observations**

Note any difficulty/balance issues. If changes needed, report back to designer before modifying. If acceptable, proceed to next step.

- [ ] **Step 4: No code changes from playtest**

Playtest is validation only. If balance tuning is needed, it's a separate task. If acceptable as-is, nothing to commit.

---

### Task 6: Final Verification

**Files:**
- Verify: `src/engine/DifficultyScaler.ts` (complete file)
- Verify: git commit history

- [ ] **Step 1: Review all changes in context**

```bash
git diff HEAD~3 src/engine/DifficultyScaler.ts
```

Verify:
- baseTiers: 7→12 enemies, 2000→1500ms speed, patterns intact
- cycleLength: 200
- tierDuration: 35
- Speed scaling: -300ms per cycle
- Minimum: 500ms

- [ ] **Step 2: Check commit history**

```bash
git log --oneline -5
```

Expected commits:
1. "feat: adjust per-cycle speed scaling to -300ms and lower minimum to 500ms"
2. "feat: compress difficulty progression to 200-point cycles and 35-point tiers"
3. "feat: update base tier values to aggressive starting difficulty"
4. "spec: aggressive difficulty scaling design"
5. (prior commit)

- [ ] **Step 3: Done**

All changes committed and validated. Ready for code review or merge.

---

## Acceptance Criteria

✅ `DifficultyScaler.baseTiers` updated with 7→12 enemies and 2000→1500ms speeds  
✅ `cycleLength` changed to 200 points  
✅ `tierDuration` changed to 35 points  
✅ Per-cycle speed scaling changed to -300ms  
✅ Minimum speed floor changed to 500ms  
✅ Existing test suite passes  
✅ Manual playtest confirms immediate difficulty and reasonable progression  
✅ All changes committed with clear messages
