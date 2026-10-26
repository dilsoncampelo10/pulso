import type { Plugin } from 'vite'

/**
 * Plugin de build do PULSO:
 * - substitui __SITE_URL__ nos HTML pela URL pública (canônica, Open Graph, JSON-LD);
 * - injeta a meta de verificação e o script do AdSense SOMENTE se houver ID;
 * - gera robots.txt, sitemap.xml e ads.txt na pasta dist/.
 */

export interface SiteOptions {
  siteUrl: string
  pages: string[]
  adsenseClient?: string
  contactEmail?: string
}

const ADSENSE_CLIENT_RE = /^ca-pub-\d{10,20}$/

export function normalizeSiteUrl(url: string | undefined): string {
  const fallback = 'https://pulso.pages.dev'
  const value = (url ?? '').trim() || fallback
  return value.replace(/\/+$/, '')
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export function sitePlugin(options: SiteOptions): Plugin {
  const siteUrl = normalizeSiteUrl(options.siteUrl)
  const client = (options.adsenseClient ?? '').trim()
  const email = (options.contactEmail ?? '').trim()

  if (client && !ADSENSE_CLIENT_RE.test(client)) {
    throw new Error(`VITE_ADSENSE_CLIENT inválido: "${client}". Use o formato ca-pub-0000000000000000.`)
  }

  return {
    name: 'pulso-site',

    transformIndexHtml(html) {
      let out = html.replaceAll('__SITE_URL__', siteUrl)

      out = out.replace(
        '<!--contact-->',
        email
          ? `<p>Dúvidas ou pedidos sobre privacidade: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>.</p>`
          : '',
      )

      if (!client) return out
      return {
        html: out,
        tags: [
          { tag: 'meta', attrs: { name: 'google-adsense-account', content: client }, injectTo: 'head' },
          {
            tag: 'script',
            attrs: {
              async: true,
              src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`,
              crossorigin: 'anonymous',
            },
            injectTo: 'head',
          },
        ],
      }
    },

    generateBundle() {
      const today = new Date().toISOString().slice(0, 10)
      const urls = options.pages
        .map((p) => `  <url>\n    <loc>${siteUrl}/${p}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
        .join('\n')

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      })
      if (client) {
        // Linha padrão do Google para ads.txt (f08c47fec0942fa0 é o ID TAG do Google).
        this.emitFile({
          type: 'asset',
          fileName: 'ads.txt',
          source: `google.com, ${client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`,
        })
      }
    },
  }
}
