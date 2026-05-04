import React, { useEffect, useRef, MutableRefObject } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { GameRenderer } from '../engine/GameRenderer';
import { loadFont } from '../engine/AssetLoader';
import type { GameState } from '../engine/types';
import styles from './GameCanvas.module.css';

interface GameCanvasProps {
  engine: GameEngine | null;
  onUpdateRef: MutableRefObject<(state: GameState) => void>;
}

// Kick off font loading once at module load; renderer falls back to monospace until ready.
loadFont();

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine, onUpdateRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const lastStateRef = useRef<GameState | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !engine) return;

    const renderer = new GameRenderer(canvasRef.current);
    rendererRef.current = renderer;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        renderer.resize(width, height);
        if (lastStateRef.current) {
          renderer.draw(lastStateRef.current, performance.now());
        }
      }
    });

    resizeObserver.observe(canvasRef.current);
    const rect = canvasRef.current.getBoundingClientRect();
    renderer.resize(rect.width, rect.height);

    onUpdateRef.current = (state: GameState) => {
      lastStateRef.current = state;
      renderer.draw(state, performance.now());
    };

    return () => {
      resizeObserver.disconnect();
    };
  }, [engine, onUpdateRef]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
};

export default GameCanvas;
