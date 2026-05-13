// src/arcade/index.ts
//
// Public API surface for the arcade subsystem in react-space-barrage.
// Re-exports shared arcade primitives so game files can import from
// '@/arcade' (or a relative path) instead of deep relative paths.

// ---- Components ----------------------------------------------------------
export { ArcadeCabinet } from './ArcadeCabinet';
export type { ArcadeCabinetProps } from './ArcadeCabinet';

export { PauseA11yMirror } from './PauseA11yMirror';

export { ArcadeCanvas } from './ArcadeCanvas';
export type { ArcadeCanvasProps } from './ArcadeCanvas';

export { JoystickCanvas } from './JoystickCanvas';
export type { JoystickCanvasProps, JoystickState } from './JoystickCanvas';

// ---- Hooks ---------------------------------------------------------------
export { useArcadeSession, useArcadeKeyboard, DEFAULT_PAUSE_ITEMS } from './useArcadeSession';
export type {
  ArcadeSession,
  ArcadeKeyboardEngine,
  LandingView,
  UseArcadeSessionOptions,
  UseArcadeKeyboardOptions,
} from './useArcadeSession';

// ---- Factories -----------------------------------------------------------
export { createTodaysBest } from './todaysBest';
export type { TodaysBest, TodaysBestEntry } from './todaysBest';

export { createSetting } from './createSetting';
export type { Setting, SettingOptions } from './createSetting';

// ---- Pure utilities ------------------------------------------------------
export { eightWayDirectionalGate } from './joystickGates';
export type { EightWayInput } from './joystickGates';

export { paintNebulaBackdrop } from './nebula';
export type { NebulaOptions } from './nebula';

export { drawHudScore, drawHudLives, getHudScale, getHudMetrics } from './hud';
export type { HudMetrics } from './hud';

export {
  drawText,
  measureText,
  drawKeycap,
  roundedRect,
  drawBannerRings,
  drawLeaderboardRow,
  drawPauseMenu,
} from './canvasUI';
export type {
  DrawTextOptions,
  DrawKeycapOptions,
  BannerRingSpec,
  LeaderboardRowOptions,
  DrawPauseMenuOptions,
  PauseMenuItemSpec,
} from './canvasUI';

export { colors } from './colors';
export type { ArcadeColors } from './colors';

export {
  ARCADE_DESIGN_WIDTH,
  ARCADE_DESIGN_HEIGHT,
} from './designSize';

// ---- Types ---------------------------------------------------------------
export type { ArcadeRenderer } from './renderer';
export type {
  ArcadeMode,
  ArcadeFrame,
  ArcadeUI,
  LandingUI,
  PlayingUI,
  PauseUI,
  PauseMenuItem,
  GameoverUI,
  CabinetUIConfig,
} from './arcadeFrame';

export type { LeaderboardEntry } from './leaderboardTypes';
