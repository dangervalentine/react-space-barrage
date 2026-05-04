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

      // Create circular clipping path
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, OUTER_RADIUS, 0, Math.PI * 2);
      ctx.clip();

      // Outer ring
      ctx.strokeStyle = '#7fdbca';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, OUTER_RADIUS, 0, Math.PI * 2);
      ctx.stroke();

      // Inner knob
      ctx.fillStyle = '#7fdbca';
      ctx.beginPath();
      ctx.arc(x, y, INNER_RADIUS, 0, Math.PI * 2);
      ctx.fill();

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

      // Clamp to radius
      let x = scaledX;
      let y = scaledY;
      if (distance > OUTER_RADIUS) {
        const angle = Math.atan2(dy, dx);
        x = centerX + Math.cos(angle) * OUTER_RADIUS;
        y = centerY + Math.sin(angle) * OUTER_RADIUS;
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
