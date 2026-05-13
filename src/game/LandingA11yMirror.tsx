// web/app/arcade/space-barrage/_game/Components/LandingA11yMirror.tsx
//
// Visually-hidden DOM mirror of the canvas-rendered landing screen
// for screen readers. Sister to asteroids' LandingA11yMirror — same
// `aria-live="polite"` shape, different copy.
// Canvas text is invisible to a11y tooling, so the visible state
// announces itself here via plain HTML inside an aria-live region.
//
// Mounted alongside the canvas during landing mode. Reads the same
// server-backed `boardEntries` data the renderer reads, passed in as
// a prop by SpaceBarrageGame.tsx (filled from the shared leaderboardRef).

import React from 'react';
import type { LeaderboardEntry } from '@arcade';
import type { LandingView } from '@arcade';
import styles from '@arcade/visually-hidden.module.css';

interface Props {
  view: LandingView;
  /** Server-backed + mock-padded Top 10 entries. Null if not yet fetched. */
  boardEntries: LeaderboardEntry[] | null;
}

export const LandingA11yMirror: React.FC<Props> = ({ view, boardEntries }) => {
  return (
    <div
      role="region"
      aria-label="Space Barrage — landing screen"
      aria-live="polite"
      className={styles.hidden}
    >
      <h2>Space Barrage</h2>
      {view === 'title' ? (
        <p>
          Press Space, Enter, or the fire button to start the game. On
          this menu, press W or up to cycle the ship variant; press A,
          D, left, or right to switch to the top scores view. In game,
          W A S D or arrow keys move the ship and Space fires.
        </p>
      ) : (
        <>
          <h3>Top Scores</h3>
          <ol>
            {(boardEntries ?? []).map((entry) => (
              <li key={entry.userId}>
                #{entry.rank} {entry.username}: {entry.score.toLocaleString()}
              </li>
            ))}
          </ol>
          <p>
            Press W or up to view the full leaderboard. Press A, D,
            left, or right to return to the title screen. Press Space
            or the fire button to start the game.
          </p>
        </>
      )}
    </div>
  );
};

export default LandingA11yMirror;
