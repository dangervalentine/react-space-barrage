import { randomUpTo } from './types';

export interface PatternSpawn {
  column: number;
  delayMs: number;
}

export interface Pattern {
  type: 'wall' | 'tunnel' | 'diagonal' | 'double' | 'random';
  spawns: PatternSpawn[];
  duration: number;
}

export class PatternGenerator {
  private patterns: Pattern[] = [];
  private currentPatternIndex = 0;

  constructor(difficulty: number) {
    this.generatePatterns(difficulty);
  }

  private generatePatterns(difficulty: number): void {
    this.patterns = [];

    if (difficulty < 200) {
      // Early game: pure random
      this.patterns = Array(5).fill(null).map(() => this.createRandomPattern());
    } else if (difficulty < 500) {
      // Mid game: mostly random with walls and diagonals
      this.patterns.push(this.createWallPattern());
      this.patterns.push(this.createRandomPattern());
      this.patterns.push(this.createLeftDiagonalPattern());
      this.patterns.push(this.createRandomPattern());
      this.patterns.push(this.createRightDiagonalPattern());
      this.patterns.push(this.createWallPattern());
    } else if (difficulty < 1000) {
      // Late game: mix of patterns
      this.patterns.push(this.createWallPattern());
      this.patterns.push(this.createTunnelPattern());
      this.patterns.push(this.createLeftDiagonalPattern());
      this.patterns.push(this.createRandomPattern());
      this.patterns.push(this.createRightDiagonalPattern());
      this.patterns.push(this.createWallPattern());
    } else {
      // End game: challenging patterns
      this.patterns.push(this.createWallPattern());
      this.patterns.push(this.createTunnelPattern());
      this.patterns.push(this.createLeftDiagonalPattern());
      this.patterns.push(this.createDoublePattern());
      this.patterns.push(this.createRightDiagonalPattern());
      this.patterns.push(this.createWallPattern());
    }
  }

  getNextPattern(): Pattern {
    const pattern = this.patterns[this.currentPatternIndex % this.patterns.length];
    this.currentPatternIndex++;
    return pattern;
  }

  updateDifficulty(difficulty: number): void {
    this.currentPatternIndex = 0;
    this.generatePatterns(difficulty);
  }

  private createWallPattern(): Pattern {
    // 3-4 enemies in adjacent columns, staggered slightly
    const startColumn = randomUpTo(8); // 0-7, so wall fits
    const wallWidth = randomUpTo(2) + 3; // 3-4 enemies
    const spawns: PatternSpawn[] = [];

    for (let i = 0; i < wallWidth; i++) {
      spawns.push({
        column: startColumn + i,
        delayMs: i * 80, // Slight stagger for visual effect
      });
    }

    return {
      type: 'wall',
      spawns,
      duration: randomUpTo(5000) + 3000,
    };
  }

  private createTunnelPattern(): Pattern {
    // Dense enemies on sides with gap in middle
    const spawns: PatternSpawn[] = [];

    // Left side: columns 0-2
    for (let col = 0; col < 3; col++) {
      spawns.push({ column: col, delayMs: col * 40 });
    }

    // Right side: columns 8-10
    for (let col = 8; col < 11; col++) {
      spawns.push({ column: col, delayMs: (col - 8) * 40 });
    }

    return {
      type: 'tunnel',
      spawns,
      duration: randomUpTo(5000) + 3000,
    };
  }

  private createLeftDiagonalPattern(): Pattern {
    // Diagonal going up-right: lowest on left, each above goes right
    const spawns: PatternSpawn[] = [];
    for (let col = 0; col < 11; col++) {
      spawns.push({ column: col, delayMs: 0 });
    }
    return {
      type: 'diagonal',
      spawns,
      duration: randomUpTo(2000) + 2000,
    };
  }

  private createRightDiagonalPattern(): Pattern {
    // Diagonal going up-left: lowest on right, each above goes left
    const spawns: PatternSpawn[] = [];
    for (let col = 10; col >= 0; col--) {
      spawns.push({ column: col, delayMs: 0 });
    }
    return {
      type: 'diagonal',
      spawns,
      duration: randomUpTo(2000) + 2000,
    };
  }

  private createDoublePattern(): Pattern {
    // Pair of enemies in adjacent columns
    const spawns: PatternSpawn[] = [];
    const col1 = randomUpTo(10); // 0-9, so col2 fits

    spawns.push({ column: col1, delayMs: 0 });
    spawns.push({ column: col1 + 1, delayMs: 0 });

    return {
      type: 'double',
      spawns,
      duration: randomUpTo(5000) + 3000,
    };
  }

  private createRandomPattern(): Pattern {
    // Single random enemy
    return {
      type: 'random',
      spawns: [
        {
          column: randomUpTo(11),
          delayMs: 0,
        },
      ],
      duration: randomUpTo(5000) + 3000,
    };
  }
}
