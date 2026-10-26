import { PATTERN_WEIGHTS } from './config'
import type { Rng } from './random'
import type { Lane, SpawnPattern } from './types'

/**
 * Gera a sequência de padrões de spawn a partir de um PRNG.
 *
 * Cada chamada consome SEMPRE o mesmo número de sorteios (2), independentemente
 * do resultado ou da dificuldade. Assim a sequência de padrões do desafio diário é
 * idêntica para todos, mesmo que o FPS ou o momento exato de cada spawn varie.
 *
 * Regra de justiça: nunca há obstáculos nos dois trilhos ao mesmo tempo, então
 * sempre existe uma rota segura.
 */
export function createPatternGenerator(rng: Rng) {
  let index = 0

  function next(): SpawnPattern {
    const laneRoll = rng()
    const kindRoll = rng()
    const lane: Lane = laneRoll < 0.5 ? 0 : 1
    const other: Lane = lane === 0 ? 1 : 0
    const i = index++

    if (kindRoll < PATTERN_WEIGHTS.obstacle) {
      return { index: i, obstacleLane: lane, energyLane: null }
    }
    if (kindRoll < PATTERN_WEIGHTS.obstacle + PATTERN_WEIGHTS.obstacleWithEnergy) {
      return { index: i, obstacleLane: lane, energyLane: other }
    }
    return { index: i, obstacleLane: null, energyLane: lane }
  }

  return { next }
}

export type PatternGenerator = ReturnType<typeof createPatternGenerator>
