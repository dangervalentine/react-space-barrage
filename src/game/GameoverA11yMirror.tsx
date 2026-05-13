// web/app/arcade/space-barrage/_game/Components/GameoverA11yMirror.tsx
//
// Visually-hidden DOM mirror of the canvas-rendered game-over screen
// for screen readers. Reflects the new reveal/board flow:
//   - Reveal phase: "Final score: X."
//   - Board phase: leaderboard + rank/todaysBest/error context line.
//
// Mounted alongside the canvas during gameover mode.

import React from 'react';
import type { GameoverUI } from '@arcade';
import type { LeaderboardEntry } from '@arcade';
import styles from '@arcade/visually-hidden.module.css';

interface Props {
  /** Current gameover UI state (phase + score + rank/status). */
  ui: GameoverUI;
  /** Server-backed + mock-padded Top 10. Null if not yet fetched. */
  boardEntries: LeaderboardEntry[] | null;
}

export const GameoverA11yMirror: React.FC<Props> = ({ ui, boardEntries }) => {
  if (ui.phase === 'reveal') {
    return (
      <div
        role="region"
        aria-label="Space Barrage — game over"
        aria-live="polite"
        className={styles.hidden}
      >
        <h2>Game Over</h2>
        <p>Final score: {ui.finalScore.toLocaleString()}.</p>
      </div>
    );
  }

  // Board phase — build context lines based on submitStatus / rank.
  const contextLines: string[] = [];
  if (ui.submitStatus === 'username_required') {
    contextLines.push('Set a username to claim your spot on the leaderboard.');
  } else if (ui.submitStatus === 'network_error') {
    contextLines.push("Couldn't save score — try again on next run.");
  } else if (ui.rank !== null && ui.highlightIndex === null) {
    contextLines.push(`Your rank: #${ui.rank} worldwide.`);
  } else if (ui.todaysBest !== null) {
    contextLines.push(`Today's best: ${ui.todaysBest.toLocaleString()}.`);
  }

  return (
    <div
      role="region"
      aria-label="Space Barrage — game over"
      aria-live="polite"
      className={styles.hidden}
    >
      <h2>Game Over</h2>
      <p>Final score: {ui.finalScore.toLocaleString()}.</p>
      {contextLines.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
      {boardEntries && boardEntries.length > 0 && (
        <>
          <h3>Top Scores</h3>
          <ol>
            {boardEntries.map((entry) => (
              <li key={entry.userId}>
                #{entry.rank} {entry.username}: {entry.score.toLocaleString()}
                {entry.rank - 1 === ui.highlightIndex ? ' (your entry)' : ''}
              </li>
            ))}
          </ol>
        </>
      )}
      <p>Press Space or fire to play again.</p>
    </div>
  );
};

export default GameoverA11yMirror;
