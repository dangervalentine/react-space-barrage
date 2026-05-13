// web/app/_arcade/ArcadePerspectiveButtonRow.tsx
//
// Universal desktop chrome — four buttons EMBEDDED into a tilted
// control panel. Renders inside `ArcadeCabinet` on desktop only;
// keyboard handles input on desktop, so this is decoration.
//
// **The panel reads as a tilted surface, not a flat strip.** Drawn as
// a trapezoid wider at the bottom than the top — the bottom edge is
// the front of the panel (closer to the viewer's eye), the top edge
// recedes into the cabinet. Slight trapezoid taper (~80px difference
// over 720px width) gives perceptible perspective without tipping
// into "kitschy CSS-3D widget" territory.
//
// **Each button looks embedded, not standing on top.** Layered as:
//   1. Outer chrome flange (the bolt-through ring real arcade buttons
//      have where they mount to the panel surface)
//   2. Inner chrome edge (separates the flange from the cap, sells
//      the "ring around a hole" depth)
//   3. Cap (the colored top — foreshortened ellipse, ~13° viewing
//      angle, ry/rx ≈ 0.33)
//   4. Concave inner shadow (a smaller darker ellipse on the cap that
//      reads as the scooped-out depression on a real arcade button)
// Plus a 1px highlight on the cap's top rim to imply a physical edge,
// not a sticker.
//
// Color sequence: classic 4-button arcade palette
// `[coral / yellow / green / primary-blue]` — distinct hues, no
// repeats, reads as one row of a multi-button cabinet (not a candy
// repeat). User picked 6-button mirrored in v1; downgraded to 4 here
// after feedback that 6 was too uniform and pastel.

import React from 'react';
import styles from './ArcadePerspectiveButtonRow.module.css';

// --- Geometry constants ---------------------------------------------------
// viewBox 720x96. Panel is a trapezoid: top edge narrower (further
// from the viewer in 3D), bottom edge wider (closer). 80px taper over
// 96px height gives a viewing angle of ~22° per side — pronounced
// enough to read as "tilted away" without screaming "fake 3D".
const VB_WIDTH = 720;
const VB_HEIGHT = 96;

const PANEL_TOP_LEFT_X = 40;
const PANEL_TOP_RIGHT_X = 680;
// Bottom corners are 0 and VB_WIDTH (full width).

// Buttons sit at vertical center of panel — same depth in 3D space,
// so they're at the same y in the SVG. Even spacing across panel.
const CAP_CY = 50;
const CAP_RX = 24;
const CAP_RY = 8;             // ry/rx ≈ 0.33 → ~13° viewing angle
const FLANGE_RX = 31;
const FLANGE_RY = 10.5;
const FLANGE_INNER_RX = 27;
const FLANGE_INNER_RY = 9.0;
const INNER_SHADOW_RX = 14;
const INNER_SHADOW_RY = 4.5;
const INNER_SHADOW_OFFSET_Y = 0.5;  // slight downward offset reads as
                                     // a concave depression catching
                                     // top light, not a flat sticker.

type ButtonColor = 'coral' | 'yellow' | 'green' | 'primary';

interface ButtonSpec {
  cx: number;
  color: ButtonColor;
}

const BUTTONS: ReadonlyArray<ButtonSpec> = [
  { cx: 180, color: 'coral'   },
  { cx: 300, color: 'yellow'  },
  { cx: 420, color: 'green'   },
  { cx: 540, color: 'primary' },
];

const CAP_CLASS: Record<ButtonColor, string> = {
  coral:   styles.capCoral,
  yellow:  styles.capYellow,
  green:   styles.capGreen,
  primary: styles.capPrimary,
};

const CAP_INNER_CLASS: Record<ButtonColor, string> = {
  coral:   styles.capInnerCoral,
  yellow:  styles.capInnerYellow,
  green:   styles.capInnerGreen,
  primary: styles.capInnerPrimary,
};

export const ArcadePerspectiveButtonRow: React.FC = () => (
  <svg
    className={styles.row}
    viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
    preserveAspectRatio="xMidYMid meet"
    aria-hidden
    focusable="false"
  >
    {/* Panel surface — trapezoid wider at the bottom than the top.
        Reads as a control panel tilted away from the viewer. */}
    <path
      d={`
        M ${PANEL_TOP_LEFT_X} 0
        L ${PANEL_TOP_RIGHT_X} 0
        L ${VB_WIDTH} ${VB_HEIGHT}
        L 0 ${VB_HEIGHT}
        Z
      `}
      className={styles.panel}
    />
    {/* Top edge highlight — implies the panel's far edge catches a
        sliver of light from above. */}
    <line
      x1={PANEL_TOP_LEFT_X}
      y1={0}
      x2={PANEL_TOP_RIGHT_X}
      y2={0}
      className={styles.panelTopEdge}
    />
    {/* Inner shadow band along the top edge — sells "panel surface
        receding into shadow at the top". */}
    <path
      d={`
        M ${PANEL_TOP_LEFT_X} 0
        L ${PANEL_TOP_RIGHT_X} 0
        L ${PANEL_TOP_RIGHT_X - 6} 8
        L ${PANEL_TOP_LEFT_X + 6} 8
        Z
      `}
      className={styles.panelTopShadow}
    />

    {BUTTONS.map(({ cx, color }) => (
      <g key={cx}>
        {/* Outer chrome flange (the bolt-through ring). */}
        <ellipse
          cx={cx}
          cy={CAP_CY}
          rx={FLANGE_RX}
          ry={FLANGE_RY}
          className={styles.flangeOuter}
        />
        {/* Inner chrome edge — visible as a thin ring between flange
            and cap. Sells the "hole in the panel" depth. */}
        <ellipse
          cx={cx}
          cy={CAP_CY}
          rx={FLANGE_INNER_RX}
          ry={FLANGE_INNER_RY}
          className={styles.flangeInner}
        />
        {/* Cap — the colored button top. */}
        <ellipse
          cx={cx}
          cy={CAP_CY}
          rx={CAP_RX}
          ry={CAP_RY}
          className={CAP_CLASS[color]}
        />
        {/* Concave inner shadow — darker version of the cap hue,
            slightly offset down. Gives the scooped/depressed look
            real arcade buttons have. */}
        <ellipse
          cx={cx}
          cy={CAP_CY + INNER_SHADOW_OFFSET_Y}
          rx={INNER_SHADOW_RX}
          ry={INNER_SHADOW_RY}
          className={CAP_INNER_CLASS[color]}
        />
        {/* Cap rim highlight — top half arc only, low-opacity stroke.
            Stops the cap reading as a flat sticker. */}
        <path
          d={`M ${cx - CAP_RX} ${CAP_CY} A ${CAP_RX} ${CAP_RY} 0 0 1 ${cx + CAP_RX} ${CAP_CY}`}
          className={styles.capRim}
        />
      </g>
    ))}
  </svg>
);

export default ArcadePerspectiveButtonRow;
