/**
 * Salvamento local do PULSO.
 *
 * IMPORTANTE: `localStorage` é específico deste navegador e deste dispositivo.
 * - Não sincroniza entre aparelhos nem entre navegadores diferentes.
 * - Pode ser apagado pelo usuário a qualquer momento (limpar dados do site,
 *   modo anônimo, limpeza automática do navegador).
 * - Pode estar indisponível ou cheio (cota, bloqueio por privacidade).
 * Por isso toda leitura/escrita tem valores padrão e nunca derruba o jogo.
 * Nenhum dado pessoal é guardado aqui.
 */

import type { GameMode } from './game/types'

export const STORAGE_KEY = 'pulso:save:v1'
export const SAVE_VERSION = 1
/** Quantos dias de desafio diário manter no histórico local. */
export const DAILY_HISTORY_LIMIT = 30

export interface SaveData {
  version: number
  bestScore: number
  /** Melhor pontuação por data `YYYY-MM-DD`. */
  dailyBest: Record<string, number>
  soundEnabled: boolean
  unlockedSkins: string[]
  selectedSkin: string
}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    bestScore: 0,
    dailyBest: {},
    soundEnabled: true,
    unlockedSkins: ['default'],
    selectedSkin: 'default',
  }
}

function getStorage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null // acesso bloqueado (ex.: cookies desativados)
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function toScore(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
}

/** Mantém apenas as `limit` datas mais recentes. */
export function pruneDaily(map: Record<string, number>, limit = DAILY_HISTORY_LIMIT): Record<string, number> {
  const keys = Object.keys(map).sort().reverse().slice(0, limit)
  const out: Record<string, number> = {}
  for (const k of keys.sort()) out[k] = map[k]
  return out
}

/** Converte qualquer valor (inclusive lixo) em um SaveData válido. */
export function sanitize(raw: unknown): SaveData {
  const base = defaultSave()
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Record<string, unknown>

  const daily: Record<string, number> = {}
  if (r.dailyBest && typeof r.dailyBest === 'object') {
    for (const [date, score] of Object.entries(r.dailyBest as Record<string, unknown>)) {
      if (DATE_RE.test(date)) daily[date] = toScore(score)
    }
  }

  const skins = Array.isArray(r.unlockedSkins)
    ? r.unlockedSkins.filter((s): s is string => typeof s === 'string')
    : base.unlockedSkins
  if (!skins.includes('default')) skins.unshift('default')
  const selected = typeof r.selectedSkin === 'string' && skins.includes(r.selectedSkin) ? r.selectedSkin : 'default'

  return {
    version: SAVE_VERSION,
    bestScore: toScore(r.bestScore),
    dailyBest: pruneDaily(daily),
    soundEnabled: typeof r.soundEnabled === 'boolean' ? r.soundEnabled : base.soundEnabled,
    unlockedSkins: skins,
    selectedSkin: selected,
  }
}

export function loadSave(storage: StorageLike | null = getStorage()): SaveData {
  if (!storage) return defaultSave()
  try {
    const text = storage.getItem(STORAGE_KEY)
    return text ? sanitize(JSON.parse(text)) : defaultSave()
  } catch {
    return defaultSave() // JSON inválido ou leitura bloqueada
  }
}

/** Retorna `false` se não foi possível salvar (o jogo continua normalmente). */
export function writeSave(data: SaveData, storage: StorageLike | null = getStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...data, dailyBest: pruneDaily(data.dailyBest) }))
    return true
  } catch {
    return false
  }
}

export interface RecordOutcome {
  save: SaveData
  newBest: boolean
  newDailyBest: boolean
}

/** Aplica o resultado de uma partida ao save (função pura; não grava). */
export function recordResult(save: SaveData, mode: GameMode, score: number, date: string): RecordOutcome {
  const s = Math.max(0, Math.floor(score))
  const next: SaveData = { ...save, dailyBest: { ...save.dailyBest } }
  const newBest = s > save.bestScore
  if (newBest) next.bestScore = s

  let newDailyBest = false
  if (mode === 'daily') {
    const prev = save.dailyBest[date] ?? 0
    newDailyBest = s > prev
    next.dailyBest[date] = Math.max(prev, s)
    next.dailyBest = pruneDaily(next.dailyBest)
  }
  return { save: next, newBest, newDailyBest }
}
