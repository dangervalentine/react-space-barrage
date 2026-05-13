<p align="center">
  <img src="./public/favicon.svg" width="80" alt="Space Barrage" />
</p>

<h1 align="center">Space Barrage</h1>

<p align="center">
  <strong>A pixel-art space shooter rendered entirely on HTML5 canvas, with escalating wave difficulty and an arcade-cabinet chrome.</strong>
</p>

<p align="center">
  <a href="https://dangervalentine.github.io/react-space-barrage/">Live Demo</a>
</p>

<p align="center">
  <a href="https://dangervalentine.github.io/react-space-barrage/">
    <img src="./space-barrage.png" width="640" alt="Space Barrage screenshot" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/vite-6-646CFF?logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/typescript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/render-Canvas_2D-C792EA" alt="Canvas 2D" />
  <img src="https://img.shields.io/github/deployments/dangervalentine/react-space-barrage/github-pages?label=deploy&color=C3E88D" alt="Deploy" />
</p>

---

Pilot a starship through an endless gauntlet of enemies. Waves spawn faster and denser as your score climbs, squid stalkers lock on and dive-bomb, and shield pickups keep you alive just long enough to push one tier further. Everything on screen is canvas-painted pixel art running inside a retro arcade cabinet frame.

## Features

**Two ship variants** &mdash; Choose between the classic interceptor (broad wings, pink cockpit) and the rocket (streamlined body, yellow viewport) on the title screen.

**Escalating difficulty** &mdash; A six-tier cycle repeats every 600 points. Each cycle adds more simultaneous enemies and cuts traversal time, with a hard floor so things stay playable. Wave spawn delay tightens per tier within each cycle.

**Squid stalkers** &mdash; After 20 points, squid enemies begin spawning. They drift laterally at hunt altitude, lock on when aligned with your ship, then dive at 1.5x grunt speed. Up to two active at once, with spawn chance ramping to 30% by score 200.

**Shield pickups** &mdash; Shield bombs start appearing after 50 points, falling through the play field. Fly into one to absorb the next hit. Particle burst on pickup.

**Particle explosions** &mdash; Ship death triggers a 60-particle blast with a lingering slow-core debris ring. Enemy kills pop a smaller 22-particle burst. Palette drawn from Night Owl accent tokens.

**Arcade cabinet chrome** &mdash; CRT-style quantization, scrolling nebula backdrop, perspective button row, virtual joystick on mobile, and a marquee header.

**Keyboard + touch** &mdash; Arrow keys or WASD to move, Space to fire. On mobile, a virtual joystick handles movement and the fire button sits on the right. Touch controls auto-hide on desktop.

**Accessibility** &mdash; Visually-hidden buttons mirror all canvas-painted interactive elements for screen readers. Pause and game-over states have full a11y mirrors.

Ship sprites are defined as 11x11 character grids where each character maps to a hex color from the Night Owl palette. The renderer walks the grid and `fillRect`s each pixel at the appropriate cell size.

## Quick Start

```bash
npm install
npm run dev        # dev server at http://localhost:5173/react-space-barrage/
npm run build      # type-check + production bundle in ./dist
npm run preview    # serve the production bundle locally
```

## Tech Stack

- **React 19** &mdash; mounts the canvas, owns session state and UI overlays
- **Vite 6** &mdash; dev server, build, GitHub Pages base path
- **TypeScript 5** &mdash; strict mode, path aliases
- **Canvas 2D** &mdash; all gameplay rendering is canvas-painted pixel art
- **Night Owl** &mdash; dark theme color tokens shared between CSS and canvas

## License

[MIT](./LICENSE.md)
