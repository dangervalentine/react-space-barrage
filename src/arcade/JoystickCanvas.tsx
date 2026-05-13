import React, { useEffect, useRef } from 'react';
import { colors } from './colors';
import styles from './JoystickCanvas.module.css';

export interface JoystickState {
  /** -1..1, signed magnitude relative to OUTER_RADIUS */
  x: number;
  y: number;
  /** 0..1, clamped magnitude relative to OUTER_RADIUS */
  magnitude: number;
  /** radians, atan2(y, x); only meaningful when magnitude > 0 */
  angle: number;
  /** True while a finger/mouse is engaged with the stick */
  active: boolean;
}

export interface JoystickCanvasProps {
  /** Called every input event with normalized stick state. */
  onChange?: (state: JoystickState) => void;
  /** Fired once per push past the strong-flick threshold; resets on neutral. */
  onLeftFlick?: () => void;
  onRightFlick?: () => void;
  onUpFlick?: () => void;
  onDownFlick?: () => void;
}

const JOYSTICK_SIZE = 200;
const DEAD_ZONE = 25;
const OUTER_RADIUS = JOYSTICK_SIZE / 2;
const INNER_RADIUS = 65;
const FLICK_RATIO = 0.6;

export const JoystickCanvas: React.FC<JoystickCanvasProps> = ({
  onChange,
  onLeftFlick,
  onRightFlick,
  onUpFlick,
  onDownFlick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isActiveRef = useRef(false);
  const verticalLatchRef = useRef(false);
  const horizontalLatchRef = useRef(false);

  const cbRef = useRef({ onChange, onLeftFlick, onRightFlick, onUpFlick, onDownFlick });
  useEffect(() => {
    cbRef.current = { onChange, onLeftFlick, onRightFlick, onUpFlick, onDownFlick };
  }, [onChange, onLeftFlick, onRightFlick, onUpFlick, onDownFlick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = JOYSTICK_SIZE * dpr;
    canvas.height = JOYSTICK_SIZE * dpr;
    ctx.scale(dpr, dpr);

    const drawJoystick = (kx: number, ky: number) => {
      const cx = JOYSTICK_SIZE / 2;
      const cy = JOYSTICK_SIZE / 2;

      ctx.clearRect(0, 0, JOYSTICK_SIZE, JOYSTICK_SIZE);

      // Bezel (chrome/metal mounting plate) — vertical linear gradient.
      const bezelGrad = ctx.createLinearGradient(cx, cy - OUTER_RADIUS, cx, cy + OUTER_RADIUS);
      bezelGrad.addColorStop(0, '#3e4147');
      bezelGrad.addColorStop(0.5, '#313438');
      bezelGrad.addColorStop(1, '#23262b');
      ctx.fillStyle = bezelGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, OUTER_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Outer edge stroke to seat the bezel against the cabinet.
      ctx.strokeStyle = '#0a0a0a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, OUTER_RADIUS - 0.5, 0, Math.PI * 2);
      ctx.stroke();

      // Clip to the bezel for everything inside.
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, OUTER_RADIUS, 0, Math.PI * 2);
      ctx.clip();

      // Engraved directional arrows on the chrome ring (drawn before the
      // boot so the boot fill cleanly defines the inner edge of the bezel).
      const arrowR = OUTER_RADIUS - 7;
      const drawEngravedArrow = (angle: number) => {
        ctx.save();
        ctx.translate(cx + Math.cos(angle) * arrowR, cy + Math.sin(angle) * arrowR);
        // Rotate so the triangle's tip points outward (default tip is at +x).
        ctx.rotate(angle);
        // Triangle: tip ~3.5px outward, base 6px wide ~3.5px inward.
        ctx.beginPath();
        ctx.moveTo(3.5, 0);
        ctx.lineTo(-3.5, -3);
        ctx.lineTo(-3.5, 3);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fill();
        // 1px highlight on the inner-facing edge (the base) to read as a
        // light-catching bevel along the recess.
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-3.5, -3);
        ctx.lineTo(-3.5, 3);
        ctx.stroke();
        ctx.restore();
      };
      drawEngravedArrow(-Math.PI / 2); // N
      drawEngravedArrow(Math.PI / 2);  // S
      drawEngravedArrow(0);            // E
      drawEngravedArrow(Math.PI);      // W

      // Dust boot (rubber collar) — radial gradient, slightly lighter at center.
      const bootRadius = OUTER_RADIUS - 14;
      const bootGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, bootRadius);
      bootGrad.addColorStop(0, '#1a1a1a');
      bootGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bootGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, bootRadius, 0, Math.PI * 2);
      ctx.fill();

      // Subtle rubber fold rings.
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      [OUTER_RADIUS - 14, OUTER_RADIUS - 22, OUTER_RADIUS - 30].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Four rivets (Phillips-head screws) at the diagonals so they don't
      // collide with the engraved cardinal arrows.
      const rivetR = 3;
      const rivetRadius = OUTER_RADIUS - 7;
      const drawRivet = (rx: number, ry: number) => {
        ctx.fillStyle = '#2a2d33';
        ctx.beginPath();
        ctx.arc(rx, ry, rivetR, 0, Math.PI * 2);
        ctx.fill();
        // Single 1px highlight along the top edge to imply a recessed seat.
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rx, ry, rivetR - 0.5, Math.PI, 0);
        ctx.stroke();
      };
      [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].forEach((a) => {
        drawRivet(cx + Math.cos(a) * rivetRadius, cy + Math.sin(a) * rivetRadius);
      });

      // Drop shadow under the ball — squashed ellipse offset down/right.
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(kx + 2, ky + 4, INNER_RADIUS, INNER_RADIUS * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ball — radial gradient with off-center highlight toward upper-left.
      const ballGrad = ctx.createRadialGradient(
        kx - INNER_RADIUS * 0.4, ky - INNER_RADIUS * 0.4, 1,
        kx, ky, INNER_RADIUS
      );
      // Only `accent.pink` exists in the palette; lighten manually for the
      // highlight stop (a tint of #F07178) and fall off to deep burgundy.
      ballGrad.addColorStop(0, '#FFB5B8');
      ballGrad.addColorStop(0.55, colors.accent.pink);
      ballGrad.addColorStop(1, '#5a1828');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(kx, ky, INNER_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Specular hot-spot — small, sharp white reflection on hard plastic.
      const specX = kx - INNER_RADIUS * 0.45;
      const specY = ky - INNER_RADIUS * 0.45;
      const specR = INNER_RADIUS * 0.16;
      const specGrad = ctx.createRadialGradient(specX, specY, 0, specX, specY, specR);
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = specGrad;
      ctx.beginPath();
      ctx.arc(specX, specY, specR, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const emit = (
      sx: number,
      sy: number,
      distance: number,
      active: boolean
    ) => {
      const cx = JOYSTICK_SIZE / 2;
      const cy = JOYSTICK_SIZE / 2;
      const dx = sx - cx;
      const dy = sy - cy;
      const clamped = Math.min(distance, OUTER_RADIUS);
      const magnitude = clamped / OUTER_RADIUS;
      const angle = Math.atan2(dy, dx);
      const nx = (dx / OUTER_RADIUS);
      const ny = (dy / OUTER_RADIUS);

      cbRef.current.onChange?.({
        x: nx,
        y: ny,
        magnitude: distance <= DEAD_ZONE ? 0 : magnitude,
        angle,
        active,
      });

      const FLICK_THRESHOLD = OUTER_RADIUS * FLICK_RATIO;
      const downAmount = distance * Math.sin(angle);
      const upAmount = -downAmount;
      const rightAmount = distance * Math.cos(angle);
      const verticalDominant = Math.abs(downAmount) > Math.abs(rightAmount);

      if (distance <= DEAD_ZONE) {
        verticalLatchRef.current = false;
        horizontalLatchRef.current = false;
      } else if (verticalDominant) {
        if (!verticalLatchRef.current) {
          if (downAmount >= FLICK_THRESHOLD) {
            verticalLatchRef.current = true;
            cbRef.current.onDownFlick?.();
          } else if (upAmount >= FLICK_THRESHOLD) {
            verticalLatchRef.current = true;
            cbRef.current.onUpFlick?.();
          }
        }
      } else if (!horizontalLatchRef.current && Math.abs(rightAmount) >= FLICK_THRESHOLD) {
        horizontalLatchRef.current = true;
        if (rightAmount > 0) cbRef.current.onRightFlick?.();
        else cbRef.current.onLeftFlick?.();
      }
    };

    const handleMove = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = JOYSTICK_SIZE / rect.width;
      const scaleY = JOYSTICK_SIZE / rect.height;
      const sx = (clientX - rect.left) * scaleX;
      const sy = (clientY - rect.top) * scaleY;
      const cx = JOYSTICK_SIZE / 2;
      const cy = JOYSTICK_SIZE / 2;
      const dx = sx - cx;
      const dy = sy - cy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      let kx = sx;
      let ky = sy;
      const maxDistance = OUTER_RADIUS - INNER_RADIUS;
      if (distance > maxDistance) {
        const a = Math.atan2(dy, dx);
        kx = cx + Math.cos(a) * maxDistance;
        ky = cy + Math.sin(a) * maxDistance;
      }
      drawJoystick(kx, ky);
      emit(sx, sy, Math.min(distance, OUTER_RADIUS), true);
    };

    const handleStart = (e: TouchEvent | MouseEvent) => {
      isActiveRef.current = true;
      const cx = (e as TouchEvent).touches?.[0]?.clientX ?? (e as MouseEvent).clientX;
      const cy = (e as TouchEvent).touches?.[0]?.clientY ?? (e as MouseEvent).clientY;
      handleMove(cx, cy);
    };
    const handleMove_ = (e: TouchEvent | MouseEvent) => {
      if (!isActiveRef.current) return;
      const cx = (e as TouchEvent).touches?.[0]?.clientX ?? (e as MouseEvent).clientX;
      const cy = (e as TouchEvent).touches?.[0]?.clientY ?? (e as MouseEvent).clientY;
      handleMove(cx, cy);
    };
    const handleEnd = () => {
      isActiveRef.current = false;
      verticalLatchRef.current = false;
      horizontalLatchRef.current = false;
      cbRef.current.onChange?.({ x: 0, y: 0, magnitude: 0, angle: 0, active: false });
      drawJoystick(JOYSTICK_SIZE / 2, JOYSTICK_SIZE / 2);
    };

    drawJoystick(JOYSTICK_SIZE / 2, JOYSTICK_SIZE / 2);

    container.addEventListener('touchstart', handleStart as EventListener);
    container.addEventListener('touchmove', handleMove_ as EventListener);
    container.addEventListener('touchend', handleEnd);
    container.addEventListener('mousedown', handleStart as EventListener);
    document.addEventListener('mousemove', handleMove_ as EventListener);
    document.addEventListener('mouseup', handleEnd);

    return () => {
      container.removeEventListener('touchstart', handleStart as EventListener);
      container.removeEventListener('touchmove', handleMove_ as EventListener);
      container.removeEventListener('touchend', handleEnd);
      container.removeEventListener('mousedown', handleStart as EventListener);
      document.removeEventListener('mousemove', handleMove_ as EventListener);
      document.removeEventListener('mouseup', handleEnd);
    };
  }, []);

  return (
    <div className={styles.container} ref={containerRef}>
      <canvas ref={canvasRef} className={styles.joystickCanvas} />
    </div>
  );
};
