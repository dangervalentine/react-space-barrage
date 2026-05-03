import React, { useContext } from 'react';
import type { GameState } from '../engine/types';

const GameContext = React.createContext<GameState | null>(null);

export const Provider = GameContext.Provider;

export const useGameContext = (): GameState => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within GameProvider');
  }
  return context;
};
