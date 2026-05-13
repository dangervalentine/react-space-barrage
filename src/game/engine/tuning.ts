// Per-game tuning constants for the space-barrage engine. Same shape as
// asteroids' tuning.ts (see ARCADE.md §4 for the engine-level dt
// convention).
//
// What's NOT here: structural geometry (ENEMY_WIDTH/HEIGHT,
// SHIP_WIDTH/HEIGHT, sprite ROWS in Renderer.ts), score-based
// difficulty curves (DifficultyScaler.ts), and wave cadence mechanics
// (WaveManager.ts). Those each live with the logic that owns them. The
// world-bound constants (ENEMY_START_Y, ENEMY_END_Y) live in types.ts
// because they're shared across the engine + the input grid.
//
// Conventions:
// - Time-like values in milliseconds (`*_MS`).
// - Velocity-like values in units per second (`*_PER_SEC`).
// - Per-millisecond rates explicitly named (`*_PER_MS`) — kept as-is
//   because the squid AI was originally tuned in ms terms, not converted
//   from a per-frame anchor.
// - Half-life decay bases stay in per-second form (raise to (dtMs/1000)).
// - Probabilities as 0..1 floats.

import { colors } from '@arcade';

// ===== Engine loop =====

/** Cap for elapsed time per RAF callback (~3 ideal 60Hz frames at 50ms).
 *  Same purpose as asteroids' MAX_FRAME_DT_MS — absorbs tab-
 *  backgrounding hiccups without warping the simulation. */
export const MAX_FRAME_DT_MS = 16.67 * 3;

// ===== Game flow =====

/** Player ship spawn position in design coordinates. */
export const INITIAL_SHIP_X = 490;
export const INITIAL_SHIP_Y = 700;

/** Starting lives at game start. */
export const STARTING_LIVES = 3;

/** Hold time after the last life is lost before flipping `isShipHit`
 *  and surfacing the game-over screen. Same intent as asteroids'
 *  GAME_OVER_DELAY_MS — gives the player a beat to register the loss
 *  before the game-over UI swaps in. */
export const DEATH_ANIM_MS = 1400;

/** Window after a non-fatal hit during which: (a) movement is locked to
 *  the spawn position and (b) input is effectively ignored. */
export const RESPAWN_DURATION_MS = 800;

/** Post-hit invulnerability window. While active, enemies pass through
 *  the ship without damage, allowing the player to recover. Longer than
 *  RESPAWN_DURATION_MS so the player has a brief grace period after
 *  visible movement resumes. Also seeded into `lastHitTime` at game
 *  start (timestamp - SHIP_INVULN_DURATION_MS) so the first frame doesn't
 *  treat the player as freshly hit. */
export const SHIP_INVULN_DURATION_MS = 3000;

/** Initial delay before the first wave spawns at game start. */
export const WAVE_INITIAL_DELAY_MS = 1000;

// ===== Ship physics =====

/** Per-second velocity cap for keyboard-driven movement, and the clamp
 *  applied to analog joystick input via `setAnalogVelocity`. */
export const SHIP_MAX_VELOCITY_PER_SEC = 500;

/** Per-second² acceleration when a keyboard movement key is held. At
 *  full hold, ship reaches SHIP_MAX_VELOCITY_PER_SEC in ~0.33 sec. */
export const SHIP_ACCELERATION_PER_SEC = 1500;

/** Friction half-life base. When no input is held, velocity is
 *  multiplied by `SHIP_FRICTION_BASE_PER_SEC ** (dtMs/1000)` each tick.
 *  With base = 0.5, velocity halves every second of coasting — full
 *  stop within ~5 sec (down to <1% of cap). */
export const SHIP_FRICTION_BASE_PER_SEC = 0.5;

/** Below this absolute velocity, snap the component to zero so the ship
 *  doesn't drift microscopically forever after release. */
export const SHIP_VELOCITY_DEAD_ZONE_PER_SEC = 10;

/** Minimum gap between successive shots, in ms. */
export const SHIP_FIRE_RATE_MS = 200;

// ===== Bullet =====

/** Bullet flight speed in units per second. */
export const BULLET_SPEED_PER_SEC = 600;

/** Maximum visual lean of the ship at max horizontal velocity, in
 *  degrees. Bullet inherits a slightly amplified version (see
 *  BULLET_TILT_AMPLIFIER). */
export const SHIP_BULLET_TILT_DEG_MAX = 30;

/** Multiplier applied to the ship's lean to get the bullet's launch
 *  angle. Slightly amplified so bullets visibly fan in the direction of
 *  motion. */
export const BULLET_TILT_AMPLIFIER = 1.2;

/** Buffer outside the visible game area where bullets are still
 *  considered alive. Past this, they're filtered out. */
export const BULLET_OOB_BUFFER = 50;

// ===== Enemy spawning =====

/** Number of vertical columns enemies spawn from. Forms a 10-wide grid
 *  shared with GRID_CONFIG in types.ts. */
export const ENEMY_COLUMNS = 10;

/** How long a removed enemy stays visible (for its death fade) before
 *  being pruned from state. */
export const ENEMY_FADE_AFTER_REMOVAL_MS = 200;

// ===== Squid stalker (imageIndex === 1) =====

/** Maximum simultaneous squid stalkers. */
export const SQUID_CAP = 2;

/** Score below which no squids spawn — player has time to warm up. */
export const SQUID_INTRO_SCORE = 20;

/** Score at which squid spawn chance plateaus at SQUID_MAX_CHANCE. */
export const SQUID_RAMP_END_SCORE = 200;

/** Maximum probability of a squid spawn (when the score ramp is full). */
export const SQUID_MAX_CHANCE = 0.3;

/** Squid lateral hunt speed in pixels per millisecond (~450 px/sec).
 *  Kept in per-ms units because the squid AI was originally tuned in
 *  this form, not converted from a per-frame anchor. */
export const SQUID_HUNT_PX_PER_MS = 0.45;

/** Squid hunt-Y range. On spawn the squid picks a random Y in
 *  [MIN, MIN + RANGE) and drifts horizontally at that height. */
export const SQUID_HUNT_Y_MIN = 120;
export const SQUID_HUNT_Y_RANGE = 100;

/** Default hunt-Y if the field is missing on the enemy state. */
export const SQUID_DEFAULT_HUNT_Y = 180;

/** Lateral distance below which the squid is considered aligned with
 *  the ship and triggers the lock-on telegraph. */
export const SQUID_ALIGN_THRESHOLD = 14;

/** Telegraph window between lock-on and dive commit, in ms. */
export const SQUID_LOCK_ON_DELAY_MS = 180;

/** Squid dive speed multiplier relative to the grunt traversal speed
 *  for the current difficulty tier. */
export const SQUID_DIVE_SPEED_MULTIPLIER = 1.5;

/** Default dive speed if not stamped on the enemy state, in px/ms. */
export const SQUID_DEFAULT_DIVE_PX_PER_MS = 0.3;

/** Y-coordinate at which a diving squid counts as having reached the
 *  bottom of the play field (for scoring/cleanup). */
export const SQUID_BOTTOM_Y = 825;

/** X-offset where squids spawn off-screen (they fly in horizontally). */
export const SQUID_SPAWN_OFFSCREEN_X = 60;

// ===== Shield bombs =====

/** Per-tick probability of spawning a shield bomb. Combined with the
 *  score gate below, shields appear roughly every few seconds at higher
 *  scores. */
export const SHIELD_SPAWN_CHANCE = 0.002;

/** Score below which shield bombs do not spawn. */
export const SHIELD_SPAWN_MIN_SCORE = 50;

/** Time for a shield bomb to fall from ENEMY_START_Y to ENEMY_END_Y. */
export const SHIELD_DURATION_MS = 8000;

/** Pickup distance for shields, in design units. */
export const SHIELD_PICKUP_RADIUS = 80;

/** Shield X spawns on a discretized column grid. 11 columns × 100 px =
 *  1100 px wide range, slightly wider than play area so shields can
 *  spawn just outside view edges. */
export const SHIELD_X_COLUMN_COUNT = 11;
export const SHIELD_X_COLUMN_WIDTH = 100;

// ===== Collisions =====

/** Padding shrunk inward from each entity's bounding box for collision
 *  tests. Smaller than the visual sprite so glancing hits feel fair. */
export const COLLISION_PADDING = 20;

// ===== Scoring =====

/** Score gained when an enemy reaches the bottom — wasted potential, an
 *  enemy slipping past costs the player. */
export const ENEMY_PASS_THROUGH_SCORE = 1;

/** Score gained when a bullet kills an enemy. */
export const BULLET_KILL_SCORE = 2;

// ===== Explosion =====

/** Color palette for explosion particles. Drawn from the shared arcade
 *  Night Owl tokens (`_arcade/colors.ts`). */
export const EXPLOSION_PALETTE = [
  colors.accent.yellow,
  colors.accent.coral,
  colors.accent.pink,
  colors.text.primary,
  colors.accent.cyan,
];

/** Particle counts per explosion variant. Big = ship death; small =
 *  enemy destruction. */
export const EXPLOSION_BIG_COUNT = 60;
export const EXPLOSION_SMALL_COUNT = 22;

/** Base per-particle speed in the explosion ring, in units/sec. */
export const EXPLOSION_BIG_BASE_SPEED_PER_SEC = 360;
export const EXPLOSION_SMALL_BASE_SPEED_PER_SEC = 240;

/** Random speed jitter on top of base, in units/sec. */
export const EXPLOSION_BIG_SPEED_JITTER_PER_SEC = 240;
export const EXPLOSION_SMALL_SPEED_JITTER_PER_SEC = 140;

/** Base particle lifetime, in ms. */
export const EXPLOSION_BIG_LIFETIME_MS = 900;
export const EXPLOSION_SMALL_LIFETIME_MS = 500;

/** Random lifetime jitter on top of base, in ms. */
export const EXPLOSION_BIG_LIFETIME_JITTER_MS = 600;
export const EXPLOSION_SMALL_LIFETIME_JITTER_MS = 350;

/** Slow-core particles (player-death only). Smaller count, slower drift,
 *  long life — gives the death blast a lingering debris feel rather
 *  than just a clean ring. */
export const EXPLOSION_SLOW_CORE_COUNT = 16;
export const EXPLOSION_SLOW_CORE_BASE_SPEED_PER_SEC = 40;
export const EXPLOSION_SLOW_CORE_SPEED_JITTER_PER_SEC = 120;
export const EXPLOSION_SLOW_CORE_LIFETIME_MS = 900;
export const EXPLOSION_SLOW_CORE_LIFETIME_JITTER_MS = 500;

// ===== Particle burst (shield pickup + enemy kill) =====

/** Particle count in a small radial burst. Angles are evenly spaced
 *  (deterministic fan, not random spread). */
export const PARTICLE_BURST_COUNT = 8;

/** Particle burst speed in units/sec. */
export const PARTICLE_BURST_SPEED_PER_SEC = 300;

/** Particle burst lifetime in ms. */
export const PARTICLE_BURST_LIFETIME_MS = 600;
