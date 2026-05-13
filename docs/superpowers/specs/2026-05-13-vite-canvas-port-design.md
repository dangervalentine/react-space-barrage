# Space Barrage: Vite Canvas Port Design

## Overview

Port the Canvas API version of Space Barrage from `C:\dev\NextQuest\web\app\arcade\space-barrage` back into this repository (the original basis for the game), replacing the current CRA + DOM-based implementation with a standalone Vite SPA wrapped in the arcade cabinet chrome.

## Source Material

- **Current repo**: CRA, DOM-based rendering (positioned divs + CSS modules), no shooting mechanic, pattern-based enemy spawning
- **NextQuest source**: Canvas 2D pixel-art renderer, full shooting with bullets, squid AI enemies, wave/difficulty systems, arcade cabinet framing, analog joystick, attract mode

## What Gets Ported

### Game Engine (from `space-barrage/_game/engine/`)
- `GameEngine.ts` — full game loop, ship physics, enemy AI (grunts + squids), bullets, shields, particles, collision
- `Renderer.ts` — Canvas 2D pixel-art renderer (1x DPI, CRT quantization, nebula backdrop, parallax stars, sprite grids)
- `WaveManager.ts` — enemy spawn wave cadence
- `DifficultyScaler.ts` — score-based difficulty progression (6-tier cycle)
- `tuning.ts` — game balance constants
- `types.ts` — GameState, entity types

### Cabinet Infrastructure (from `_arcade/`)
- `ArcadeCabinet.tsx` + `cabinet.module.css` — wood shell, marquee, bezel, responsive desktop/mobile layouts
- `ArcadeCanvas.tsx` — shared canvas wrapper with ResizeObserver, last-frame replay on resize
- `arcadeFrame.ts` — frame envelope types (landing/playing/paused/gameover modes)
- `renderer.ts` — per-game renderer interface
- `useArcadeSession.ts` — session state machine (mode transitions, lockout delays, pause menu)
- `useArcadeKeyboard.ts` — keyboard routing
- `JoystickCanvas.tsx` + `joystickGates.ts` — mobile analog stick
- `canvasUI.ts` — shared canvas drawing primitives (text, keycaps, HUD, pause menu, leaderboard rows)
- `colors.ts` — unified color palette
- `nebula.ts` — aurora backdrop shader
- `designSize.ts` — fixed design-coordinate system (1080x810)
- `todaysBest.ts` — localStorage high score tracking

### Game-Specific UI (from `space-barrage/_game/`)
- `SpaceBarrageGame.tsx` — main game component (adapted for standalone use)
- `cabinetUI.ts` — landing screen layout, ship variant picker, keycap hints
- `MarqueeArt.tsx` — marquee decoration
- `GameCanvas.tsx` — ArcadeCanvas wrapper
- `TouchControls.tsx` — joystick + fire button
- `LandingA11yMirror.tsx` / `GameoverA11yMirror.tsx` — accessibility mirrors
- `shipVariant.ts` — ship preview variants
- SVG assets (enemy1/2/3, rocket)
- `space-barrage.css`, `App.module.css`

## What Gets Dropped

- Server leaderboard (`scoreboardClient.ts`, `fetchLeaderboard`, `submitScore`)
- NextQuest auth integration (`@/app/lib/auth/store`)
- Next.js specifics (metadata, dynamic imports, SSR guards, App Router)
- Other games (asteroids, night-prowl)
- Attract mode landing page (`_landing/`)
- OG image generation
- Debug overlay (`useArcadeDebug.ts`, `ArcadeDebugOverlay.tsx`)

## What Gets Adapted

- `SpaceBarrageGame.tsx` — remove Next.js router refs, remove server leaderboard calls, pass empty leaderboard array
- `useArcadeSession.ts` — remove any Next.js router references
- Cabinet gameover screen — show personal high score (localStorage) instead of server board
- Any `@/app/` import paths rewritten to local relative paths

## Project Structure

```
src/
  main.tsx                      # Vite entry point
  App.tsx                       # Mounts cabinet + game
  arcade/                       # Extracted cabinet infrastructure
    ArcadeCabinet.tsx
    ArcadeCanvas.tsx
    JoystickCanvas.tsx
    arcadeFrame.ts
    renderer.ts
    useArcadeSession.ts
    useArcadeKeyboard.ts
    canvasUI.ts
    colors.ts
    nebula.ts
    designSize.ts
    joystickGates.ts
    todaysBest.ts
    *.module.css
  game/                         # Space Barrage game
    SpaceBarrageGame.tsx
    cabinetUI.ts
    MarqueeArt.tsx
    GameCanvas.tsx
    TouchControls.tsx
    LandingA11yMirror.tsx
    GameoverA11yMirror.tsx
    shipVariant.ts
    space-barrage.css
    App.module.css
    engine/
      GameEngine.ts
      Renderer.ts
      types.ts
      WaveManager.ts
      DifficultyScaler.ts
      tuning.ts
  assets/
    enemy1.svg
    enemy2.svg
    enemy3.svg
    rocket.svg
    PressStart2P-Regular.ttf
index.html
vite.config.ts
package.json
tsconfig.json
```

## Build Setup

- **Bundler**: Vite with `@vitejs/plugin-react`
- **Framework**: React 19 + React DOM 19
- **Language**: TypeScript (strict mode)
- **Styling**: CSS Modules (Vite built-in support)
- **Deploy**: GitHub Pages via `gh-pages` package (preserving existing homepage URL)

## Scoring

- localStorage-only personal high score via `todaysBest.ts`
- No server leaderboard integration
- Gameover screen shows personal best instead of server board
