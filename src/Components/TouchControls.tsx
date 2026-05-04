import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../engine/GameEngine';
import styles from './TouchControls.module.css';

interface TouchControlsProps {
  engine: GameEngine | null;
}

export const TouchControls = ({ engine }: TouchControlsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isActiveRef = useRef(false);

  const JOYSTICK_SIZE = 200;
  const DEAD_ZONE = 25;
  const OUTER_RADIUS = JOYSTICK_SIZE / 2;
  const INNER_RADIUS = 25;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = JOYSTICK_SIZE;
    canvas.height = JOYSTICK_SIZE;

    const drawJoystick = (x: number, y: number) => {
      const centerX = JOYSTICK_SIZE / 2;
      const centerY = JOYSTICK_SIZE / 2;

      // Clear
      ctx.clearRect(0, 0, JOYSTICK_SIZE, JOYSTICK_SIZE);

      // Outer ring background
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath();
      ctx.arc(centerX, centerY, OUTER_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring border - light
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, OUTER_RADIUS - 2, 0, Math.PI * 2);
      ctx.stroke();

      // Outer ring border - dark
      ctx.strokeStyle = '#664400';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, OUTER_RADIUS - 4, 0, Math.PI * 2);
      ctx.stroke();

      // Clip to outer circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, OUTER_RADIUS, 0, Math.PI * 2);
      ctx.clip();

      // Knob shadow (dark base)
      ctx.fillStyle = '#0a0a14';
      ctx.beginPath();
      ctx.arc(x, y, INNER_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Knob main color with simple gradient
      const knobGradient = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, INNER_RADIUS);
      knobGradient.addColorStop(0, '#FFD700');
      knobGradient.addColorStop(0.7, '#FFA500');
      knobGradient.addColorStop(1, '#FF8C00');

      ctx.fillStyle = knobGradient;
      ctx.beginPath();
      ctx.arc(x, y, INNER_RADIUS - 1, 0, Math.PI * 2);
      ctx.fill();

      // Knob border
      ctx.strokeStyle = '#664400';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, INNER_RADIUS - 1, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    };

    const getAngleAndDistance = (clientX: number, clientY: number) => {
      const canvasRect = canvas.getBoundingClientRect();
      const relX = clientX - canvasRect.left;
      const relY = clientY - canvasRect.top;

      // Scale coordinates to canvas coordinate space
      const scaleX = JOYSTICK_SIZE / canvasRect.width;
      const scaleY = JOYSTICK_SIZE / canvasRect.height;
      const scaledX = relX * scaleX;
      const scaledY = relY * scaleY;

      const centerX = JOYSTICK_SIZE / 2;
      const centerY = JOYSTICK_SIZE / 2;

      const dx = scaledX - centerX;
      const dy = scaledY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      return { angle, distance };
    };

    const updateVelocityFromPosition = (angle: number, distance: number) => {
      const MAX_VELOCITY = 500;

      if (distance <= DEAD_ZONE) {
        engine?.setAnalogVelocity(0, 0);
      } else {
        const magnitude = Math.min(distance, OUTER_RADIUS) / OUTER_RADIUS;
        const velocityX = Math.cos(angle) * magnitude * MAX_VELOCITY;
        const velocityY = Math.sin(angle) * magnitude * MAX_VELOCITY;
        engine?.setAnalogVelocity(velocityX, velocityY);
      }
    };

    const handleMove = (clientX: number, clientY: number) => {
      const canvasRect = canvas.getBoundingClientRect();
      const relX = clientX - canvasRect.left;
      const relY = clientY - canvasRect.top;

      // Scale coordinates to canvas coordinate space
      const scaleX = JOYSTICK_SIZE / canvasRect.width;
      const scaleY = JOYSTICK_SIZE / canvasRect.height;
      const scaledX = relX * scaleX;
      const scaledY = relY * scaleY;

      const centerX = JOYSTICK_SIZE / 2;
      const centerY = JOYSTICK_SIZE / 2;

      const dx = scaledX - centerX;
      const dy = scaledY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Clamp to radius, accounting for knob size
      let x = scaledX;
      let y = scaledY;
      const maxDistance = OUTER_RADIUS - INNER_RADIUS;
      if (distance > maxDistance) {
        const angle = Math.atan2(dy, dx);
        x = centerX + Math.cos(angle) * maxDistance;
        y = centerY + Math.sin(angle) * maxDistance;
      }

      drawJoystick(x, y);

      const { angle } = getAngleAndDistance(clientX, clientY);
      updateVelocityFromPosition(angle, Math.min(distance, OUTER_RADIUS));
    };

    const handleStart = (e: TouchEvent | MouseEvent) => {
      isActiveRef.current = true;
      const clientX = (e as any).touches?.[0]?.clientX ?? (e as any).clientX;
      const clientY = (e as any).touches?.[0]?.clientY ?? (e as any).clientY;
      handleMove(clientX, clientY);
    };

    const handleMove_ = (e: TouchEvent | MouseEvent) => {
      if (!isActiveRef.current) return;
      const clientX = (e as any).touches?.[0]?.clientX ?? (e as any).clientX;
      const clientY = (e as any).touches?.[0]?.clientY ?? (e as any).clientY;
      handleMove(clientX, clientY);
    };

    const handleEnd = () => {
      isActiveRef.current = false;
      engine?.setAnalogVelocity(0, 0);
      drawJoystick(JOYSTICK_SIZE / 2, JOYSTICK_SIZE / 2);
    };

    // Initial draw
    drawJoystick(JOYSTICK_SIZE / 2, JOYSTICK_SIZE / 2);

    container.addEventListener('touchstart', handleStart as any);
    container.addEventListener('touchmove', handleMove_ as any);
    container.addEventListener('touchend', handleEnd);
    container.addEventListener('mousedown', handleStart as any);
    document.addEventListener('mousemove', handleMove_ as any);
    document.addEventListener('mouseup', handleEnd);

    return () => {
      container.removeEventListener('touchstart', handleStart as any);
      container.removeEventListener('touchmove', handleMove_ as any);
      container.removeEventListener('touchend', handleEnd);
      container.removeEventListener('mousedown', handleStart as any);
      document.removeEventListener('mousemove', handleMove_ as any);
      document.removeEventListener('mouseup', handleEnd);
    };
  }, [engine]);

  return (
    <div className={styles.container} ref={containerRef}>
      <canvas ref={canvasRef} className={styles.joystickCanvas} />
    </div>
  );
};
