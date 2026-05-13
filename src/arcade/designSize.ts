// Shared virtual canvas size for arcade games. Engines run in this fixed
// coordinate space; renderers scale the world to the actual canvas each frame
// so entities stay the same relative size at any viewport (a phone-sized
// cabinet shrinks the ship, asteroids, and UFOs proportionally instead of
// leaving them at fixed px and dwarfing the play field).
//
// HUD elements (score, lives, etc.) should still be drawn in canvas-px space
// after the world transform is restored, so they can grow on small screens
// and stay legible even though the entities are shrinking.
//
// 1080×810 locks the design to a true 4:3 aspect — the standard arcade
// cabinet ratio — and matches the cabinet bezel's `aspect-ratio: 4 / 3`,
// so on a maxed-out desktop cabinet the canvas IS the design size and
// there's no scaling at all. Trivially close to the previous 1080×800
// (1.35:1 vs 1.333:1), so existing entity positions/sizes are unchanged.

export const ARCADE_DESIGN_WIDTH = 1080;
export const ARCADE_DESIGN_HEIGHT = 810;
