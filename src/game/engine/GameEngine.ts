import {
    GameState,
    EnemyState,
    ParticleState,
    BulletState,
    KEYS,
    ENEMY_START_Y,
    ENEMY_END_Y,
    GAME_WIDTH,
    GAME_HEIGHT,
    randomUpTo,
} from './types';
import { DifficultyScaler } from './DifficultyScaler';
import { WaveManager } from './WaveManager';
import {
    BULLET_KILL_SCORE,
    BULLET_OOB_BUFFER,
    BULLET_SPEED_PER_SEC,
    BULLET_TILT_AMPLIFIER,
    COLLISION_PADDING,
    DEATH_ANIM_MS,
    ENEMY_COLUMNS,
    ENEMY_FADE_AFTER_REMOVAL_MS,
    ENEMY_PASS_THROUGH_SCORE,
    EXPLOSION_BIG_BASE_SPEED_PER_SEC,
    EXPLOSION_BIG_COUNT,
    EXPLOSION_BIG_LIFETIME_JITTER_MS,
    EXPLOSION_BIG_LIFETIME_MS,
    EXPLOSION_BIG_SPEED_JITTER_PER_SEC,
    EXPLOSION_PALETTE,
    EXPLOSION_SLOW_CORE_BASE_SPEED_PER_SEC,
    EXPLOSION_SLOW_CORE_COUNT,
    EXPLOSION_SLOW_CORE_LIFETIME_JITTER_MS,
    EXPLOSION_SLOW_CORE_LIFETIME_MS,
    EXPLOSION_SLOW_CORE_SPEED_JITTER_PER_SEC,
    EXPLOSION_SMALL_BASE_SPEED_PER_SEC,
    EXPLOSION_SMALL_COUNT,
    EXPLOSION_SMALL_LIFETIME_JITTER_MS,
    EXPLOSION_SMALL_LIFETIME_MS,
    EXPLOSION_SMALL_SPEED_JITTER_PER_SEC,
    INITIAL_SHIP_X,
    INITIAL_SHIP_Y,
    MAX_FRAME_DT_MS,
    PARTICLE_BURST_COUNT,
    PARTICLE_BURST_LIFETIME_MS,
    PARTICLE_BURST_SPEED_PER_SEC,
    RESPAWN_DURATION_MS,
    SHIELD_DURATION_MS,
    SHIELD_PICKUP_RADIUS,
    SHIELD_SPAWN_CHANCE,
    SHIELD_SPAWN_MIN_SCORE,
    SHIELD_X_COLUMN_COUNT,
    SHIELD_X_COLUMN_WIDTH,
    SHIP_ACCELERATION_PER_SEC,
    SHIP_BULLET_TILT_DEG_MAX,
    SHIP_FIRE_RATE_MS,
    SHIP_FRICTION_BASE_PER_SEC,
    SHIP_INVULN_DURATION_MS,
    SHIP_MAX_VELOCITY_PER_SEC,
    SHIP_VELOCITY_DEAD_ZONE_PER_SEC,
    SQUID_ALIGN_THRESHOLD,
    SQUID_BOTTOM_Y,
    SQUID_CAP,
    SQUID_DEFAULT_DIVE_PX_PER_MS,
    SQUID_DEFAULT_HUNT_Y,
    SQUID_DIVE_SPEED_MULTIPLIER,
    SQUID_HUNT_PX_PER_MS,
    SQUID_HUNT_Y_MIN,
    SQUID_HUNT_Y_RANGE,
    SQUID_INTRO_SCORE,
    SQUID_LOCK_ON_DELAY_MS,
    SQUID_MAX_CHANCE,
    SQUID_RAMP_END_SCORE,
    SQUID_SPAWN_OFFSCREEN_X,
    STARTING_LIVES,
    WAVE_INITIAL_DELAY_MS,
} from './tuning';

export class GameEngine {
    private state: GameState;
    private rafId: number | null = null;
    private lastTime = 0;
    /** Pause flag — when true, the RAF loop is cancelled and `tick()`
     *  is not called. Set by `pause()` / cleared by `resume()`. The
     *  React layer drives this via the pause-menu state machine in
     *  `useArcadeSession`; the engine itself never decides to pause. */
    private paused = false;
    /** One-way "engine torn down" flag set by `stop()`. Once true,
     *  `pause()` / `resume()` are no-ops — the engine is dead and
     *  must not resurrect. Closes a render-phase race when exiting
     *  to landing: the OLD engine sits in `engine` state for one
     *  extra render, and the pause/resume effect would otherwise
     *  call `OLD.resume()` while the new engine is being constructed,
     *  causing the previous run to keep ticking alongside the new one. */
    private destroyed = false;
    private onUpdate: (state: GameState) => void;
    private startTime: number = 0;
    private pressedKeys: Set<number> = new Set();
    private nextParticleId: number = 0;
    private nextBulletId: number = 0;
    private analogVelocityX = 0;
    private analogVelocityY = 0;
    private lastShotTime: number = 0;
    private difficultyScaler: DifficultyScaler = new DifficultyScaler();
    private waveManager: WaveManager = new WaveManager(WAVE_INITIAL_DELAY_MS);
    private currentTier: number = 0;

    constructor(onUpdate: (state: GameState) => void) {
        this.onUpdate = onUpdate;
        this.startTime = performance.now();
        this.state = this.makeInitialState(this.startTime);
    }

    start(): void {
        this.lastTime = performance.now();
        this.tick(this.lastTime);
    }

    /** Tear down the engine. After this call, `pause()` / `resume()`
     *  are no-ops (the engine cannot resurrect). Idempotent. The
     *  destroyed-flag closes the exitToLanding race described on the
     *  field — without it, the OLD engine's stale React-state ref
     *  could be `resume()`d during the next render's effect pass and
     *  keep ticking the previous run's state alongside the new engine. */
    stop(): void {
        this.destroyed = true;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    /** Pause the simulation. RAF is cancelled and `tick()` stops being
     *  called — ship, enemies, bullets, particles, shields all freeze.
     *  Idempotent. No-op if the engine has been destroyed via `stop()`. */
    pause(): void {
        if (this.destroyed) return;
        if (this.paused) return;
        this.paused = true;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    /** Resume from pause. Resets `lastTime = performance.now()` so the
     *  next tick's dt is ~0 instead of however long the menu was open
     *  — otherwise enemies / bullets would jump forward by the entire
     *  pause duration on the first resumed frame. Idempotent. No-op
     *  if the engine has been destroyed via `stop()` — even if the
     *  React layer holds a stale ref and tries to resume, the dead
     *  engine stays dead. */
    resume(): void {
        if (this.destroyed) return;
        if (!this.paused) return;
        this.paused = false;
        this.lastTime = performance.now();
        this.tick(this.lastTime);
    }

    handleKeyDown(keyCode: number): void {
        if (keyCode === KEYS.SPACE) {
            if (
                !this.state.isShipHit &&
                performance.now() - this.state.lastHitTime >= RESPAWN_DURATION_MS
            ) {
                this.shoot();
            }
            return;
        }
        this.pressedKeys.add(keyCode);
    }

    handleKeyUp(keyCode: number): void {
        this.pressedKeys.delete(keyCode);
    }

    setAnalogVelocity(x: number, y: number): void {
        this.analogVelocityX = Math.max(-SHIP_MAX_VELOCITY_PER_SEC, Math.min(SHIP_MAX_VELOCITY_PER_SEC, x));
        this.analogVelocityY = Math.max(-SHIP_MAX_VELOCITY_PER_SEC, Math.min(SHIP_MAX_VELOCITY_PER_SEC, y));
    }

    private tick = (timestamp: number): void => {
        // Belt-and-suspenders: pause() cancels rafId, but a frame
        // already in-flight when pause() fires will still call tick.
        // Bail before doing any work so we don't double-advance state
        // on resume.
        if (this.paused) return;
        const delta = Math.min(timestamp - this.lastTime, MAX_FRAME_DT_MS);
        this.lastTime = timestamp;

        const isDying = this.state.deathAt != null;
        if (!this.state.isShipHit && !isDying) {
            this.updateShip(delta);
            this.updateEnemies(timestamp, delta);
            this.updateShields(timestamp);
            this.checkShieldPickup();
            this.updateBullets(delta);
            this.checkBulletCollisions();
        }

        if (isDying && timestamp - (this.state.deathAt ?? 0) >= DEATH_ANIM_MS) {
            this.state.isShipHit = true;
            this.state.deathAt = undefined;
        }

        this.updateParticles(delta);
        this.onUpdate({ ...this.state });
        this.rafId = requestAnimationFrame(this.tick);
    };

    private updateShip(delta: number): void {
        const timeSinceHit = performance.now() - this.state.lastHitTime;
        if (timeSinceHit < RESPAWN_DURATION_MS) {
            this.state.shipX = INITIAL_SHIP_X;
            this.state.shipY = INITIAL_SHIP_Y;
            this.state.velocityX = 0;
            this.state.velocityY = 0;
            return;
        }

        const { shipX, shipY, velocityX, velocityY } = this.state;
        let newVelocityX = velocityX;
        let newVelocityY = velocityY;

        // If analog input is active (joystick), use it directly
        const hasAnalogInput = Math.abs(this.analogVelocityX) > 1 || Math.abs(this.analogVelocityY) > 1;

        if (hasAnalogInput) {
            // Use analog velocity directly from joystick
            newVelocityX = this.analogVelocityX;
            newVelocityY = this.analogVelocityY;
        } else {
            // Use keyboard input with acceleration
            const isMovingLeft = this.pressedKeys.has(KEYS.LEFT) || this.pressedKeys.has(KEYS.A);
            const isMovingRight = this.pressedKeys.has(KEYS.RIGHT) || this.pressedKeys.has(KEYS.D);
            const isMovingUp = this.pressedKeys.has(KEYS.UP) || this.pressedKeys.has(KEYS.W);
            const isMovingDown = this.pressedKeys.has(KEYS.DOWN) || this.pressedKeys.has(KEYS.S);

            if (isMovingLeft && !isMovingRight) {
                newVelocityX = Math.max(
                    newVelocityX - SHIP_ACCELERATION_PER_SEC * (delta / 1000),
                    -SHIP_MAX_VELOCITY_PER_SEC
                );
            } else if (isMovingRight && !isMovingLeft) {
                newVelocityX = Math.min(
                    newVelocityX + SHIP_ACCELERATION_PER_SEC * (delta / 1000),
                    SHIP_MAX_VELOCITY_PER_SEC
                );
            } else {
                newVelocityX *= Math.pow(SHIP_FRICTION_BASE_PER_SEC, delta / 1000);
                if (Math.abs(newVelocityX) < SHIP_VELOCITY_DEAD_ZONE_PER_SEC) newVelocityX = 0;
            }

            if (isMovingUp && !isMovingDown) {
                newVelocityY = Math.max(
                    newVelocityY - SHIP_ACCELERATION_PER_SEC * (delta / 1000),
                    -SHIP_MAX_VELOCITY_PER_SEC
                );
            } else if (isMovingDown && !isMovingUp) {
                newVelocityY = Math.min(
                    newVelocityY + SHIP_ACCELERATION_PER_SEC * (delta / 1000),
                    SHIP_MAX_VELOCITY_PER_SEC
                );
            } else {
                newVelocityY *= Math.pow(SHIP_FRICTION_BASE_PER_SEC, delta / 1000);
                if (Math.abs(newVelocityY) < SHIP_VELOCITY_DEAD_ZONE_PER_SEC) newVelocityY = 0;
            }
        }

        this.state.velocityX = newVelocityX;
        this.state.velocityY = newVelocityY;

        const maxY = GAME_HEIGHT - 80;
        const minY = 0;

        let newX = shipX + newVelocityX * (delta / 1000);
        const newY = shipY + newVelocityY * (delta / 1000);

        // Wrap X position around game width
        if (newX > GAME_WIDTH) {
            newX = newX - GAME_WIDTH;
        } else if (newX < 0) {
            newX = GAME_WIDTH + newX;
        }

        this.state.shipX = newX;
        this.state.shipY = Math.max(minY, Math.min(newY, maxY));
    }

    private updateEnemies(timestamp: number, delta: number): void {
        this.spawnEnemies(timestamp);

        const shipX = this.state.shipX;
        const shipY = this.state.shipY;

        this.state.enemies = this.state.enemies.map((enemy) => {
            let updatedEnemy: EnemyState;
            let y: number;
            let x: number;
            let didReachBottom: boolean;

            if (enemy.imageIndex === 1) {
                const next = this.stepSquid(enemy, timestamp, delta, shipX);
                updatedEnemy = next;
                x = next.x;
                y = next.y;
                didReachBottom = y >= SQUID_BOTTOM_Y;
            } else {
                y = this.getEnemyY(enemy, timestamp);
                x = enemy.x;
                const progress = (timestamp - enemy.startTime) / enemy.duration;
                updatedEnemy = { ...enemy, y };
                didReachBottom = progress >= 1 && y >= SQUID_BOTTOM_Y;
            }

            const isInvulnerable = timestamp - this.state.lastHitTime < SHIP_INVULN_DURATION_MS;
            if (!enemy.removedAt && !isInvulnerable && this.checkCollision(shipX, shipY, y, x)) {
                this.state.lives -= 1;
                this.state.lastHitTime = timestamp;
                const isFinal = this.state.lives <= 0;
                this.spawnExplosion(shipX, shipY, timestamp, isFinal);
                if (isFinal) {
                    this.state.deathAt = timestamp;
                }
            }

            if (didReachBottom && !enemy.hasScored) {
                this.state.score += ENEMY_PASS_THROUGH_SCORE;
                return { ...updatedEnemy, hasScored: true };
            }

            // Remove enemy if it exits the bottom of the screen (only mark once)
            if (y >= ENEMY_END_Y && !enemy.removedAt) {
                return { ...updatedEnemy, removedAt: timestamp };
            }

            return updatedEnemy;
        }).filter(enemy => {
            if (enemy.removedAt === undefined) return true;
            return timestamp - enemy.removedAt < ENEMY_FADE_AFTER_REMOVAL_MS;
        });
    }

    private spawnEnemies(timestamp: number): void {
        const tier = this.difficultyScaler.getTierForScore(this.state.score);

        // Update wave delay if tier changed
        if (tier.scoreStart !== this.currentTier) {
            this.currentTier = tier.scoreStart;
            const delayMs = this.difficultyScaler.waveDelayMs(tier);
            this.waveManager.setWaveDelay(delayMs);
        }

        // WaveManager drives cadence; each wave spawns `tier.maxEnemies` enemies
        // in random columns. Difficulty (cap, speed) comes from DifficultyScaler.
        if (!this.waveManager.shouldSpawnWave(timestamp)) return;

        const available = Array.from({ length: ENEMY_COLUMNS }, (_, i) => i);
        const count = Math.min(tier.maxEnemies, ENEMY_COLUMNS);
        for (let i = 0; i < count; i++) {
            const pick = Math.floor(Math.random() * available.length);
            const columnIndex = available[pick];
            available.splice(pick, 1);
            this.createEnemy(columnIndex, timestamp);
        }

        this.waveManager.markWaveSpawned(timestamp);
    }

    private createEnemy(columnIndex: number, timestamp: number): void {
        const columnWidth = GAME_WIDTH / ENEMY_COLUMNS;
        const enemyX = (columnIndex + 0.5) * columnWidth;
        const tier = this.difficultyScaler.getTierForScore(this.state.score);

        const ramp = Math.max(
            0,
            Math.min(
                1,
                (this.state.score - SQUID_INTRO_SCORE) /
                (SQUID_RAMP_END_SCORE - SQUID_INTRO_SCORE),
            ),
        );
        const squidSpawnChance = ramp * SQUID_MAX_CHANCE;
        const activeSquids = this.state.enemies.reduce(
            (n, e) => n + (e.imageIndex === 1 && !e.removedAt ? 1 : 0),
            0,
        );
        const isSquid =
            activeSquids < SQUID_CAP && Math.random() < squidSpawnChance;

        if (isSquid) {
            const huntY = SQUID_HUNT_Y_MIN + Math.random() * SQUID_HUNT_Y_RANGE;
            const baseSpeed = (ENEMY_END_Y - ENEMY_START_Y) / tier.enemyTraverseDurationMs;
            const fromLeft = Math.random() < 0.5;
            const spawnX = fromLeft ? -SQUID_SPAWN_OFFSCREEN_X : GAME_WIDTH + SQUID_SPAWN_OFFSCREEN_X;
            const enemy: EnemyState = {
                id: this.state.enemies.length,
                x: spawnX,
                y: huntY,
                imageIndex: 1,
                startTime: timestamp,
                duration: tier.enemyTraverseDurationMs,
                health: 1,
                hasScored: false,
                phase: 'hunt',
                huntY,
                divePxPerMs: baseSpeed * SQUID_DIVE_SPEED_MULTIPLIER,
            };
            this.state.enemies.push(enemy);
            return;
        }

        const enemy: EnemyState = {
            id: this.state.enemies.length,
            x: enemyX,
            y: ENEMY_START_Y,
            imageIndex: 0,
            startTime: timestamp,
            duration: tier.enemyTraverseDurationMs,
            health: 3,
            hasScored: false,
        };

        this.state.enemies.push(enemy);
    }

    private updateShields(timestamp: number): void {
        if (
            this.state.score >= SHIELD_SPAWN_MIN_SCORE &&
            Math.random() < SHIELD_SPAWN_CHANCE
        ) {
            const shieldId = this.state.shields.length;
            const shield = {
                id: shieldId,
                x: randomUpTo(SHIELD_X_COLUMN_COUNT) * SHIELD_X_COLUMN_WIDTH,
                y: ENEMY_START_Y,
                startTime: timestamp,
                duration: SHIELD_DURATION_MS,
            };
            this.state.shields.push(shield);
        }

        this.state.shields = this.state.shields
            .map(shield => {
                const progress = (timestamp - shield.startTime) / shield.duration;
                const y = ENEMY_START_Y + (ENEMY_END_Y - ENEMY_START_Y) * Math.min(progress, 1);
                return { ...shield, y };
            })
            .filter(shield => shield.y < ENEMY_END_Y);
    }

    private checkShieldPickup(): void {
        const shipX = this.state.shipX;
        const shipY = this.state.shipY;

        this.state.shields = this.state.shields.filter(shield => {
            const distance = Math.sqrt(
                Math.pow(shield.x - shipX, 2) + Math.pow(shield.y - shipY, 2)
            );

            if (distance < SHIELD_PICKUP_RADIUS) {
                const now = performance.now();
                this.state.score += this.state.enemies.length;
                this.state.enemies = this.state.enemies.map(enemy => {
                    this.spawnParticles(enemy.x, enemy.y, now);
                    return { ...enemy, removedAt: now };
                });
                return false;
            }
            return true;
        });
    }

    private checkCollision(shipX: number, shipY: number, enemyY: number, enemyX: number): boolean {
        // Sprite dimensions (geometry — kept inline; the renderer uses sprite
        // ROWS that read 11×7 → these are the design-coordinate equivalents).
        const SHIP_WIDTH = 80;
        const SHIP_HEIGHT = 80;
        const ENEMY_WIDTH = 80;
        const ENEMY_HEIGHT = 80;

        const shipLeft = shipX - SHIP_WIDTH / 2 + COLLISION_PADDING;
        const shipRight = shipX + SHIP_WIDTH / 2 - COLLISION_PADDING;
        const shipTop = shipY - SHIP_HEIGHT / 2 + COLLISION_PADDING;
        const shipBottom = shipY + SHIP_HEIGHT / 2 - COLLISION_PADDING;

        const enemyLeft = enemyX - ENEMY_WIDTH / 2 + COLLISION_PADDING;
        const enemyRight = enemyX + ENEMY_WIDTH / 2 - COLLISION_PADDING;
        const enemyTop = enemyY + COLLISION_PADDING;
        const enemyBottom = enemyY + ENEMY_HEIGHT - COLLISION_PADDING;

        return (
            shipLeft < enemyRight &&
            shipRight > enemyLeft &&
            shipTop < enemyBottom &&
            shipBottom > enemyTop
        );
    }

    private stepSquid(enemy: EnemyState, timestamp: number, delta: number, shipX: number): EnemyState {
        const phase = enemy.phase ?? 'hunt';
        const huntY = enemy.huntY ?? SQUID_DEFAULT_HUNT_Y;

        if (phase === 'hunt') {
            const dx = shipX - enemy.x;
            const aligned = Math.abs(dx) < SQUID_ALIGN_THRESHOLD;

            if (enemy.lockOnAt != null) {
                // Locked on — hold position for the telegraph window, then commit to dive.
                if (timestamp - enemy.lockOnAt >= SQUID_LOCK_ON_DELAY_MS) {
                    return {
                        ...enemy,
                        phase: 'dive',
                        diveStartTime: timestamp,
                        diveStartY: huntY,
                        y: huntY,
                    };
                }
                return { ...enemy, y: huntY };
            }

            if (aligned) {
                return { ...enemy, x: shipX, y: huntY, lockOnAt: timestamp };
            }

            const step = Math.min(Math.abs(dx), SQUID_HUNT_PX_PER_MS * delta);
            return { ...enemy, x: enemy.x + Math.sign(dx) * step, y: huntY };
        }

        // dive
        const speed = enemy.divePxPerMs ?? SQUID_DEFAULT_DIVE_PX_PER_MS;
        const elapsed = timestamp - (enemy.diveStartTime ?? timestamp);
        const y = (enemy.diveStartY ?? huntY) + speed * elapsed;
        return { ...enemy, y };
    }

    private getEnemyY(enemy: EnemyState, timestamp: number): number {
        const progress = (timestamp - enemy.startTime) / enemy.duration;
        const y = ENEMY_START_Y + (ENEMY_END_Y - ENEMY_START_Y) * Math.min(progress, 1);
        return y;
    }


    private makeInitialState(timestamp: number): GameState {
        this.waveManager = new WaveManager(WAVE_INITIAL_DELAY_MS);

        return {
            score: 0,
            highScore: this.state?.highScore ?? 0,
            lives: STARTING_LIVES,
            shipX: INITIAL_SHIP_X,
            shipY: INITIAL_SHIP_Y,
            velocityX: 0,
            velocityY: 0,
            isShipHit: false,
            // Seed lastHitTime far enough in the past that the first frame
            // doesn't think we just got hit (the invuln check compares
            // against SHIP_INVULN_DURATION_MS).
            lastHitTime: timestamp - SHIP_INVULN_DURATION_MS,
            deathAt: undefined,
            enemies: [],
            shields: [],
            particles: [],
            bullets: [],
        };
    }

    private spawnExplosion(x: number, y: number, timestamp: number, big: boolean): void {
        const count = big ? EXPLOSION_BIG_COUNT : EXPLOSION_SMALL_COUNT;
        const baseSpeed = big ? EXPLOSION_BIG_BASE_SPEED_PER_SEC : EXPLOSION_SMALL_BASE_SPEED_PER_SEC;
        const speedJitter = big ? EXPLOSION_BIG_SPEED_JITTER_PER_SEC : EXPLOSION_SMALL_SPEED_JITTER_PER_SEC;
        const baseLifetime = big ? EXPLOSION_BIG_LIFETIME_MS : EXPLOSION_SMALL_LIFETIME_MS;
        const lifetimeJitter = big ? EXPLOSION_BIG_LIFETIME_JITTER_MS : EXPLOSION_SMALL_LIFETIME_JITTER_MS;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
            const speed = baseSpeed + Math.random() * speedJitter;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const color = EXPLOSION_PALETTE[Math.floor(Math.random() * EXPLOSION_PALETTE.length)];
            const size = big
                ? 6 + Math.floor(Math.random() * 4) * 2  // 6,8,10,12
                : 4 + Math.floor(Math.random() * 3) * 2; // 4,6,8

            this.state.particles.push({
                id: this.nextParticleId++,
                x,
                y,
                vx,
                vy,
                createdAt: timestamp,
                lifetime: baseLifetime + Math.random() * lifetimeJitter,
                color,
                size,
            });
        }

        if (big) {
            // dense slow core chunks for that lingering debris feel
            for (let i = 0; i < EXPLOSION_SLOW_CORE_COUNT; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed =
                    EXPLOSION_SLOW_CORE_BASE_SPEED_PER_SEC +
                    Math.random() * EXPLOSION_SLOW_CORE_SPEED_JITTER_PER_SEC;
                this.state.particles.push({
                    id: this.nextParticleId++,
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    createdAt: timestamp,
                    lifetime:
                        EXPLOSION_SLOW_CORE_LIFETIME_MS +
                        Math.random() * EXPLOSION_SLOW_CORE_LIFETIME_JITTER_MS,
                    color: EXPLOSION_PALETTE[Math.floor(Math.random() * EXPLOSION_PALETTE.length)],
                    size: 8 + Math.floor(Math.random() * 3) * 2,
                });
            }
        }
    }

    private spawnParticles(x: number, y: number, timestamp: number): void {
        for (let i = 0; i < PARTICLE_BURST_COUNT; i++) {
            const angle = (i / PARTICLE_BURST_COUNT) * Math.PI * 2;
            const vx = Math.cos(angle) * PARTICLE_BURST_SPEED_PER_SEC;
            const vy = Math.sin(angle) * PARTICLE_BURST_SPEED_PER_SEC;

            const particle: ParticleState = {
                id: this.nextParticleId++,
                x,
                y,
                vx,
                vy,
                createdAt: timestamp,
                lifetime: PARTICLE_BURST_LIFETIME_MS,
            };
            this.state.particles.push(particle);
        }
    }

    private updateParticles(delta: number): void {
        const now = performance.now();
        this.state.particles = this.state.particles
            .map(particle => ({
                ...particle,
                x: particle.x + particle.vx * (delta / 1000),
                y: particle.y + particle.vy * (delta / 1000),
            }))
            .filter(particle => now - particle.createdAt < particle.lifetime);
    }

    private shoot(): void {
        const now = performance.now();

        if (now - this.lastShotTime < SHIP_FIRE_RATE_MS) return;

        this.lastShotTime = now;

        // Geometric ship width — kept inline (not in tuning.ts) because it
        // matches the renderer's sprite dims and the bullet origin offset.
        const SHIP_WIDTH = 80;
        const NOSE_OFFSET = SHIP_WIDTH / 2;

        // Visual ship lean scales linearly with horizontal velocity, capped
        // at SHIP_BULLET_TILT_DEG_MAX. Bullet inherits the same lean
        // multiplied by BULLET_TILT_AMPLIFIER so shots visibly fan in the
        // direction of motion.
        const shipRotateAngle =
            (this.state.velocityX / SHIP_MAX_VELOCITY_PER_SEC) * SHIP_BULLET_TILT_DEG_MAX;
        const bulletRotateAngle = shipRotateAngle * BULLET_TILT_AMPLIFIER;
        const rotateRad = (bulletRotateAngle * Math.PI) / 180;
        const shipRotateRad = (shipRotateAngle * Math.PI) / 180;

        const vx = Math.sin(rotateRad) * BULLET_SPEED_PER_SEC;
        const vy = -Math.cos(rotateRad) * BULLET_SPEED_PER_SEC;

        const bulletX = this.state.shipX + NOSE_OFFSET * Math.sin(shipRotateRad);
        const bulletY = this.state.shipY - NOSE_OFFSET * Math.cos(shipRotateRad);

        const bullet: BulletState = {
            id: this.nextBulletId++,
            x: bulletX,
            y: bulletY,
            vx,
            vy,
            createdAt: now,
        };

        this.state.bullets.push(bullet);
    }

    private updateBullets(delta: number): void {
        this.state.bullets = this.state.bullets
            .map(bullet => ({
                ...bullet,
                x: bullet.x + bullet.vx * (delta / 1000),
                y: bullet.y + bullet.vy * (delta / 1000),
            }))
            .filter(bullet => {
                return (
                    bullet.x >= -BULLET_OOB_BUFFER &&
                    bullet.x <= GAME_WIDTH + BULLET_OOB_BUFFER &&
                    bullet.y >= -BULLET_OOB_BUFFER &&
                    bullet.y <= GAME_HEIGHT + BULLET_OOB_BUFFER
                );
            });
    }

    private checkBulletCollisions(): void {
        const now = performance.now();
        // Geometric enemy sprite dims — kept inline (not in tuning.ts)
        // because they match the renderer's sprite ROWS layout.
        const ENEMY_WIDTH = 80;
        const ENEMY_HEIGHT = 80;

        for (let i = this.state.bullets.length - 1; i >= 0; i--) {
            const bullet = this.state.bullets[i];

            for (let j = this.state.enemies.length - 1; j >= 0; j--) {
                const enemy = this.state.enemies[j];

                // if (enemy.removedAt !== undefined) continue;

                const enemyLeft = enemy.x;
                const enemyRight = enemy.x + ENEMY_WIDTH;
                const enemyTop = enemy.y;
                const enemyBottom = enemy.y + ENEMY_HEIGHT;

                if (
                    bullet.x >= enemyLeft &&
                    bullet.x <= enemyRight &&
                    bullet.y >= enemyTop &&
                    bullet.y <= enemyBottom
                ) {
                    this.state.bullets.splice(i, 1);

                    const newHealth = enemy.health - 1;
                    if (newHealth <= 0) {
                        this.state.score += BULLET_KILL_SCORE;
                        this.spawnParticles(enemy.x + ENEMY_WIDTH / 2, enemy.y + ENEMY_HEIGHT / 2, now);
                        this.state.enemies[j] = { ...enemy, health: 0, removedAt: now };
                    } else {
                        this.state.enemies[j] = { ...enemy, health: newHealth, lastHitAt: now };
                    }
                    break;
                }
            }
        }
    }
}
