import { describe, expect, it } from 'vitest'
import { ADS, claimAdRequest, resetAdRequests } from '../src/ads'
import { normalizeSiteUrl, sitePlugin } from '../build/sitePlugin'

describe('anúncios', () => {
  it('respeita o intervalo mínimo entre pedidos na mesma posição', () => {
    resetAdRequests()
    const t0 = 1_000_000
    expect(claimAdRequest('results', t0)).toBe(true)
    expect(claimAdRequest('results', t0 + 5_000)).toBe(false)
    expect(claimAdRequest('menu', t0 + 5_000)).toBe(true) // posições independentes
    expect(claimAdRequest('results', t0 + ADS.minSecondsBetweenRequests * 1000)).toBe(true)
  })

  it('banners cabem em celulares de 360px', () => {
    expect(ADS.sizes.menu.width).toBeLessThanOrEqual(328)
    expect(ADS.sizes.results.width).toBeLessThanOrEqual(328)
  })
})

describe('sitePlugin', () => {
  it('normaliza a URL do site', () => {
    expect(normalizeSiteUrl('https://pulso.pages.dev///')).toBe('https://pulso.pages.dev')
    expect(normalizeSiteUrl('')).toBe('https://pulso.pages.dev')
    expect(normalizeSiteUrl(undefined)).toBe('https://pulso.pages.dev')
  })

  it('recusa um ID de AdSense malformado', () => {
    expect(() => sitePlugin({ siteUrl: 'https://x.dev', pages: [''], adsenseClient: 'pub-123' })).toThrow()
  })

  it('não injeta AdSense sem ID', () => {
    const p = sitePlugin({ siteUrl: 'https://x.dev/', pages: [''] })
    const hook = p.transformIndexHtml as unknown as (html: string) => unknown
    expect(hook('<link href="__SITE_URL__/"><!--contact-->')).toBe('<link href="https://x.dev/">')
  })

  it('injeta meta e script do AdSense com ID', () => {
    const p = sitePlugin({ siteUrl: 'https://x.dev', pages: [''], adsenseClient: 'ca-pub-1234567890123456' })
    const hook = p.transformIndexHtml as unknown as (html: string) => { tags: { tag: string; attrs: Record<string, unknown> }[] }
    const tags = hook('').tags
    expect(tags.map((t) => t.tag)).toEqual(['meta', 'script'])
    expect(String(tags[1].attrs.src)).toContain('client=ca-pub-1234567890123456')
  })
})
