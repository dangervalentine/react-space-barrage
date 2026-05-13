// web/app/arcade/space-barrage/_game/MarqueeArt.tsx
//
// Pixel-art enemy marquee art — mirrors ENEMY_ROWS in
// engine/Renderer.ts (11x7 pixel-art enemy). Each character maps to a
// color via `data-c` attributes that the CSS module styles.
//
// Rendered in two contexts:
//   1. The cabinet marquee (SpaceBarrageGame.tsx) — twin instances on
//      either side of the title text. Cell size defaults to 2px; below
//      380px viewport, App.module.css overrides `--marquee-cell` to 1.5px.
//   2. The /arcade landing tile (GameTile) — single instance with a larger
//      cell size set via landing.module.css.
//
// Cell size is wired through the `--marquee-cell` CSS custom property so
// consumers can size the art without redefining the entire grid template.
// Intrinsic look (grid template, color mapping, cyan drop-shadow) lives
// in MarqueeArt.module.css and travels with the component.

import React from 'react';
import styles from './MarqueeArt.module.css';

const ENEMY_ROWS = [
  '.....y.....',
  '....yby....',
  '...ybbby...',
  '..cbbbbbc..',
  '.ccwbbbwcc.',
  'c.c.yby.c.c',
  '....g.g....',
];

interface Props {
  className?: string;
}

export const SpaceBarrageMarqueeArt: React.FC<Props> = ({ className }) => (
  <span
    className={className ? `${styles.grid} ${className}` : styles.grid}
    aria-hidden
  >
    {ENEMY_ROWS.flatMap((row, r) =>
      row.split('').map((ch, c) => (
        <span key={`${r}-${c}`} data-c={ch === '.' ? '' : ch} />
      )),
    )}
  </span>
);

export default SpaceBarrageMarqueeArt;
