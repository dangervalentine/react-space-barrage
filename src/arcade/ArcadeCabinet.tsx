// web/app/_arcade/ArcadeCabinet.tsx
//
// Shared arcade cabinet shell. Renders ONE screen — wrapped in two
// nested `display: contents` boxes (`.desktopBody` and
// `.desktopScreenArea`) that vanish from the layout on mobile,
// letting `.screenBezel` flow up into `.container`'s flex column
// alongside the mobile-only chrome (deck, controls, base). On desktop
// (≥769px) those wrappers become real flex containers and paint the
// cabinet silhouette + screen-area surround region.
//
// **Why single-mount:** the screen contains stateful subtrees
// (`<GameCanvas>` mounts a `<canvas>` ref consumed by the renderer +
// the engine's `onUpdateRef`). Rendering it twice would double-mount
// the canvas and race the engine's per-tick callback. `display:
// contents` keeps one DOM mount across both breakpoints with no JS
// viewport branching.
//
// Mobile path (≤768px): mobile chrome regions render — marquee,
// screen bezel (via the `display: contents` chain), cabinet deck
// (speakers + coin slot), control panel (filled by `controlsSlot`),
// and the brand-plate base.
//
// Desktop path (≥769px): mobile regions stay `display: none`. The
// `.desktopBody` wrapper paints the cabinet body color silhouette and
// fades to transparent at the bottom (revealing the page's
// `--color-bg-floor`). `controlsSlot` does NOT render visibly — the
// `.controlPanel` host stays hidden and keyboard handles input.
//
// Slot props:
//   - `marqueeText` — string used by both mobile and desktop marquees.
//   - `marqueeDecoration` — game-specific React element rendered on
//     **both sides** of the marquee text. Stateless / pure components
//     only (the same node is mounted at multiple sibling positions:
//     four times total — twice in the mobile marquee, twice in the
//     desktop marquee).
//   - `screenSurround` — OPTIONAL, desktop-only per-game art rendered
//     behind the screen. The cabinet wraps it in a `position:
//     absolute; inset: 0` layer; the surround component should fill
//     that layer via its own styles. Mobile hides this layer
//     entirely. When omitted on desktop, the cabinet body color shows
//     through the screen-area peek zones — the intended default until
//     each game ships its own surround art.
//   - `controlsSlot` — single, generic mobile-only region. Each game
//     ships its own controls component (joystick + button, 4-button
//     d-pad, 6-button row, etc.) and fills this slot. The cabinet
//     provides the chrome and rivets; layout and behavior are entirely
//     the game's responsibility. Reusable primitives the game can
//     compose: `<JoystickCanvas>`, the `cabinet.actionButton` styled
//     class, gate functions like `eightWayDirectionalGate`.
//   - `children` — screen content, typically `!started ? <Landing /> :
//     finalScore !== null ? <GameOver /> : <GameCanvas />`. Mounts
//     ONCE inside `.screenBezel` regardless of breakpoint.

import React from 'react';
import cabinet from './cabinet.module.css';
import { ArcadePerspectiveButtonRow } from './ArcadePerspectiveButtonRow';

export interface ArcadeCabinetProps {
  /** Title displayed in the marquee — `ASTEROIDS`, `SPACE BARRAGE`, etc. */
  marqueeText: string;
  /** Game-specific decoration rendered on **both sides** of the marquee
   *  text. Pass either an SVG element or a CSS-grid pixel-art component
   *  — the cabinet just renders the same node multiple times. Stateless
   *  / pure components only (mobile renders it twice in the mobile
   *  marquee, desktop renders it twice in the desktop marquee — only
   *  one of those marquees is ever visible per breakpoint, but React
   *  always commits both subtrees). */
  marqueeDecoration: React.ReactNode;
  /** Optional desktop-only per-game art rendered behind the screen.
   *  The cabinet positions it absolutely (`inset: 0`) inside the
   *  desktop screen-area wrapper; the surround component should set
   *  its own `position: absolute; inset: 0` to fill the layer. Hidden
   *  on mobile. When omitted, cabinet body color shows through. */
  screenSurround?: React.ReactNode;
  /** Screen content — typically `!started ? <Landing /> : finalScore !==
   *  null ? <GameOver /> : <GameCanvas />`. Mounts once. */
  children: React.ReactNode;
  /** Mobile-only controls region. Single slot — fill it with whatever
   *  the game needs. Not visible on desktop (the entire mobile control
   *  panel stays `display: none` ≥769px). */
  controlsSlot: React.ReactNode;
  /** Whether the brand plates render as interactive pause buttons.
   *  True while the run is mid-flight (`mode ∈ {playing, paused}`);
   *  false on landing/gameover so plates stay inert chrome. When
   *  true, both the desktop bezel-strip plate and the mobile-deck
   *  plate become real `<button>`s wired to `onPauseToggle` and gain
   *  the `.brandPlateLit` glow class. */
  isPlayMode?: boolean;
  /** Toggle the pause menu — fires when the player clicks/taps either
   *  brand plate while `isPlayMode` is true. Ignored otherwise. */
  onPauseToggle?: () => void;
  /** True while the pause menu is open. Drives the brand plate's
   *  aria-label between "Pause game" and "Resume game"; the lit glow
   *  stays on in both states. */
  isPaused?: boolean;
}

export function ArcadeCabinet({
  marqueeText,
  marqueeDecoration,
  screenSurround,
  children,
  controlsSlot,
  isPlayMode = false,
  onPauseToggle,
  isPaused = false,
}: ArcadeCabinetProps): React.ReactElement {
  // Computed once per render: brand plate variant. When `isPlayMode`
  // is true, both plates render as `<button>`s with the lit class +
  // a click handler; otherwise they render as inert `<div>`s and the
  // surrounding region keeps `aria-hidden`. Kept inline because the
  // body is small and React's reconciler doesn't care about the
  // identity of the rendered element type.
  const plateLabel = isPaused ? 'Resume game' : 'Pause game';
  const plateClass = isPlayMode
    ? `${cabinet.brandPlate} ${cabinet.brandPlateLit}`
    : cabinet.brandPlate;
  const desktopPlateClass = isPlayMode
    ? `${cabinet.desktopBrandPlate} ${cabinet.brandPlateLit}`
    : cabinet.desktopBrandPlate;

  return (
    <div className={cabinet.container}>
      {/* ============ MOBILE MARQUEE (≤768px) ============ */}
      <div className={cabinet.marquee} aria-hidden="true">
        <span className={cabinet.rivet} style={{ top: 6, left: 6 }} />
        <span className={cabinet.rivet} style={{ top: 6, right: 6 }} />
        <span className={cabinet.rivet} style={{ bottom: 6, left: 6 }} />
        <span className={cabinet.rivet} style={{ bottom: 6, right: 6 }} />
        {marqueeDecoration}
        <span className={cabinet.marqueeText}>{marqueeText}</span>
        {marqueeDecoration}
      </div>

      {/* ============ DESKTOP CHROME + SHARED SCREEN ============
          `.desktopBody` and `.desktopScreenArea` are `display: contents`
          on mobile — they don't generate boxes, so `.screenBezel` flows
          up into `.container`'s flex column at the position between the
          mobile marquee and the cabinet deck. On desktop they become
          real flex containers and frame the screen with marquee /
          bezel-strip / button-row siblings. */}
      <div className={cabinet.desktopBody}>
        <div className={cabinet.desktopMarquee} aria-hidden="true">
          {marqueeDecoration}
          <span className={cabinet.desktopMarqueeText}>{marqueeText}</span>
          {marqueeDecoration}
        </div>
        <div className={cabinet.desktopScreenArea}>
          <div className={cabinet.desktopSurround} aria-hidden="true">
            {screenSurround}
          </div>
          <div className={cabinet.screenBezel}>{children}</div>
        </div>
        {/* Bezel strip stays aria-hidden — the speaker grilles and the
            inert/decorative plate variant are decoration. The button
            variant (when isPlayMode) is rendered with its own
            aria-label below and is intentionally NOT marked
            aria-hidden, so an extra unhide override on the strip
            isn't needed; the button bubbles up regardless. */}
        <div className={cabinet.desktopBezelStrip} aria-hidden={isPlayMode ? undefined : 'true'}>
          <div className={cabinet.desktopGrille} />
          {isPlayMode ? (
            <button
              type="button"
              className={desktopPlateClass}
              aria-label={plateLabel}
              aria-pressed={isPaused}
              onClick={onPauseToggle}
            >
              DANGERVALENTINE
            </button>
          ) : (
            <div className={desktopPlateClass}>DANGERVALENTINE</div>
          )}
          <div className={cabinet.desktopGrille} />
        </div>
        <div className={cabinet.desktopButtonRow} aria-hidden="true">
          <ArcadePerspectiveButtonRow />
        </div>
      </div>

      {/* ============ MOBILE CHROME BELOW THE SCREEN (≤768px) ============
          The deck region itself stays aria-hidden when the plate is
          inert (it's just chrome); when the plate becomes a button,
          we drop aria-hidden on the deck so the button is reachable
          to assistive tech. */}
      <div className={cabinet.cabinetDeck} aria-hidden={isPlayMode ? undefined : 'true'}>
        {isPlayMode ? (
          <button
            type="button"
            className={plateClass}
            aria-label={plateLabel}
            aria-pressed={isPaused}
            onClick={onPauseToggle}
          >
            DANGERVALENTINE
          </button>
        ) : (
          <div className={plateClass}>DANGERVALENTINE</div>
        )}
      </div>
      <div className={cabinet.controlPanel}>
        <span className={cabinet.rivet} style={{ top: 8, left: 8 }} />
        <span className={cabinet.rivet} style={{ top: 8, right: 8 }} />
        <span className={cabinet.rivet} style={{ bottom: 8, left: 8 }} />
        <span className={cabinet.rivet} style={{ bottom: 8, right: 8 }} />
        {controlsSlot}
      </div>
      <div className={cabinet.cabinetBase} aria-hidden="true">
        {/* <div className={cabinet.coinSlot}>
          <span className={cabinet.rivet} style={{ top: 5, left: 5 }} />
          <span className={cabinet.rivet} style={{ top: 5, right: 5 }} />
          <span className={cabinet.rivet} style={{ bottom: 5, left: 5 }} />
          <span className={cabinet.rivet} style={{ bottom: 5, right: 5 }} />
          <div className={cabinet.coinSlotMouth} />
          <div className={cabinet.coinReturnSlot} />
        </div> */}
      </div>
    </div>
  );
}

export default ArcadeCabinet;
