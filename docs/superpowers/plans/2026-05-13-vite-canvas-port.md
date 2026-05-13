# Space Barrage Vite Canvas Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the CRA + DOM-based Space Barrage with the Canvas API version from NextQuest's arcade, wrapped in the full arcade cabinet chrome, as a standalone Vite SPA.

**Architecture:** Copy the game engine, renderer, and cabinet infrastructure from `C:\dev\NextQuest\web\app\` into this repo. Adapt imports from `@arcade` barrel to local relative paths via a Vite path alias. Strip Next.js dependencies (SSR, router, auth, server leaderboard). Wire up a minimal Vite + React 19 entry point.

**Tech Stack:** Vite, React 19, TypeScript, Canvas 2D API, CSS Modules

---

## File Map

### Created (new files in this repo)

| File | Responsibility |
|------|---------------|
| `vite.config.ts` | Vite config with React plugin + `@arcade` path alias |
| `tsconfig.json` | TypeScript config (strict, path alias) |
| `tsconfig.node.json` | Node-side TS config for vite.config |
| `index.html` | Vite SPA entry HTML |
| `src/main.tsx` | React DOM root mount |
| `src/App.tsx` | Top-level component — mounts SpaceBarrageGame |
| `src/tokens.css` | CSS custom properties (Night Owl theme tokens) |
| `src/arcade/index.ts` | Barrel export replacing `@arcade` |
| `src/arcade/leaderboardTypes.ts` | Stub `LeaderboardEntry` type (no server) |
| `src/arcade/ArcadeCabinet.tsx` | Copied, `'use client'` removed, brand text changed |
| `src/arcade/ArcadeCanvas.tsx` | Copied, `'use client'` removed |
| `src/arcade/JoystickCanvas.tsx` | Copied, `'use client'` removed |
| `src/arcade/ArcadePerspectiveButtonRow.tsx` | Copied verbatim |
| `src/arcade/PauseA11yMirror.tsx` | Copied, `'use client'` removed |
| `src/arcade/useArcadeSession.ts` | Copied, `'use client'` removed |
| `src/arcade/arcadeFrame.ts` | Copied verbatim |
| `src/arcade/renderer.ts` | Copied verbatim |
| `src/arcade/canvasUI.ts` | Copied verbatim |
| `src/arcade/hud.ts` | Copied verbatim |
| `src/arcade/colors.ts` | Copied verbatim |
| `src/arcade/nebula.ts` | Copied verbatim |
| `src/arcade/designSize.ts` | Copied verbatim |
| `src/arcade/joystickGates.ts` | Copied verbatim |
| `src/arcade/todaysBest.ts` | Copied verbatim |
| `src/arcade/createSetting.ts` | Copied verbatim |
| `src/arcade/cabinet.module.css` | Copied verbatim |
| `src/arcade/ArcadeCanvas.module.css` | Copied verbatim |
| `src/arcade/ArcadePerspectiveButtonRow.module.css` | Copied verbatim |
| `src/arcade/JoystickCanvas.module.css` | Copied verbatim |
| `src/arcade/visually-hidden.module.css` | Copied verbatim |
| `src/game/SpaceBarrageGame.tsx` | Copied + adapted (no server, no router, no auth, no debug) |
| `src/game/GameCanvas.tsx` | Copied, `'use client'` removed, import paths updated |
| `src/game/TouchControls.tsx` | Copied, `'use client'` removed, import paths updated |
| `src/game/LandingA11yMirror.tsx` | Copied + adapted (no server leaderboard type) |
| `src/game/GameoverA11yMirror.tsx` | Copied + adapted (no server leaderboard type) |
| `src/game/MarqueeArt.tsx` | Copied verbatim |
| `src/game/MarqueeArt.module.css` | Copied verbatim |
| `src/game/cabinetUI.ts` | Copied verbatim (imports from `@arcade` resolve via alias) |
| `src/game/shipVariant.ts` | Copied verbatim |
| `src/game/space-barrage.css` | Copied + adapted (no `--header-height` dependency) |
| `src/game/App.module.css` | Copied verbatim |
| `src/game/engine/GameEngine.ts` | Copied verbatim |
| `src/game/engine/Renderer.ts` | Copied + adapted (LeaderboardEntry import path) |
| `src/game/engine/types.ts` | Copied + adapted (GAME_WIDTH/HEIGHT from `@arcade`) |
| `src/game/engine/WaveManager.ts` | Copied verbatim |
| `src/game/engine/DifficultyScaler.ts` | Copied verbatim |
| `src/game/engine/tuning.ts` | Copied verbatim |
| `src/assets/enemy1.svg` | Copied |
| `src/assets/enemy2.svg` | Copied |
| `src/assets/enemy3.svg` | Copied |
| `src/assets/rocket.svg` | Copied |
| `src/assets/PressStart2P-Regular.ttf` | Already in repo |

### Deleted (old CRA files)

| File/Dir | Reason |
|----------|--------|
| `src/App.tsx` (old) | Replaced by new version |
| `src/App.module.css` (old) | Replaced |
| `src/App.test.js` | CRA test file |
| `src/index.tsx` (old) | Replaced by `main.tsx` |
| `src/index.css` (old) | Replaced by `tokens.css` |
| `src/declarations.d.ts` | CRA-specific |
| `src/Components/` | Entire old DOM-based component directory |
| `src/Context/` | Old React context (engine drives canvas now) |
| `src/engine/` | Old DOM-based engine |
| `src/constants/` | Old color constants |
| `src/utils/` | Old storage utility |
| `src/Assets/` | Replaced by `src/assets/` (font reused) |
| `webpack.config.js` | CRA config |
| `build/` | Old build output |

---

## Task 1: Scaffold Vite Project

**Files:**
- Create: `package.json` (overwrite), `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`
- Delete: `webpack.config.js`

- [ ] **Step 1: Stop the running dev server**

Kill the CRA dev server if still running.

- [ ] **Step 2: Delete old CRA config files**

```bash
rm -f webpack.config.js
```

- [ ] **Step 3: Overwrite package.json**

```json
{
  "name": "space-barrage",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://victoriousj.github.io/react-space-barrage",
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.4.1",
    "gh-pages": "^6.0.0",
    "typescript": "^5.8.0",
    "vite": "^6.3.0"
  }
}
```

- [ ] **Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/react-space-barrage/',
  resolve: {
    alias: {
      '@arcade': path.resolve(__dirname, 'src/arcade'),
      '@arcade/cabinet.module.css': path.resolve(__dirname, 'src/arcade/cabinet.module.css'),
      '@arcade/visually-hidden.module.css': path.resolve(__dirname, 'src/arcade/visually-hidden.module.css'),
    },
  },
});
```

- [ ] **Step 5: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@arcade": ["./src/arcade/index.ts"],
      "@arcade/*": ["./src/arcade/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 6: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 7: Create index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Space Barrage</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Delete node_modules and reinstall**

```bash
rm -rf node_modules package-lock.json
npm install
```

- [ ] **Step 9: Commit**

```bash
git add package.json vite.config.ts tsconfig.json tsconfig.node.json index.html
git rm -f webpack.config.js 2>/dev/null
git commit -m "Scaffold Vite + React 19 project, remove CRA config"
```

---

## Task 2: Create CSS Theme Tokens + Entry Point

**Files:**
- Create: `src/tokens.css`, `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: Create src/tokens.css**

Define all CSS custom properties the cabinet and game CSS reference. Values from NextQuest's Night Owl dark theme (`web/app/styles/tokens.css`).

```css
:root {
  --header-height: 0px;

  --color-primary-light: #AFC6FF;
  --color-primary-main: #82AAFF;
  --color-primary-dark: #4976A1;

  --color-accent-cyan: #7fdbca;
  --color-accent-coral: #FFAB70;
  --color-accent-green: #C3E88D;
  --color-accent-pink: #F07178;
  --color-accent-yellow: #FFCB6B;
  --color-accent-purple: #C792EA;

  --color-bg-floor: #010E18;
  --color-bg-base: #011627;
  --color-bg-surface: #0A1E30;
  --color-bg-elevated: #132A3E;
  --color-bg-medium: #1D3B53;

  --color-text-primary: #D6DEEB;
  --color-text-secondary: #9DB2C0;
  --color-text-muted: #7E8E94;
}

@font-face {
  font-family: 'PressStart2P-Regular';
  src: url('./assets/PressStart2P-Regular.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--color-bg-floor);
}
```

- [ ] **Step 2: Create src/main.tsx**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './tokens.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 3: Create src/App.tsx**

Placeholder — will import SpaceBarrageGame once it exists.

```tsx
export default function App() {
  return <div style={{ width: '100%', height: '100%' }}>Loading...</div>;
}
```

- [ ] **Step 4: Verify Vite starts**

```bash
npx vite --open
```

Should show "Loading..." on a dark background.

- [ ] **Step 5: Commit**

```bash
git add src/tokens.css src/main.tsx src/App.tsx
git commit -m "Add CSS theme tokens, font-face, and Vite entry point"
```

---

## Task 3: Copy Arcade Infrastructure (Pure Files)

These files are copied verbatim from `C:\dev\NextQuest\web\app\_arcade\` to `src/arcade/`. No code changes needed.

**Files:**
- Create: `src/arcade/arcadeFrame.ts`, `src/arcade/renderer.ts`, `src/arcade/canvasUI.ts`, `src/arcade/hud.ts`, `src/arcade/colors.ts`, `src/arcade/nebula.ts`, `src/arcade/designSize.ts`, `src/arcade/joystickGates.ts`, `src/arcade/todaysBest.ts`, `src/arcade/createSetting.ts`, `src/arcade/cabinet.module.css`, `src/arcade/ArcadeCanvas.module.css`, `src/arcade/ArcadePerspectiveButtonRow.module.css`, `src/arcade/JoystickCanvas.module.css`, `src/arcade/visually-hidden.module.css`

- [ ] **Step 1: Create src/arcade/ directory**

```bash
mkdir -p src/arcade
```

- [ ] **Step 2: Copy pure TypeScript files**

Copy these files verbatim (no modifications):
- `_arcade/arcadeFrame.ts` → `src/arcade/arcadeFrame.ts`
- `_arcade/renderer.ts` → `src/arcade/renderer.ts`
- `_arcade/canvasUI.ts` → `src/arcade/canvasUI.ts`
- `_arcade/hud.ts` → `src/arcade/hud.ts`
- `_arcade/colors.ts` → `src/arcade/colors.ts`
- `_arcade/nebula.ts` → `src/arcade/nebula.ts`
- `_arcade/designSize.ts` → `src/arcade/designSize.ts`
- `_arcade/joystickGates.ts` → `src/arcade/joystickGates.ts`
- `_arcade/todaysBest.ts` → `src/arcade/todaysBest.ts`
- `_arcade/createSetting.ts` → `src/arcade/createSetting.ts`

```bash
cp /c/dev/NextQuest/web/app/_arcade/arcadeFrame.ts src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/renderer.ts src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/canvasUI.ts src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/hud.ts src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/colors.ts src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/nebula.ts src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/designSize.ts src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/joystickGates.ts src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/todaysBest.ts src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/createSetting.ts src/arcade/
```

- [ ] **Step 3: Copy CSS module files**

```bash
cp /c/dev/NextQuest/web/app/_arcade/cabinet.module.css src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/ArcadeCanvas.module.css src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/ArcadePerspectiveButtonRow.module.css src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/JoystickCanvas.module.css src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/visually-hidden.module.css src/arcade/
```

- [ ] **Step 4: Commit**

```bash
git add src/arcade/
git commit -m "Copy arcade infrastructure (pure files, no modifications)"
```

---

## Task 4: Copy Arcade Infrastructure (Adapted Components)

These files need `'use client'` removed and brand text updated.

**Files:**
- Create: `src/arcade/ArcadeCabinet.tsx`, `src/arcade/ArcadeCanvas.tsx`, `src/arcade/JoystickCanvas.tsx`, `src/arcade/ArcadePerspectiveButtonRow.tsx`, `src/arcade/PauseA11yMirror.tsx`, `src/arcade/useArcadeSession.ts`, `src/arcade/leaderboardTypes.ts`

- [ ] **Step 1: Copy and adapt component files**

Copy these files from `C:\dev\NextQuest\web\app\_arcade\`:
- `ArcadeCabinet.tsx` — remove `'use client';` line, change "NEXTQUEST" brand plate text to "DANGERVALENTINE" (3 occurrences in JSX: line 176 desktop inert, line 173 desktop button, line 199 mobile button, line 201 mobile inert). Also remove the import of `ArcadePerspectiveButtonRow` and replace with local import (both are in `./`).
- `ArcadeCanvas.tsx` — remove `'use client';` line only. Internal imports already use `./arcadeFrame` and `./renderer` (relative).
- `JoystickCanvas.tsx` — remove `'use client';` line only. No external imports.
- `ArcadePerspectiveButtonRow.tsx` — no `'use client'` (it doesn't have one). Copy verbatim.
- `PauseA11yMirror.tsx` — remove `'use client';` line only.
- `useArcadeSession.ts` — remove `'use client';` line only. Internal imports already relative.

```bash
cp /c/dev/NextQuest/web/app/_arcade/ArcadeCabinet.tsx src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/ArcadeCanvas.tsx src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/JoystickCanvas.tsx src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/ArcadePerspectiveButtonRow.tsx src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/PauseA11yMirror.tsx src/arcade/
cp /c/dev/NextQuest/web/app/_arcade/useArcadeSession.ts src/arcade/
```

Then in each file that has `'use client';` as line 1, remove that line.

In `ArcadeCabinet.tsx`, change all 4 occurrences of `NEXTQUEST` (the JSX text content on lines 173, 176, 199, 201) to `DANGERVALENTINE`.

- [ ] **Step 2: Create src/arcade/leaderboardTypes.ts**

Stub the `LeaderboardEntry` type so the Renderer and A11y mirrors can import it without pulling in the server client.

```typescript
/** Stub leaderboard entry type — matches the shape from the NextQuest
 *  server client but without the server dependency. Used by the
 *  renderer's board-drawing pass and the A11y mirrors. */
export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarToken: string | null;
  score: number;
  achievedAt: string;
  rank: number;
}
```

- [ ] **Step 3: Create src/arcade/index.ts barrel export**

Replicate the `@arcade` barrel export surface with only the APIs space-barrage uses (drop server leaderboard, debug overlay, NebulaBackdrop component).

```typescript
// Components
export { ArcadeCabinet } from './ArcadeCabinet';
export type { ArcadeCabinetProps } from './ArcadeCabinet';
export { PauseA11yMirror } from './PauseA11yMirror';
export { ArcadeCanvas } from './ArcadeCanvas';
export type { ArcadeCanvasProps } from './ArcadeCanvas';
export { JoystickCanvas } from './JoystickCanvas';
export type { JoystickCanvasProps, JoystickState } from './JoystickCanvas';

// Hooks
export { useArcadeSession, useArcadeKeyboard } from './useArcadeSession';
export type {
  ArcadeSession,
  ArcadeKeyboardEngine,
  LandingView,
  UseArcadeSessionOptions,
  UseArcadeKeyboardOptions,
} from './useArcadeSession';
export { DEFAULT_PAUSE_ITEMS } from './useArcadeSession';

// Factories
export { createTodaysBest } from './todaysBest';
export type { TodaysBest, TodaysBestEntry } from './todaysBest';
export { createSetting } from './createSetting';
export type { Setting, SettingOptions } from './createSetting';

// Pure utilities
export { eightWayDirectionalGate } from './joystickGates';
export type { EightWayInput } from './joystickGates';
export { paintNebulaBackdrop } from './nebula';
export type { NebulaOptions } from './nebula';
export { drawHudScore, drawHudLives, getHudScale, getHudMetrics } from './hud';
export type { HudMetrics } from './hud';
export {
  drawText, measureText, drawKeycap, roundedRect,
  drawBannerRings, drawLeaderboardRow, drawPauseMenu,
} from './canvasUI';
export type {
  DrawTextOptions, DrawKeycapOptions, BannerRingSpec,
  LeaderboardRowOptions, DrawPauseMenuOptions, PauseMenuItemSpec,
} from './canvasUI';
export { colors } from './colors';
export type { ArcadeColors } from './colors';
export { ARCADE_DESIGN_WIDTH, ARCADE_DESIGN_HEIGHT } from './designSize';

// Types
export type { ArcadeRenderer } from './renderer';
export type {
  ArcadeMode, ArcadeFrame, ArcadeUI,
  LandingUI, PlayingUI, PauseUI, PauseMenuItem,
  GameoverUI, CabinetUIConfig,
} from './arcadeFrame';

// Leaderboard stub types
export type { LeaderboardEntry } from './leaderboardTypes';
```

- [ ] **Step 4: Commit**

```bash
git add src/arcade/
git commit -m "Copy arcade components with use-client removal and barrel export"
```

---

## Task 5: Copy Game Engine Files

**Files:**
- Create: `src/game/engine/GameEngine.ts`, `src/game/engine/Renderer.ts`, `src/game/engine/types.ts`, `src/game/engine/WaveManager.ts`, `src/game/engine/DifficultyScaler.ts`, `src/game/engine/tuning.ts`

- [ ] **Step 1: Create directory and copy engine files**

```bash
mkdir -p src/game/engine
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/engine/GameEngine.ts src/game/engine/
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/engine/Renderer.ts src/game/engine/
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/engine/types.ts src/game/engine/
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/engine/WaveManager.ts src/game/engine/
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/engine/DifficultyScaler.ts src/game/engine/
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/engine/tuning.ts src/game/engine/
```

- [ ] **Step 2: Fix types.ts — re-export uses `@arcade`**

In `src/game/engine/types.ts`, the file already re-exports `ARCADE_DESIGN_WIDTH/HEIGHT` from `@arcade` which resolves via the Vite alias. No change needed.

Verify: confirm the import line reads:
```typescript
export {
  ARCADE_DESIGN_WIDTH as GAME_WIDTH,
  ARCADE_DESIGN_HEIGHT as GAME_HEIGHT,
} from '@arcade';
```

- [ ] **Step 3: Fix Renderer.ts — LeaderboardEntry import**

In `src/game/engine/Renderer.ts`, change the relative import of `LeaderboardEntry`:

From:
```typescript
import type { LeaderboardEntry } from '../../../../_arcade/scoreboardClient';
```

To:
```typescript
import type { LeaderboardEntry } from '@arcade';
```

The Renderer also imports from `@arcade` barrel — verify it uses `@arcade` (it does, per the source read).

- [ ] **Step 4: Verify GameEngine.ts imports**

`GameEngine.ts` imports from `./types`, `./WaveManager`, `./DifficultyScaler`, `./tuning` (all local). No changes needed.

- [ ] **Step 5: Commit**

```bash
git add src/game/engine/
git commit -m "Copy game engine files, fix LeaderboardEntry import path"
```

---

## Task 6: Copy Game UI Files + Assets

**Files:**
- Create: `src/game/cabinetUI.ts`, `src/game/shipVariant.ts`, `src/game/MarqueeArt.tsx`, `src/game/MarqueeArt.module.css`, `src/game/GameCanvas.tsx`, `src/game/TouchControls.tsx`, `src/game/LandingA11yMirror.tsx`, `src/game/GameoverA11yMirror.tsx`, `src/game/space-barrage.css`, `src/game/App.module.css`
- Create: `src/assets/enemy1.svg`, `src/assets/enemy2.svg`, `src/assets/enemy3.svg`, `src/assets/rocket.svg`

- [ ] **Step 1: Copy SVG assets and font**

```bash
mkdir -p src/assets
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/enemy1.svg src/assets/
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/enemy2.svg src/assets/
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/enemy3.svg src/assets/
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/rocket.svg src/assets/
```

The font `PressStart2P-Regular.ttf` already exists at `src/Assets/PressStart2P-Regular.ttf`. Copy it to the new location:

```bash
cp src/Assets/PressStart2P-Regular.ttf src/assets/
```

- [ ] **Step 2: Copy verbatim game UI files**

```bash
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/cabinetUI.ts src/game/
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/MarqueeArt.tsx src/game/
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/MarqueeArt.module.css src/game/
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/App.module.css src/game/
```

- [ ] **Step 3: Copy and adapt shipVariant.ts**

```bash
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/utils/shipVariant.ts src/game/
```

No changes needed — it imports `createSetting` from `@arcade` which resolves via alias.

- [ ] **Step 4: Copy and adapt space-barrage.css**

```bash
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/space-barrage.css src/game/
```

Edit `src/game/space-barrage.css`: change the height calculation to remove `--header-height` dependency since there's no app header:

From:
```css
height: calc(100dvh - var(--header-height, 64px));
```

To:
```css
height: 100dvh;
```

- [ ] **Step 5: Copy and adapt GameCanvas.tsx**

```bash
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/Components/GameCanvas.tsx src/game/
```

In `src/game/GameCanvas.tsx`:
1. Remove `'use client';` line
2. Change `import { ArcadeCanvas, type ArcadeFrame } from '@arcade';` — this is fine, resolves via alias
3. Change `import { GameEngine } from '../engine/GameEngine';` → `import { GameEngine } from './engine/GameEngine';`
4. Change `import { Renderer } from '../engine/Renderer';` → `import { Renderer } from './engine/Renderer';`
5. Change `import type { GameState } from '../engine/types';` → `import type { GameState } from './engine/types';`

- [ ] **Step 6: Copy and adapt TouchControls.tsx**

```bash
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/Components/TouchControls.tsx src/game/
```

In `src/game/TouchControls.tsx`:
1. Remove `'use client';` line
2. `import { JoystickCanvas, type JoystickState } from '@arcade';` — fine
3. `import cabinet from '@arcade/cabinet.module.css';` — fine (alias covers this)
4. Change `import { GameEngine } from '../engine/GameEngine';` → `import { GameEngine } from './engine/GameEngine';`
5. Change `import styles from '../App.module.css';` → `import styles from './App.module.css';`

- [ ] **Step 7: Copy and adapt LandingA11yMirror.tsx**

```bash
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/Components/LandingA11yMirror.tsx src/game/
```

In `src/game/LandingA11yMirror.tsx`:
1. Remove `'use client';` line
2. Change `import type { LeaderboardEntry } from '../../../../_arcade/scoreboardClient';` → `import type { LeaderboardEntry } from '@arcade';`
3. `import type { LandingView } from '@arcade';` — fine
4. `import styles from '@arcade/visually-hidden.module.css';` — fine
5. Remove the `<a href="/arcade/space-barrage/leaderboard">` link from the JSX (no leaderboard page in standalone) — remove the entire `<p>` containing it.

- [ ] **Step 8: Copy and adapt GameoverA11yMirror.tsx**

```bash
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/Components/GameoverA11yMirror.tsx src/game/
```

In `src/game/GameoverA11yMirror.tsx`:
1. Remove `'use client';` line
2. Change `import type { GameoverUI } from '@arcade';` — fine
3. Change `import type { LeaderboardEntry } from '../../../../_arcade/scoreboardClient';` → `import type { LeaderboardEntry } from '@arcade';`
4. `import styles from '@arcade/visually-hidden.module.css';` — fine

- [ ] **Step 9: Fix cabinetUI.ts import path**

In `src/game/cabinetUI.ts`: the import reads `import { colors, type CabinetUIConfig } from '@arcade';` — fine. The shipVariant import reads `from './utils/shipVariant'` — change to `from './shipVariant'` since we flattened the directory structure.

- [ ] **Step 10: Commit**

```bash
git add src/game/ src/assets/
git commit -m "Copy game UI components, assets, and CSS with import adaptations"
```

---

## Task 7: Adapt SpaceBarrageGame.tsx (Main Game Component)

This is the largest adaptation — removing server leaderboard, Next.js router, auth store, and debug overlay.

**Files:**
- Create: `src/game/SpaceBarrageGame.tsx`

- [ ] **Step 1: Copy the source file**

```bash
cp /c/dev/NextQuest/web/app/arcade/space-barrage/_game/SpaceBarrageGame.tsx src/game/
```

- [ ] **Step 2: Remove `'use client';`**

Delete line 1.

- [ ] **Step 3: Remove Next.js imports**

Delete:
```typescript
import { useRouter } from 'next/navigation';
```

- [ ] **Step 4: Remove server leaderboard + auth imports**

Delete these imports:
```typescript
import {
  fetchLeaderboard,
  submitScore,
  type LeaderboardEntry,
} from '../../../_arcade/scoreboardClient';
import { padWithMocks } from '../../../_arcade/mockBoard';
import { useAuthStore } from '@/app/lib/auth/store';
```

- [ ] **Step 5: Remove debug imports and usage**

Delete from the `@arcade` import:
```typescript
ArcadeDebugOverlay,
useArcadeDebug,
type DebugFrame,
```

Delete `const debug = useArcadeDebug();` and `const debugFrameRef = useRef<DebugFrame | null>(null);` and `const debugLastEmitAtRef = useRef<number>(0);`.

Delete the debug block inside the engine onUpdate callback (the `if (debug) { ... }` block).

Delete from the render JSX:
```tsx
{debug && mode === 'playing' && (
  <ArcadeDebugOverlay frameRef={debugFrameRef} />
)}
```

- [ ] **Step 6: Remove router usage**

Delete `const router = useRouter();`.

In `onLandingUp`, remove the `router.push('/arcade/space-barrage/leaderboard')` branch. The function should just cycle the variant regardless of view:

```typescript
const onLandingUp = useCallback(() => {
  cycleVariant();
}, [cycleVariant]);
```

- [ ] **Step 7: Remove server leaderboard state and effects**

Delete the `leaderboardRef`, `boardEntriesState`, and `setBoardEntriesState` state/refs.

Delete the `handleRendererReady` callback that bridges `leaderboardRef` into the renderer. Replace with a simple ref setter:

```typescript
const handleRendererReady = useCallback((r: Renderer) => {
  rendererRef.current = r;
}, []);
```

Delete the "Initial leaderboard fetch on mount" `useEffect` (the one that calls `fetchLeaderboard`).

Delete the "Refetch whenever entering scores view" `useEffect`.

- [ ] **Step 8: Simplify gameover score submission to localStorage-only**

Replace the "Gameover: submit score or record today's-best" `useEffect` with:

```typescript
useEffect(() => {
  if (mode !== 'gameover' || finalScore === null) return;
  todaysBest.set(finalScore);
  const tb = todaysBest.get();
  setTodaysBestState(tb?.score ?? null);
  setSubmitStatus('idle');
}, [mode, finalScore, setTodaysBestState, setSubmitStatus]);
```

- [ ] **Step 9: Update A11y mirror props**

In the landing A11y mirror, change `boardEntries={boardEntriesState}` to `boardEntries={null}`.

In the gameover A11y mirror, change `boardEntries={boardEntriesState}` to `boardEntries={null}`.

- [ ] **Step 10: Fix remaining import paths**

Update all relative imports that assumed the NextQuest directory structure:
- `import GameCanvas from './Components/GameCanvas';` → `import GameCanvas from './GameCanvas';`
- `import { TouchControls } from './Components/TouchControls';` → `import { TouchControls } from './TouchControls';`
- `import { LandingA11yMirror } from './Components/LandingA11yMirror';` → `import { LandingA11yMirror } from './LandingA11yMirror';`
- `import { GameoverA11yMirror } from './Components/GameoverA11yMirror';` → `import { GameoverA11yMirror } from './GameoverA11yMirror';`
- `import { SpaceBarrageMarqueeArt } from './MarqueeArt';` — already correct
- `import { GameEngine } from './engine/GameEngine';` — already correct
- `import { Renderer } from './engine/Renderer';` — already correct
- `import { getShipVariant, setShipVariant, SHIP_VARIANTS } from './utils/shipVariant';` → `import { getShipVariant, setShipVariant, SHIP_VARIANTS } from './shipVariant';`
- `import type { GameState } from './engine/types';` — already correct
- `import styles from './App.module.css';` — already correct
- `import './space-barrage.css';` — already correct

The `@arcade` imports (ArcadeCabinet, PauseA11yMirror, useArcadeKeyboard, useArcadeSession, type ArcadeFrame) resolve via the Vite alias.

Remove the `createTodaysBest` import from `'../../../_arcade/todaysBest'` and import from `@arcade` instead:
```typescript
import { createTodaysBest } from '@arcade';
```

- [ ] **Step 11: Remove the `debug` parameter from the engine creation effect**

In the `useEffect` dependency array for engine creation, remove `debug`. Also remove the debug-related code inside the `onUpdate` callback of `new GameEngine(...)`.

- [ ] **Step 12: Commit**

```bash
git add src/game/SpaceBarrageGame.tsx
git commit -m "Adapt SpaceBarrageGame: strip server leaderboard, auth, router, debug"
```

---

## Task 8: Wire Up App.tsx + Delete Old Source

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/App.module.css` (old), `src/App.test.js`, `src/index.tsx`, `src/index.css`, `src/declarations.d.ts`, `src/Components/`, `src/Context/`, `src/engine/`, `src/constants/`, `src/utils/`, `src/Assets/`

- [ ] **Step 1: Update src/App.tsx**

```tsx
import SpaceBarrageGame from './game/SpaceBarrageGame';
import './game/space-barrage.css';

export default function App() {
  return (
    <div className="space-barrage-page">
      <SpaceBarrageGame />
    </div>
  );
}
```

- [ ] **Step 2: Delete old CRA source files**

```bash
rm -f src/App.test.js src/index.tsx src/index.css src/declarations.d.ts
rm -f src/App.module.css
rm -rf src/Components src/Context src/engine src/constants src/utils src/Assets
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Wire App.tsx to SpaceBarrageGame, delete old CRA source"
```

---

## Task 9: Build Verification + Fix Compilation Errors

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Fix any import path errors, missing types, or type mismatches. Common issues to expect:
- Import paths that still reference NextQuest's directory structure
- Missing `@arcade` exports (add to barrel if needed)
- `'use client'` remnants causing syntax errors (remove them)

- [ ] **Step 2: Run Vite dev server**

```bash
npx vite
```

Verify:
- Page loads with the arcade cabinet
- Landing screen renders (nebula backdrop, title text, ship preview)
- SPACE starts the game
- Ship moves with WASD/arrows
- SPACE fires bullets
- Enemies spawn and descend
- Collision detection works
- Game over screen shows on death
- Pause menu works (ESC)
- Mobile layout shows (resize to ≤768px)
- Touch controls render on mobile

- [ ] **Step 3: Run production build**

```bash
npx vite build
```

Verify no build errors.

- [ ] **Step 4: Test production preview**

```bash
npx vite preview
```

Verify the built app works identically to dev.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "Fix compilation and build issues from port"
```

---

## Task 10: Final Cleanup

- [ ] **Step 1: Update README.md**

Update the README to reflect the new tech stack (Vite, Canvas API, arcade cabinet) and controls.

- [ ] **Step 2: Remove build/ directory from git**

```bash
rm -rf build/
echo "dist/" >> .gitignore
echo "node_modules/" >> .gitignore
git add .gitignore
```

- [ ] **Step 3: Clean up todo.md if stale**

Check `todo.md` — if it references old CRA tasks, delete it.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "Clean up README, gitignore, and stale files"
```
