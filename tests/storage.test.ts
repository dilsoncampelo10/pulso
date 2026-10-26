import { describe, expect, it } from 'vitest'
import {
  DAILY_HISTORY_LIMIT,
  STORAGE_KEY,
  defaultSave,
  loadSave,
  pruneDaily,
  recordResult,
  writeSave,
  type StorageLike,
} from '../src/storage'

function memoryStorage(initial?: string): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>()
  if (initial !== undefined) data.set(STORAGE_KEY, initial)
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  }
}

describe('storage', () => {
  it('usa padrões quando não há nada salvo', () => {
    expect(loadSave(memoryStorage())).toEqual(defaultSave())
  })

  it('não quebra com JSON inválido', () => {
    expect(loadSave(memoryStorage('{oops'))).toEqual(defaultSave())
  })

  it('não quebra sem localStorage disponível', () => {
    expect(loadSave(null)).toEqual(defaultSave())
    expect(writeSave(defaultSave(), null)).toBe(false)
  })

  it('não quebra se setItem lançar erro (cota cheia)', () => {
    const s: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(writeSave(defaultSave(), s)).toBe(false)
  })

  it('corrige campos inválidos', () => {
    const raw = JSON.stringify({ bestScore: -5, dailyBest: { 'não-data': 10, '2026-10-26': 99.7 }, soundEnabled: 'sim' })
    const save = loadSave(memoryStorage(raw))
    expect(save.bestScore).toBe(0)
    expect(save.dailyBest).toEqual({ '2026-10-26': 99 })
    expect(save.soundEnabled).toBe(true)
  })

  it('persiste e recarrega', () => {
    const st = memoryStorage()
    const save = { ...defaultSave(), bestScore: 8420, soundEnabled: false }
    expect(writeSave(save, st)).toBe(true)
    expect(loadSave(st)).toEqual(save)
  })

  it(`mantém só os últimos ${DAILY_HISTORY_LIMIT} dias`, () => {
    const map: Record<string, number> = {}
    for (let d = 1; d <= 40; d++) map[`2026-09-${String(d).padStart(2, '0')}`] = d
    const pruned = pruneDaily(map)
    expect(Object.keys(pruned)).toHaveLength(DAILY_HISTORY_LIMIT)
    expect(pruned['2026-09-40']).toBe(40)
    expect(pruned['2026-09-01']).toBeUndefined()
  })
})

describe('recordResult', () => {
  it('atualiza recorde pessoal apenas quando supera', () => {
    const base = { ...defaultSave(), bestScore: 100 }
    expect(recordResult(base, 'endless', 90, '2026-10-26').newBest).toBe(false)
    const r = recordResult(base, 'endless', 150.9, '2026-10-26')
    expect(r.newBest).toBe(true)
    expect(r.save.bestScore).toBe(150)
  })

  it('salva o melhor resultado do dia no modo diário', () => {
    let save = defaultSave()
    let r = recordResult(save, 'daily', 300, '2026-10-26')
    expect(r.newDailyBest).toBe(true)
    save = r.save
    r = recordResult(save, 'daily', 200, '2026-10-26')
    expect(r.newDailyBest).toBe(false)
    expect(r.save.dailyBest['2026-10-26']).toBe(300)
  })

  it('modo infinito não altera o histórico diário', () => {
    const r = recordResult(defaultSave(), 'endless', 500, '2026-10-26')
    expect(r.save.dailyBest).toEqual({})
  })

  it('não muta o save original', () => {
    const base = defaultSave()
    recordResult(base, 'daily', 10, '2026-10-26')
    expect(base).toEqual(defaultSave())
  })
})
