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
      expect(tier.enemyTraverseDurationMs).toBe(2500);
      expect(tier.patternType).toBe('wall');
    });

    it('should return tier 1 with 8 enemies at score 35', () => {
      const tier = scaler.getTierForScore(35);
      expect(tier.maxEnemies).toBe(8);
      expect(tier.enemyTraverseDurationMs).toBe(2400);
      expect(tier.patternType).toBe('random');
    });

    it('should apply cycle 1 speed reduction at score 200', () => {
      const tier = scaler.getTierForScore(200);
      expect(tier.maxEnemies).toBe(8);
      expect(tier.enemyTraverseDurationMs).toBe(2200); // 2500 - 300
      expect(tier.patternType).toBe('wall');
    });

    it('should apply cycle 2 speed reduction at score 400', () => {
      const tier = scaler.getTierForScore(400);
      expect(tier.maxEnemies).toBe(9);
      expect(tier.enemyTraverseDurationMs).toBe(1900); // 2500 - 600
      expect(tier.patternType).toBe('wall');
    });
  });

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
});
