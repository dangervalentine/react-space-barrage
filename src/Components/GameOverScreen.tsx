import React, { useMemo, useState } from 'react';
import {
  loadLeaderboard,
  saveLeaderboard,
  qualifies,
  insert,
  getRank,
  type LeaderboardEntry,
} from '../utils/leaderboard';
import styles from './GameOverScreen.module.css';

interface GameOverScreenProps {
  score: number;
  onPlayAgain: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, onPlayAgain }) => {
  const initialBoard = useMemo(() => loadLeaderboard(), []);
  const initiallyQualifies = useMemo(
    () => qualifies(score, initialBoard),
    [score, initialBoard],
  );

  const [board, setBoard] = useState<LeaderboardEntry[]>(initialBoard);
  const [phase, setPhase] = useState<'entry' | 'board'>(
    initiallyQualifies ? 'entry' : 'board',
  );
  const [name, setName] = useState('');
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    setName(cleaned);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length === 0) return;
    const entry: LeaderboardEntry = { name, score };
    const nextBoard = insert(board, entry);
    saveLeaderboard(nextBoard);
    setBoard(nextBoard);
    const idx = nextBoard.findIndex((b) => b === entry);
    setHighlightIndex(idx >= 0 ? idx : null);
    setPhase('board');
  };

  const playerRank = !initiallyQualifies ? getRank(score, board) : null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.starfield} aria-hidden />
      <div className={styles.banner}>
        <h1 className={styles.title}>GAME OVER</h1>
        <p className={styles.scoreLine}>SCORE {score}</p>

        {phase === 'entry' ? (
          <form className={styles.entryForm} onSubmit={handleSubmit}>
            <p className={styles.subtitle}>★ NEW HIGH SCORE ★</p>
            <input
              className={styles.nameInput}
              value={name}
              onChange={handleNameChange}
              maxLength={3}
              autoFocus
              aria-label="Enter your initials"
            />
            <button
              type="submit"
              className={styles.button}
              disabled={name.length === 0}
            >
              SUBMIT
            </button>
          </form>
        ) : (
          <>
            <div className={styles.board}>
              {board.map((entry, i) => (
                <div
                  key={i}
                  className={`${styles.row} ${i === highlightIndex ? styles.rowHighlight : ''}`}
                >
                  <span className={styles.rank}>{i + 1}</span>
                  <span>{entry.name}</span>
                  <span className={styles.scoreCell}>{entry.score}</span>
                </div>
              ))}
            </div>
            {playerRank !== null && (
              <p className={styles.rankLine}>YOUR RANK {playerRank}</p>
            )}
            <div className={styles.actions}>
              <button type="button" className={styles.button} onClick={onPlayAgain}>
                PLAY AGAIN
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GameOverScreen;
