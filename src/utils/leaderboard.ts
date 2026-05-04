const STORAGE_KEY = 'space-barrage-leaderboard';
const MAX_ENTRIES = 10;

export interface LeaderboardEntry {
  name: string;
  score: number;
}

export const SEED_ENTRIES: ReadonlyArray<LeaderboardEntry> = [
  { name: 'ACE', score: 1000 },
  { name: 'ZAP', score: 900 },
  { name: 'NEO', score: 800 },
  { name: 'REX', score: 700 },
  { name: 'KAI', score: 600 },
  { name: 'JET', score: 500 },
  { name: 'VIC', score: 400 },
  { name: 'MAX', score: 300 },
  { name: 'PIX', score: 200 },
  { name: 'BOB', score: 100 },
];

const isValidEntry = (value: unknown): value is LeaderboardEntry => {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.name === 'string' && typeof v.score === 'number';
};

const seedCopy = (): LeaderboardEntry[] => SEED_ENTRIES.map((e) => ({ ...e }));

export const loadLeaderboard = (): LeaderboardEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedCopy();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isValidEntry)) return seedCopy();
    return parsed;
  } catch {
    return seedCopy();
  }
};

export const saveLeaderboard = (entries: LeaderboardEntry[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    console.warn('Failed to save leaderboard to localStorage');
  }
};

export const qualifies = (score: number, board: readonly LeaderboardEntry[]): boolean => {
  if (board.length < MAX_ENTRIES) return true;
  return score > board[board.length - 1].score;
};

export const insert = (
  board: readonly LeaderboardEntry[],
  entry: LeaderboardEntry,
): LeaderboardEntry[] => {
  const next = [...board, entry];
  next.sort((a, b) => b.score - a.score);
  return next.slice(0, MAX_ENTRIES);
};

export const getRank = (score: number, board: readonly LeaderboardEntry[]): number => {
  let rank = 1;
  for (const entry of board) {
    if (entry.score >= score) rank += 1;
    else break;
  }
  return rank;
};
