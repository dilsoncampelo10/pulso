import { describe, expect, it } from 'vitest'
import { DIFFICULTY, OBSTACLE, PLAYER } from '../src/game/config'
import { easeSpeed, levelAt, spawnInterval, targetSpeed } from '../src/game/difficulty'

describe('dificuldade', () => {
  it('sobe de nível a cada 15 segundos', () => {
    expect(levelAt(0)).toBe(0)
    expect(levelAt(14.9)).toBe(0)
    expect(levelAt(15)).toBe(1)
    expect(levelAt(61)).toBe(4)
  })

  it('velocidade cresce e respeita o limite', () => {
    expect(targetSpeed(1)).toBeGreaterThan(targetSpeed(0))
    expect(targetSpeed(1000)).toBe(DIFFICULTY.maxSpeed)
  })

  it('intervalo diminui até o piso', () => {
    expect(spawnInterval(1)).toBeLessThan(spawnInterval(0))
    expect(spawnInterval(1000)).toBe(DIFFICULTY.minInterval)
  })

  it('a transição de velocidade é suave (sem saltos)', () => {
    const next = easeSpeed(300, 335, 1 / 60)
    expect(next).toBeGreaterThan(300)
    expect(next - 300).toBeLessThan(2)
  })

  it('sempre há tempo para trocar de trilho entre obstáculos consecutivos', () => {
    // Pior caso: obstáculos alternando de trilho no menor intervalo.
    for (let level = 0; level < 60; level++) {
      const speed = targetSpeed(level)
      const gapPx = speed * spawnInterval(level) - OBSTACLE.height - PLAYER.radius * 2
      const reactionSeconds = gapPx / speed
      expect(reactionSeconds).toBeGreaterThan(0.3)
    }
  })
})
