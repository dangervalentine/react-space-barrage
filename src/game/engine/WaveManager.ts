export class WaveManager {
  private nextWaveTime: number = 0;
  private waveDelayMs: number;

  constructor(initialDelayMs: number) {
    this.waveDelayMs = initialDelayMs;
  }

  setWaveDelay(delayMs: number): void {
    this.waveDelayMs = delayMs;
  }

  shouldSpawnWave(currentTime: number): boolean {
    return currentTime >= this.nextWaveTime;
  }

  markWaveSpawned(currentTime: number): void {
    this.nextWaveTime = currentTime + this.waveDelayMs;
  }
}
