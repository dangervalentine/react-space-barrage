// web/app/_arcade/PauseA11yMirror.tsx
//
// Visually-hidden DOM mirror of the canvas-rendered pause menu for
// screen readers. The pause menu is painted entirely via canvas
// (drawPauseMenu in canvasUI.ts), which is invisible to assistive
// tech — this component announces the same content through an
// `aria-live` region so the menu is reachable without sight.
//
// Sister to each game's LandingA11yMirror / GameoverA11yMirror, but
// lives in `_arcade/` (not per-game) because the menu shape is
// identical between cabinets — both games use DEFAULT_PAUSE_ITEMS
// and the same nav controls. Mounted by each per-game adapter when
// `mode === 'paused'`.

import React from 'react';
import type { PauseMenuItem } from './arcadeFrame';
import styles from './visually-hidden.module.css';

interface Props {
  /** Game name for the region label — keeps this mirror generic
   *  while letting the announcement read naturally ("Asteroids
   *  pause menu" vs "Space Barrage pause menu"). */
  gameLabel: string;
  items: ReadonlyArray<PauseMenuItem>;
  selectedIndex: number;
}

/** Visually-hidden mirror of the pause menu. Uses `aria-live="polite"`
 *  so a screen reader announces the menu when it opens AND each time
 *  the selection changes (the announcement re-fires whenever the
 *  selected item's text changes — we wrap the selected label in a
 *  `<strong>` so the highlight is also conveyed semantically, not
 *  just via `aria-selected`).
 *
 *  Why polite (not assertive): the menu doesn't preempt — it's an
 *  expected interaction, the player just opened it. Polite waits
 *  for any current speech to finish before reading the menu, which
 *  is the correct tradeoff for a non-emergency overlay. */
export const PauseA11yMirror: React.FC<Props> = ({
  gameLabel, items, selectedIndex,
}) => {
  const selected = items[selectedIndex];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${gameLabel} pause menu`}
      aria-live="polite"
      className={styles.hidden}
    >
      <h2>Paused</h2>
      <p>
        {selected
          ? `Selected: ${selected.label}.`
          : ''}
      </p>
      <ul>
        {items.map((item, i) => (
          <li
            key={item.id}
            aria-current={i === selectedIndex ? 'true' : undefined}
          >
            {i === selectedIndex ? <strong>{item.label}</strong> : item.label}
          </li>
        ))}
      </ul>
      <p>
        Press up or down (W or S) to move the selection. Press space,
        the fire button, or tap the NEXTQUEST plate to confirm.
        Press Escape to close the menu and resume the game.
      </p>
    </div>
  );
};

export default PauseA11yMirror;
