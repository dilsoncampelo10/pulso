import { DIFFICULTY } from './config'

/** Nível atual a partir do tempo de partida (s). Começa em 0. */
export function levelAt(elapsedSeconds: number): number {
  return Math.max(0, Math.floor(elapsedSeconds / DIFFICULTY.levelEverySeconds))
}

/** Velocidade-alvo (px/s) do nível, limitada para manter o jogo legível. */
export function targetSpeed(level: number): number {
  return Math.min(DIFFICULTY.baseSpeed + level * DIFFICULTY.speedStep, DIFFICULTY.maxSpeed)
}

/** Intervalo entre spawns (s) do nível, com piso mínimo. */
export function spawnInterval(level: number): number {
  return Math.max(DIFFICULTY.baseInterval - level * DIFFICULTY.intervalStep, DIFFICULTY.minInterval)
}

/**
 * Aproxima suavemente a velocidade atual da alvo, para que a troca de nível
 * seja gradual e não um salto. Independente de FPS (usa dt).
 */
export function easeSpeed(current: number, target: number, dt: number): number {
  const t = 1 - Math.exp(-DIFFICULTY.speedEase * dt)
  return current + (target - current) * t
}
