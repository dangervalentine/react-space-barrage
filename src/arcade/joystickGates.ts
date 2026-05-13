// web/app/_arcade/joystickGates.ts
//
// Reusable gate functions that translate analog `JoystickState` into the
// per-game inputs an arcade engine accepts. Each gate is a pure function
// — call it inside a per-game `TouchControls.tsx`'s `onChange` handler.
//
// Why these live in `_arcade/`: gates encode arcade-mapping conventions
// (e.g. the canonical 8-way sector wedge that emulates a physical
// 8-position arcade joystick). They're not tied to any one engine's API
// — gates return descriptions of what the player wants; the per-game
// caller routes those into the appropriate `engine.*` calls. This means
// a future rotate-and-thrust game can reuse `eightWayDirectionalGate`
// without taking on the asteroids engine.

import type { JoystickState } from './JoystickCanvas';

// ----- 8-way directional gate (arcade joystick emulation) ----------------
//
// The original 1979 Asteroids cabinet used five discrete buttons; modern
// arcade joysticks model the same input as eight discrete positions
// (4 cardinals + 4 diagonals), each spanning a 45° wedge (22.5° to either
// side of pure cardinal). This gate maps an analog touch joystick onto
// that model.
//
// Per-axis thresholding does NOT work for rotate-and-thrust games like
// Asteroids: a tilt 15° off vertical has |x| ≈ 0.26, which clears any
// reasonable horizontal threshold and triggers full-rate rotation while
// the player is still trying to thrust forward. Because thrust direction
// follows ship rotation, that's a positive-feedback spin loop. The wedge
// gate prevents it: rotation only fires when the horizontal component
// dominates the vertical component (and vice versa for thrust).
//
// Gate ratio: tan(22.5°) ≈ 0.414. A direction's action only fires when
// that axis dominates the other axis by at least this ratio — i.e., the
// stick has cleared the perpendicular cardinal's wedge.

const HORIZONTAL_THRESHOLD = 0.2;
const VERTICAL_UP_THRESHOLD = 0.15;
const SECTOR_WEDGE_TAN = Math.tan(Math.PI / 8);

export interface EightWayInput {
  /** -1 left, 0 neutral, 1 right. */
  rotate: -1 | 0 | 1;
  /** True when the up wedge is engaged. */
  thrust: boolean;
}

/**
 * Map an analog `JoystickState` to the binary {rotate, thrust} input a
 * rotate-and-thrust arcade game expects. Pass the result into your
 * engine's input setters.
 *
 * Example:
 *
 * ```ts
 * const input = eightWayDirectionalGate(state);
 * engine.setRotation(input.rotate);
 * engine.setThrust(input.thrust);
 * ```
 *
 * Returns `{ rotate: 0, thrust: false }` when the stick is at rest.
 */
export function eightWayDirectionalGate(state: JoystickState): EightWayInput {
  if (state.magnitude === 0) {
    return { rotate: 0, thrust: false };
  }
  const ax = Math.abs(state.x);
  const ay = Math.abs(state.y);

  const rotateActive =
    ax > HORIZONTAL_THRESHOLD && ax > ay * SECTOR_WEDGE_TAN;
  const rotate: -1 | 0 | 1 = rotateActive ? (state.x > 0 ? 1 : -1) : 0;

  const thrust =
    state.y < -VERTICAL_UP_THRESHOLD && ay > ax * SECTOR_WEDGE_TAN;

  return { rotate, thrust };
}
