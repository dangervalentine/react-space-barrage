import { WaveManager } from './WaveManager';

describe('WaveManager', () => {
  it('shouldSpawnWave returns true when currentTime >= nextWaveTime', () => {
    const manager = new WaveManager(1000);
    expect(manager.shouldSpawnWave(0)).toBe(true);
  });

  it('shouldSpawnWave returns false when currentTime < nextWaveTime', () => {
    const manager = new WaveManager(1000);
    manager.markWaveSpawned(0);
    expect(manager.shouldSpawnWave(500)).toBe(false);
  });

  it('markWaveSpawned schedules next wave: nextWaveTime = currentTime + waveDelayMs', () => {
    const manager = new WaveManager(1000);
    manager.markWaveSpawned(100);
    expect(manager.shouldSpawnWave(1100)).toBe(true);
    expect(manager.shouldSpawnWave(1099)).toBe(false);
  });

  it('setWaveDelay updates waveDelayMs for future waves', () => {
    const manager = new WaveManager(1000);
    manager.markWaveSpawned(0);
    manager.setWaveDelay(500);
    manager.markWaveSpawned(1000);
    expect(manager.shouldSpawnWave(1500)).toBe(true);
    expect(manager.shouldSpawnWave(1499)).toBe(false);
  });

  it('Initialize with nextWaveTime = 0', () => {
    const manager = new WaveManager(1000);
    expect(manager.shouldSpawnWave(0)).toBe(true);
  });
});
