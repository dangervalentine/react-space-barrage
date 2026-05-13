// Shared aurora + starfield painter used by Asteroids (in-game canvas
// background) and its landing screen. Centralised so both surfaces always
// look like the same world.

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface NebulaOptions {
  /** Multiplier for the default aurora-blob alphas. 1 = full strength.
   *  In-game we keep this lower so the aurora doesn't fight asteroid clarity. */
  auroraOpacity?: number;
  /** Base fill behind the nebula. Defaults to a slightly bluer black than
   *  the canvas background token so the colored blobs have somewhere to fade. */
  baseColor?: string;
  /** Pixels² per star. Lower = denser. */
  starDensity?: number;
  /** Seed for the deterministic star placement. */
  starSeed?: number;
}

/** Paint one full backdrop pass into an existing 2D context. Caller is
 *  responsible for any transform / clipping; this function expects to draw
 *  into a (0,0)-(width,height) box in the local coord system. */
export function paintNebulaBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: NebulaOptions = {}
): void {
  const auroraOpacity = opts.auroraOpacity ?? 1;
  const baseColor = opts.baseColor ?? '#06121f';
  const starDensity = opts.starDensity ?? 1500;
  const starSeed = opts.starSeed ?? 0x1ce4f00d;

  // Base fill.
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // Aurora — large soft radial blobs in pink/magenta with a violet
  // counterpoint, blended with `lighter` so they pile up like real nebula.
  // The base alphas are intentionally subtle; auroraOpacity lets callers
  // dial them up for hero shots like the landing screen.
  const blobs: { x: number; y: number; r: number; color: string }[] = [
    { x: 0.22, y: 0.28, r: 0.7, color: `rgba(190, 60, 130, ${0.30 * auroraOpacity})` },
    { x: 0.78, y: 0.62, r: 0.6, color: `rgba(120, 50, 170, ${0.24 * auroraOpacity})` },
    { x: 0.85, y: 0.18, r: 0.45, color: `rgba(220, 110, 180, ${0.18 * auroraOpacity})` },
    { x: 0.35, y: 0.85, r: 0.55, color: `rgba(60, 80, 180, ${0.18 * auroraOpacity})` },
    { x: 0.55, y: 0.45, r: 0.35, color: `rgba(240, 113, 120, ${0.12 * auroraOpacity})` },
  ];
  ctx.globalCompositeOperation = 'lighter';
  for (const b of blobs) {
    const cx = b.x * width;
    const cy = b.y * height;
    const rad = b.r * width;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    grad.addColorStop(0, b.color);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.globalCompositeOperation = 'source-over';

  // Starfield — many tiny dots, deterministic so resizes don't shuffle the
  // pattern. Three size tiers + varied alpha for depth.
  const rand = mulberry32(starSeed);
  const count = Math.floor((width * height) / starDensity);
  for (let i = 0; i < count; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const tier = rand();
    const r = tier < 0.78 ? 0.6 : tier < 0.94 ? 1.1 : 1.6;
    const a = 0.25 + rand() * 0.7;
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
