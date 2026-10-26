import Phaser from 'phaser'
import {
  COLORS,
  DIFFICULTY,
  ENERGY,
  LANES,
  OBSTACLE,
  PLAYER,
  SCORE,
  TIMING,
  WORLD,
} from './config'
import { easeSpeed, levelAt, spawnInterval, targetSpeed } from './difficulty'
import { createPatternGenerator, type PatternGenerator } from './obstacles'
import { createRng } from './random'
import { sfx } from './sound'
import type { GameCallbacks, Lane, RunConfig, SpawnPattern } from './types'

const TEX = {
  player: 'pulso-player',
  obstacle: 'pulso-obstacle',
  energy: 'pulso-energy',
  spark: 'pulso-spark',
  grid: 'pulso-grid',
} as const

/** Quanto um objeto pode passar do fundo da tela antes de ser reciclado. */
const DESPAWN_MARGIN = 60

/**
 * Cena única da partida. É reiniciada com `scene.restart(config)` a cada nova
 * tentativa; o evento `shutdown` limpa listeners, timers e objetos da anterior,
 * então nunca há duas partidas rodando ao mesmo tempo.
 */
export class GameScene extends Phaser.Scene {
  private readonly callbacks: GameCallbacks
  private run!: RunConfig
  private patterns!: PatternGenerator

  // Estado da partida
  private lane: Lane = 0
  private alive = false
  private elapsed = 0
  private speed: number = DIFFICULTY.baseSpeed
  private spawnTimer = 0
  private survivalPoints = 0
  private bonusPoints = 0
  private combo = 0
  private energyCollected = 0
  private lastEmittedScore = -1
  private lastEmittedMultiplier = -1
  private lastPointerAt = Number.NEGATIVE_INFINITY

  // Geometria (depende da altura do mundo, definida na criação do jogo)
  private worldHeight: number = WORLD.minHeight
  private playerY: number = WORLD.minHeight - PLAYER.bottomOffset
  private despawnY: number = WORLD.minHeight + DESPAWN_MARGIN

  // Objetos (reutilizados via pools)
  private player!: Phaser.GameObjects.Image
  private obstacles!: Phaser.GameObjects.Group
  private energies!: Phaser.GameObjects.Group
  private popups!: Phaser.GameObjects.Group
  private grid!: Phaser.GameObjects.TileSprite
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter
  private debris!: Phaser.GameObjects.Particles.ParticleEmitter
  private playerTween?: Phaser.Tweens.Tween

  constructor(callbacks: GameCallbacks) {
    super('game')
    this.callbacks = callbacks
  }

  init(config: RunConfig): void {
    this.run = config
    sfx.enabled = config.soundEnabled
    this.patterns = createPatternGenerator(createRng(config.seed))
    this.lane = 0
    this.alive = true
    this.elapsed = 0
    this.speed = DIFFICULTY.baseSpeed
    this.spawnTimer = DIFFICULTY.warmup
    this.survivalPoints = 0
    this.bonusPoints = 0
    this.combo = 0
    this.energyCollected = 0
    this.lastEmittedScore = -1
    this.lastEmittedMultiplier = -1
    this.lastPointerAt = Number.NEGATIVE_INFINITY
  }

  create(): void {
    this.worldHeight = this.scale.height
    this.playerY = this.worldHeight - PLAYER.bottomOffset
    this.despawnY = this.worldHeight + DESPAWN_MARGIN

    this.createTextures()
    this.cameras.main.setBackgroundColor(COLORS.background)

    this.grid = this.add.tileSprite(0, 0, WORLD.width, this.worldHeight, TEX.grid).setOrigin(0)
    this.drawLanes()

    this.obstacles = this.add.group({ classType: Phaser.GameObjects.Image, maxSize: 16 })
    this.energies = this.add.group({ classType: Phaser.GameObjects.Image, maxSize: 12 })
    this.popups = this.add.group({ classType: Phaser.GameObjects.Text, maxSize: 6 })

    this.player = this.add.image(LANES.x[this.lane], this.playerY, TEX.player).setDepth(10)
    if (!this.run.reducedMotion) {
      this.tweens.add({
        targets: this.player,
        scale: { from: 1, to: 1.08 },
        duration: 420,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    const sparkCount = this.run.reducedMotion ? 6 : 14
    this.sparks = this.add.particles(0, 0, TEX.spark, {
      speed: { min: 80, max: 220 },
      lifespan: 380,
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [COLORS.energy, COLORS.spark],
      quantity: sparkCount,
      emitting: false,
    }).setDepth(20)

    this.debris = this.add.particles(0, 0, TEX.spark, {
      speed: { min: 120, max: 340 },
      lifespan: 520,
      scale: { start: 1.6, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [COLORS.crash, COLORS.player, COLORS.playerRing],
      quantity: this.run.reducedMotion ? 10 : 28,
      emitting: false,
    }).setDepth(20)

    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.handlePointer, this)
    this.input.keyboard?.on('keydown', this.handleKey, this)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this)

    // Apenas em `npm run dev`: expõe a cena para depuração/testes automáticos.
    if (import.meta.env.DEV) (window as unknown as { __pulso?: GameScene }).__pulso = this

    sfx.play('start')
    this.emitScore()
  }

  update(_time: number, deltaMs: number): void {
    // Delta limitado: a lógica não depende do FPS e não "pula" ao voltar da aba.
    const dt = Math.min(deltaMs / 1000, TIMING.maxDelta)
    if (!this.alive) return

    this.elapsed += dt
    const level = levelAt(this.elapsed)
    this.speed = easeSpeed(this.speed, targetSpeed(level), dt)
    this.survivalPoints += SCORE.perSecond * dt

    const scroll = this.speed * dt
    this.grid.tilePositionY -= this.run.reducedMotion ? scroll * 0.25 : scroll

    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      this.spawn(this.patterns.next())
      this.spawnTimer += spawnInterval(level)
    }

    this.updateObstacles(scroll)
    if (!this.alive) return
    this.updateEnergies(scroll, dt)
    this.emitScore()
  }

  // ---------------------------------------------------------------- input

  private handlePointer(pointer: Phaser.Input.Pointer): void {
    if (!this.alive) return
    // Um único toque nunca deve alternar duas vezes (ex.: touch + mouse emulado).
    const now = pointer.event?.timeStamp ?? this.time.now
    if (now - this.lastPointerAt < TIMING.pointerDebounceMs) return
    this.lastPointerAt = now
    this.setLane(this.lane === 0 ? 1 : 0)
  }

  private handleKey(event: KeyboardEvent): void {
    if (!this.alive) return
    let target: Lane | null = null
    switch (event.code) {
      case 'Space':
        target = this.lane === 0 ? 1 : 0
        break
      case 'ArrowLeft':
      case 'KeyA':
        target = 0
        break
      case 'ArrowRight':
      case 'KeyD':
        target = 1
        break
      default:
        return
    }
    // Só bloqueia o comportamento padrão (rolagem) durante a partida.
    event.preventDefault()
    if (event.repeat) return
    this.setLane(target)
  }

  private setLane(target: Lane): void {
    if (target === this.lane) return
    this.lane = target // troca lógica instantânea
    sfx.play('switch')
    this.playerTween?.stop()
    this.playerTween = this.tweens.add({
      targets: this.player,
      x: LANES.x[target],
      duration: PLAYER.switchTweenMs,
      ease: 'Quad.easeOut',
    })
  }

  // ---------------------------------------------------------------- spawn / update

  private spawn(pattern: SpawnPattern): void {
    if (pattern.obstacleLane !== null) {
      const o = this.obstacles.get(LANES.x[pattern.obstacleLane], OBSTACLE.spawnY, TEX.obstacle) as
        | Phaser.GameObjects.Image
        | null
      if (o) o.setActive(true).setVisible(true).setDepth(5)
    }
    if (pattern.energyLane !== null) {
      const e = this.energies.get(LANES.x[pattern.energyLane], OBSTACLE.spawnY, TEX.energy) as
        | Phaser.GameObjects.Image
        | null
      if (e) e.setActive(true).setVisible(true).setDepth(6).setAngle(0).setScale(1).setData('missed', false)
    }
  }

  private updateObstacles(scroll: number): void {
    const hitY = OBSTACLE.height / 2 + PLAYER.radius * PLAYER.hitboxScale
    for (const child of this.obstacles.getChildren()) {
      const o = child as Phaser.GameObjects.Image
      if (!o.active) continue
      o.y += scroll
      if (o.y > this.despawnY) {
        this.obstacles.killAndHide(o)
        continue
      }
      if (laneOf(o.x) === this.lane && Math.abs(o.y - this.playerY) < hitY) {
        this.crash()
        return
      }
    }
  }

  private updateEnergies(scroll: number, dt: number): void {
    const spin = this.run.reducedMotion ? 0 : 180 * dt
    for (const child of this.energies.getChildren()) {
      const e = child as Phaser.GameObjects.Image
      if (!e.active) continue
      e.y += scroll
      e.angle += spin
      if (e.y > this.despawnY) {
        this.energies.killAndHide(e)
        continue
      }
      const dy = e.y - this.playerY
      if (laneOf(e.x) === this.lane && Math.abs(dy) < ENERGY.pickupRadius) {
        this.collect(e)
      } else if (dy > ENERGY.pickupRadius && !e.getData('missed')) {
        // Deixou passar um núcleo: o combo zera.
        e.setData('missed', true)
        this.combo = 0
      }
    }
  }

  private collect(e: Phaser.GameObjects.Image): void {
    this.combo += 1
    const multiplier = comboMultiplier(this.combo - 1)
    const points = Math.round(SCORE.energy * multiplier)
    this.bonusPoints += points
    this.energyCollected += 1
    this.sparks.explode(undefined, e.x, e.y)
    this.showPopup(e.x, e.y, `+${points}`)
    this.energies.killAndHide(e)
    sfx.play('collect')
  }

  private showPopup(x: number, y: number, label: string): void {
    const t = this.popups.get(x, y) as Phaser.GameObjects.Text | null
    if (!t) return
    t.setText(label)
      .setStyle({ fontFamily: 'system-ui, sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ffd23f' })
      .setOrigin(0.5)
      .setDepth(30)
      .setAlpha(1)
      .setActive(true)
      .setVisible(true)
    this.tweens.add({
      targets: t,
      y: y - 46,
      alpha: 0,
      duration: 520,
      ease: 'Quad.easeOut',
      onComplete: () => this.popups.killAndHide(t),
    })
  }

  private crash(): void {
    this.alive = false // congela a simulação
    this.playerTween?.stop()
    this.tweens.killTweensOf(this.player)
    this.player.setTint(COLORS.crash).setScale(1.25)
    this.debris.explode(undefined, this.player.x, this.player.y)
    sfx.play('crash')
    if (!this.run.reducedMotion) {
      this.cameras.main.shake(180, 0.012)
      this.cameras.main.flash(120, 255, 61, 110)
    }
    const result = {
      mode: this.run.mode,
      score: this.currentScore(),
      survivedSeconds: Math.floor(this.elapsed),
      energyCollected: this.energyCollected,
    }
    this.time.delayedCall(TIMING.gameOverDelayMs, () => this.callbacks.onGameOver(result))
  }

  // ---------------------------------------------------------------- score

  /** Pontuação sempre inteira e nunca negativa. */
  private currentScore(): number {
    return Math.max(0, Math.floor(this.survivalPoints) + this.bonusPoints)
  }

  private emitScore(): void {
    const score = this.currentScore()
    const multiplier = comboMultiplier(this.combo)
    if (score === this.lastEmittedScore && multiplier === this.lastEmittedMultiplier) return
    this.lastEmittedScore = score
    this.lastEmittedMultiplier = multiplier
    this.callbacks.onScore({ score, multiplier })
  }

  // ---------------------------------------------------------------- visuais

  private drawLanes(): void {
    const g = this.add.graphics()
    const half = LANES.width / 2
    for (const x of LANES.x) {
      g.fillStyle(COLORS.laneFill, 0.85)
      g.fillRect(x - half, 0, LANES.width, this.worldHeight)
      g.lineStyle(2, COLORS.lane, 0.55)
      g.lineBetween(x - half, 0, x - half, this.worldHeight)
      g.lineBetween(x + half, 0, x + half, this.worldHeight)
    }
    // Linha do jogador: referência discreta de onde as colisões acontecem.
    g.lineStyle(1, COLORS.lane, 0.35)
    g.lineBetween(LANES.x[0] - half, this.playerY, LANES.x[1] + half, this.playerY)
  }

  /** Gera as texturas com formas geométricas — nenhum asset externo necessário. */
  private createTextures(): void {
    if (this.textures.exists(TEX.player)) return
    const g = this.make.graphics({ x: 0, y: 0 }, false)

    // Jogador: núcleo circular com anel.
    const ps = 64
    const pc = ps / 2
    g.fillStyle(COLORS.player, 0.14).fillCircle(pc, pc, PLAYER.radius + 10)
    g.fillStyle(COLORS.player, 0.22).fillCircle(pc, pc, PLAYER.radius + 4)
    g.lineStyle(3, COLORS.playerRing, 1).strokeCircle(pc, pc, PLAYER.radius)
    g.fillStyle(COLORS.player, 1).fillCircle(pc, pc, PLAYER.radius * 0.58)
    g.fillStyle(0xffffff, 0.9).fillCircle(pc - 3, pc - 3, 3)
    g.generateTexture(TEX.player, ps, ps)
    g.clear()

    // Obstáculo: barreira retangular com listras de alerta (forma ≠ coletável).
    const pad = 6
    const ow = OBSTACLE.width
    const oh = OBSTACLE.height
    g.fillStyle(COLORS.obstacle, 0.18).fillRoundedRect(0, 0, ow + pad * 2, oh + pad * 2, 8)
    g.fillStyle(COLORS.obstacle, 1).fillRoundedRect(pad, pad, ow, oh, 4)
    // Três setas escuras apontando para baixo (direção do perigo).
    g.fillStyle(COLORS.background, 0.6)
    for (let i = 1; i <= 3; i++) {
      const cx = pad + (ow * i) / 4
      g.fillTriangle(cx - 8, pad + 9, cx + 8, pad + 9, cx, pad + oh - 9)
    }
    g.lineStyle(2, COLORS.obstacleEdge, 0.9).strokeRoundedRect(pad, pad, ow, oh, 4)
    g.generateTexture(TEX.obstacle, ow + pad * 2, oh + pad * 2)
    g.clear()

    // Energia: losango dourado.
    const es = 48
    const ec = es / 2
    const r = ENERGY.size / 2
    g.fillStyle(COLORS.energy, 0.2).fillPoints(diamond(ec, ec, r + 8), true)
    g.fillStyle(COLORS.energy, 1).fillPoints(diamond(ec, ec, r), true)
    g.fillStyle(0xffffff, 0.75).fillPoints(diamond(ec, ec, r * 0.4), true)
    g.generateTexture(TEX.energy, es, es)
    g.clear()

    // Partícula.
    g.fillStyle(0xffffff, 1).fillCircle(4, 4, 4)
    g.generateTexture(TEX.spark, 8, 8)
    g.clear()

    // Grade de fundo (tile).
    const gs = 40
    g.fillStyle(COLORS.background, 1).fillRect(0, 0, gs, gs)
    g.lineStyle(1, COLORS.grid, 1)
    g.lineBetween(0, 0, gs, 0)
    g.lineBetween(0, 0, 0, gs)
    g.generateTexture(TEX.grid, gs, gs)
    g.destroy()
  }

  // ---------------------------------------------------------------- limpeza

  private cleanup(): void {
    this.input.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointer, this)
    this.input.keyboard?.off('keydown', this.handleKey, this)
    this.time.removeAllEvents()
    this.tweens.killAll()
    this.playerTween = undefined
  }
}

function laneOf(x: number): Lane {
  return x < WORLD.width / 2 ? 0 : 1
}

/** Multiplicador do bônus de energia para um combo (0 = sem combo). */
export function comboMultiplier(combo: number): number {
  return Math.min(1 + combo * SCORE.comboStep, SCORE.comboMax)
}

function diamond(cx: number, cy: number, r: number): Phaser.Math.Vector2[] {
  return [
    new Phaser.Math.Vector2(cx, cy - r),
    new Phaser.Math.Vector2(cx + r, cy),
    new Phaser.Math.Vector2(cx, cy + r),
    new Phaser.Math.Vector2(cx - r, cy),
  ]
}
