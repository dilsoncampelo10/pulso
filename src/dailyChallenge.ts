import { ALGORITHM_VERSION } from './game/config'

/**
 * Data LOCAL do dispositivo no formato YYYY-MM-DD.
 * (Não usar toISOString(), que converte para UTC e muda o dia à noite no Brasil.)
 *
 * Observação: sem servidor, a data do aparelho pode ser alterada — o desafio
 * diário é casual e compartilhável, não competitivo de forma verificável.
 */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Seed do desafio diário: versão do algoritmo + data + modo. */
export function dailySeed(dateKey: string): string {
  return `${ALGORITHM_VERSION}:${dateKey}:daily`
}

/** Seed aleatória do modo infinito (pode usar Math.random). */
export function endlessSeed(): string {
  return `${ALGORITHM_VERSION}:endless:${Date.now().toString(36)}:${Math.random().toString(36).slice(2)}`
}

/** "2026-10-26" -> "26/10/2026" */
export function formatDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-')
  return `${d}/${m}/${y}`
}
