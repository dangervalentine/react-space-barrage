import React, { useEffect, useRef, useState, MutableRefObject } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { GameRenderer } from '../engine/GameRenderer';
import { loadAssets } from '../engine/AssetLoader';
import type { GameState } from '../engine/types';
import styles from './GameCanvas.module.css';

interface GameCanvasProps {
  engine: GameEngine | null;
  onUpdateRef: MutableRefObject<(state: GameState) => void>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine, onUpdateRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastStateRef = useRef<GameState | null>(null);

  useEffect(() => {
    console.log('GameCanvas useEffect running', {
      hasCanvas: !!canvasRef.current,
      hasEngine: !!engine
    });

    if (!canvasRef.current || !engine) {
      console.log('GameCanvas useEffect: early return - canvas or engine missing');
      return;
    }

    const initializeRenderer = async () => {
      try {
        console.log('GameCanvas: Initializing renderer...');
        const assets = await loadAssets();
        console.log('GameCanvas: Assets loaded, creating renderer...');
        const renderer = new GameRenderer(canvasRef.current!, assets);
        console.log('GameCanvas: Renderer created');
        rendererRef.current = renderer;

        // Set up ResizeObserver
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            renderer.resize(width, height);
            // Redraw with last known state
            if (lastStateRef.current) {
              renderer.draw(lastStateRef.current, performance.now());
            }
          }
        });

        if (canvasRef.current) {
          resizeObserver.observe(canvasRef.current);

          // Initial resize
          const rect = canvasRef.current.getBoundingClientRect();
          renderer.resize(rect.width, rect.height);
        }

        // Set the onUpdate callback so the engine can call the renderer
        onUpdateRef.current = (state: GameState) => {
          lastStateRef.current = state;
          renderer.draw(state, performance.now());
        };

        console.log('GameCanvas: onUpdate callback wired');
        setIsReady(true);

        return () => {
          resizeObserver.disconnect();
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('Failed to initialize game renderer:', err);
        setError(`Failed to load: ${errorMsg}`);
      }
    };

    initializeRenderer();
  }, [engine, onUpdateRef]);

  return (
    <>
      <canvas ref={canvasRef} className={styles.canvas} />
      {!isReady && !error && <div className={styles.loading}>Loading game...</div>}
      {error && <div className={styles.loading}>{error}</div>}
    </>
  );
};

export default GameCanvas;
