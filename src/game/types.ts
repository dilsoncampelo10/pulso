export type GameState = 'menu' | 'playing' | 'gameOver'
export type GameMode = 'endless' | 'daily'
export type Lane = 0 | 1

/** Um evento de spawn: no máximo um obstáculo e/ou um núcleo de energia. */
export interface SpawnPattern {
  index: number
  obstacleLane: Lane | null
  energyLane: Lane | null
}

/** Configuração de uma partida, enviada pelo Vue para a cena Phaser. */
export interface RunConfig {
  mode: GameMode
  seed: string
  soundEnabled: boolean
  reducedMotion: boolean
}

export interface ScoreUpdate {
  score: number
  multiplier: number
}

export interface RunResult {
  mode: GameMode
  score: number
  survivedSeconds: number
  energyCollected: number
}

/** Eventos tipados da cena para a interface Vue. */
export interface GameCallbacks {
  onScore: (update: ScoreUpdate) => void
  onGameOver: (result: RunResult) => void
}
