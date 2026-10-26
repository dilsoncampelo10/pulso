/**
 * Anúncios (Google AdSense) — somente banners fora da partida.
 *
 * Regras adotadas (políticas do AdSense contra cliques acidentais):
 * - Nenhum anúncio durante a partida nem antes de o jogador poder jogar.
 * - Pelo menos ADS.safeGap px entre o anúncio e qualquer botão ou a área de jogo.
 * - Um bloco novo só é pedido após uma ação do usuário (abrir menu/resultado)
 *   e no máximo a cada ADS.minSecondsBetweenRequests por posição.
 *
 * Tudo é desligado enquanto VITE_ADSENSE_CLIENT não estiver configurado.
 */

export type AdPlacement = 'menu' | 'results' | 'side'

export interface AdSize {
  width: number
  height: number
}

export const ADS = {
  /** Distância mínima (px CSS) entre anúncio e botões/área de jogo. */
  safeGap: 150,
  /** Intervalo mínimo entre pedidos de anúncio na mesma posição. */
  minSecondsBetweenRequests: 30,
  sizes: {
    menu: { width: 320, height: 50 },
    results: { width: 320, height: 50 },
    side: { width: 160, height: 600 },
  } satisfies Record<AdPlacement, AdSize>,
} as const

const env = import.meta.env
const client: string = env.VITE_ADSENSE_CLIENT ?? ''
const slots: Record<AdPlacement, string> = {
  menu: env.VITE_ADSENSE_SLOT_MENU ?? '',
  results: env.VITE_ADSENSE_SLOT_RESULTS ?? '',
  side: env.VITE_ADSENSE_SLOT_SIDE ?? '',
}

/** Caixas tracejadas no lugar dos anúncios, para testar o layout. */
export const adsPreview = ['1', 'true'].includes(String(env.VITE_ADS_PREVIEW ?? '').toLowerCase())

export const adsenseClient = client

export function adSlotId(placement: AdPlacement): string | null {
  return client && slots[placement] ? slots[placement] : null
}

export function isPlacementEnabled(placement: AdPlacement): boolean {
  return adsPreview || adSlotId(placement) !== null
}

const lastRequestAt: Partial<Record<AdPlacement, number>> = {}

/** Reserva um pedido de anúncio respeitando o intervalo mínimo por posição. */
export function claimAdRequest(placement: AdPlacement, now = Date.now()): boolean {
  const last = lastRequestAt[placement]
  if (last !== undefined && now - last < ADS.minSecondsBetweenRequests * 1000) return false
  lastRequestAt[placement] = now
  return true
}

/** Pede ao AdSense para preencher o <ins> recém-montado. Nunca lança erro. */
export function requestAd(): void {
  try {
    const w = window as unknown as { adsbygoogle?: unknown[] }
    ;(w.adsbygoogle = w.adsbygoogle || []).push({})
  } catch {
    // Bloqueador de anúncios ou script indisponível: o jogo segue normalmente.
  }
}

/** Para testes. */
export function resetAdRequests(): void {
  for (const k of Object.keys(lastRequestAt)) delete lastRequestAt[k as AdPlacement]
}
