import { describe, expect, it } from 'vitest'
import { createPatternGenerator } from '../src/game/obstacles'
import { createRng, hashSeed } from '../src/game/random'
import { dailySeed, localDateKey } from '../src/dailyChallenge'

function sample(seed: string, n = 200): string {
  const gen = createPatternGenerator(createRng(seed))
  return Array.from({ length: n }, () => {
    const p = gen.next()
    return `${p.obstacleLane ?? '-'}${p.energyLane ?? '-'}`
  }).join(',')
}

describe('PRNG', () => {
  it('é determinístico para a mesma seed', () => {
    const a = createRng('pulso-v1:2026-10-26:daily')
    const b = createRng('pulso-v1:2026-10-26:daily')
    for (let i = 0; i < 1000; i++) expect(a()).toBe(b())
  })

  it('gera valores em [0, 1)', () => {
    const r = createRng('x')
    for (let i = 0; i < 10000; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('seeds de datas vizinhas geram hashes diferentes', () => {
    expect(hashSeed(dailySeed('2026-10-26'))).not.toBe(hashSeed(dailySeed('2026-10-27')))
  })
})

describe('Desafio diário', () => {
  it('a seed combina versão, data e modo', () => {
    expect(dailySeed('2026-10-26')).toBe('pulso-v1:2026-10-26:daily')
  })

  it('usa a data local, não UTC', () => {
    // 26/10/2026 às 23:30 no horário local continua sendo dia 26.
    expect(localDateKey(new Date(2026, 9, 26, 23, 30))).toBe('2026-10-26')
    expect(localDateKey(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05')
  })

  it('a mesma data produz a mesma sequência de obstáculos', () => {
    expect(sample(dailySeed('2026-10-26'))).toBe(sample(dailySeed('2026-10-26')))
  })

  it('datas diferentes produzem sequências diferentes', () => {
    expect(sample(dailySeed('2026-10-26'))).not.toBe(sample(dailySeed('2026-10-27')))
  })

  it('sequência de referência da versão pulso-v1 não muda sem querer', () => {
    // Se este teste quebrar, o desafio diário mudou para todos os jogadores:
    // incremente ALGORITHM_VERSION em vez de atualizar o valor esperado.
    expect(sample(dailySeed('2026-10-26'), 12)).toMatchInlineSnapshot(`"0-,0-,01,0-,1-,1-,0-,0-,1-,0-,0-,1-"`)
  })
})

describe('Padrões de spawn', () => {
  it('nunca coloca obstáculos nos dois trilhos e sempre deixa rota segura', () => {
    const gen = createPatternGenerator(createRng('fairness'))
    for (let i = 0; i < 5000; i++) {
      const p = gen.next()
      expect(p.obstacleLane === null || p.energyLane === null || p.obstacleLane !== p.energyLane).toBe(true)
      expect(p.obstacleLane !== null || p.energyLane !== null).toBe(true)
    }
  })

  it('distribui padrões nos dois trilhos', () => {
    const gen = createPatternGenerator(createRng('balance'))
    let left = 0
    const n = 4000
    for (let i = 0; i < n; i++) {
      const p = gen.next()
      if ((p.obstacleLane ?? p.energyLane) === 0) left++
    }
    expect(left / n).toBeGreaterThan(0.45)
    expect(left / n).toBeLessThan(0.55)
  })
})
