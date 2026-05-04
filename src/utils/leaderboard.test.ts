import { beforeEach, describe, expect, it } from 'vitest';
import {
  SEED_ENTRIES,
  loadLeaderboard,
  saveLeaderboard,
  qualifies,
  insert,
  getRank,
  type LeaderboardEntry,
} from './leaderboard';

const STORAGE_KEY = 'space-barrage-leaderboard';

describe('leaderboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('SEED_ENTRIES', () => {
    it('contains exactly 10 entries sorted descending by score', () => {
      expect(SEED_ENTRIES).toHaveLength(10);
      for (let i = 1; i < SEED_ENTRIES.length; i++) {
        expect(SEED_ENTRIES[i - 1].score).toBeGreaterThanOrEqual(SEED_ENTRIES[i].score);
      }
    });

    it('every entry has a 3-letter uppercase name', () => {
      for (const entry of SEED_ENTRIES) {
        expect(entry.name).toMatch(/^[A-Z]{3}$/);
      }
    });
  });

  describe('loadLeaderboard', () => {
    it('returns seed entries when storage is empty', () => {
      expect(loadLeaderboard()).toEqual(SEED_ENTRIES);
    });

    it('returns seed entries when stored value is malformed JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not-json');
      expect(loadLeaderboard()).toEqual(SEED_ENTRIES);
    });

    it('returns seed entries when stored value is not an array of entries', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ wrong: 'shape' }));
      expect(loadLeaderboard()).toEqual(SEED_ENTRIES);
    });

    it('returns seed entries when array contains invalid entries', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([{ name: 'AAA' }]));
      expect(loadLeaderboard()).toEqual(SEED_ENTRIES);
    });

    it('returns parsed entries when storage holds a valid array', () => {
      const stored: LeaderboardEntry[] = [
        { name: 'XYZ', score: 999 },
        { name: 'ABC', score: 100 },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      expect(loadLeaderboard()).toEqual(stored);
    });

    it('returns a fresh copy of seed entries (not a shared reference)', () => {
      const a = loadLeaderboard();
      const b = loadLeaderboard();
      expect(a).not.toBe(b);
    });
  });

  describe('saveLeaderboard', () => {
    it('round-trips through loadLeaderboard', () => {
      const entries: LeaderboardEntry[] = [{ name: 'ZZZ', score: 1 }];
      saveLeaderboard(entries);
      expect(loadLeaderboard()).toEqual(entries);
    });
  });

  describe('qualifies', () => {
    it('is true when board has fewer than 10 entries', () => {
      expect(qualifies(1, [])).toBe(true);
      expect(qualifies(1, SEED_ENTRIES.slice(0, 9))).toBe(true);
    });

    it('is true when score is strictly greater than the lowest', () => {
      const lowest = SEED_ENTRIES[SEED_ENTRIES.length - 1].score;
      expect(qualifies(lowest + 1, SEED_ENTRIES)).toBe(true);
    });

    it('is false on tie with the lowest entry', () => {
      const lowest = SEED_ENTRIES[SEED_ENTRIES.length - 1].score;
      expect(qualifies(lowest, SEED_ENTRIES)).toBe(false);
    });

    it('is false when score is below the lowest entry', () => {
      const lowest = SEED_ENTRIES[SEED_ENTRIES.length - 1].score;
      expect(qualifies(lowest - 1, SEED_ENTRIES)).toBe(false);
    });
  });

  describe('insert', () => {
    it('keeps board sorted descending and capped at 10', () => {
      const result = insert(SEED_ENTRIES, { name: 'NEW', score: 99999 });
      expect(result).toHaveLength(10);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
      }
      expect(result[0]).toEqual({ name: 'NEW', score: 99999 });
    });

    it('drops the previous lowest when board is full', () => {
      const previousLowest = SEED_ENTRIES[SEED_ENTRIES.length - 1];
      const result = insert(SEED_ENTRIES, { name: 'NEW', score: previousLowest.score + 1 });
      expect(result).not.toContainEqual(previousLowest);
      expect(result).toHaveLength(10);
    });

    it('does not mutate the input array', () => {
      const before = [...SEED_ENTRIES];
      insert(SEED_ENTRIES, { name: 'NEW', score: 99999 });
      expect(SEED_ENTRIES).toEqual(before);
    });
  });

  describe('getRank', () => {
    it('returns 1 for a score above all entries', () => {
      const top = SEED_ENTRIES[0].score;
      expect(getRank(top + 1, SEED_ENTRIES)).toBe(1);
    });

    it('returns the correct mid-board rank', () => {
      const board: LeaderboardEntry[] = [
        { name: 'AAA', score: 100 },
        { name: 'BBB', score: 80 },
        { name: 'CCC', score: 60 },
      ];
      expect(getRank(70, board)).toBe(3);
    });

    it('returns rank past the end for a score below the lowest', () => {
      const board: LeaderboardEntry[] = [
        { name: 'AAA', score: 100 },
        { name: 'BBB', score: 80 },
      ];
      expect(getRank(10, board)).toBe(3);
    });

    it('treats a tie as the lower rank (after the equal entry)', () => {
      const board: LeaderboardEntry[] = [
        { name: 'AAA', score: 100 },
        { name: 'BBB', score: 80 },
      ];
      expect(getRank(80, board)).toBe(3);
    });
  });
});
