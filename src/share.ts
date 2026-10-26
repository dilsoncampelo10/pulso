import { formatDateKey } from './dailyChallenge'
import type { GameMode } from './game/types'

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed'

/** URL pública do jogo: a canônica configurada (VITE_SITE_URL) ou a página atual. */
export function gameUrl(): string {
  const configured = (import.meta.env.VITE_SITE_URL ?? '').trim().replace(/\/+$/, '')
  if (configured) return `${configured}/`
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}${window.location.pathname}`
}

/** Mensagem honesta: nada de "ranking global" — o recorde é deste dispositivo. */
export function buildShareMessage(score: number, mode: GameMode, dateKey?: string): string {
  if (mode === 'daily' && dateKey) {
    return `Fiz ${score} pontos no desafio diário do PULSO (${formatDateKey(dateKey)})! Você consegue superar?`
  }
  return `Fiz ${score} pontos no PULSO! Você consegue superar meu recorde?`
}

/** Web Share API quando disponível; senão, copia para a área de transferência. */
export async function shareResult(text: string, url: string = gameUrl()): Promise<ShareOutcome> {
  const full = url ? `${text} ${url}` : text

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'PULSO', text, url: url || undefined })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
      // Outros erros: tenta copiar.
    }
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(full)
      return 'copied'
    }
  } catch {
    // segue para o fallback
  }

  // Fallback para navegadores antigos / contexto sem HTTPS.
  try {
    const ta = document.createElement('textarea')
    ta.value = full
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok ? 'copied' : 'failed'
  } catch {
    return 'failed'
  }
}
