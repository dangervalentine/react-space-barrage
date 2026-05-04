import { DifficultyScaler } from './DifficultyScaler';

describe('DifficultyScaler', () => {
  let scaler: DifficultyScaler;

  beforeEach(() => {
    scaler = new DifficultyScaler();
  });

  describe('getTierForScore', () => {
    it('should return tier 0 with 7 enemies at score 0', () => {
      const tier = scaler.getTierForScore(0);
      expect(tier.maxEnemies).toBe(7);
      expect(tier.enemyTraverseDurationMs).toBe(2000);
      expect(tier.patternType).toBe('wall');
    });

    it('should return tier 1 with 8 enemies at score 35', () => {
      const tier = scaler.getTierForScore(35);
      expect(tier.maxEnemies).toBe(8);
      expect(tier.enemyTraverseDurationMs).toBe(1900);
      expect(tier.patternType).toBe('random');
    });

    it('should apply cycle 1 speed reduction at score 200', () => {
      const tier = scaler.getTierForScore(200);
      expect(tier.maxEnemies).toBe(8);
      expect(tier.enemyTraverseDurationMs).toBe(1700); // 2000 - 300
      expect(tier.patternType).toBe('wall');
    });

    it('should apply cycle 2 speed reduction at score 400', () => {
      const tier = scaler.getTierForScore(400);
      expect(tier.maxEnemies).toBe(9);
      expect(tier.enemyTraverseDurationMs).toBe(1400); // 2000 - 600
      expect(tier.patternType).toBe('wall');
    });
  });
});
