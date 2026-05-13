export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarToken: string | null;
  score: number;
  achievedAt: string;
  rank: number;
}
