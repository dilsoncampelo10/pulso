/// <reference types="vitest/config" />
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { sitePlugin } from './build/sitePlugin'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    // `base` relativo ('./') funciona na raiz (Cloudflare Pages) e em subdiretórios.
    // Para forçar um caminho absoluto: VITE_BASE=/pulso/ npm run build
    base: process.env.VITE_BASE ?? './',
    plugins: [
      vue(),
      sitePlugin({
        siteUrl: env.VITE_SITE_URL,
        adsenseClient: env.VITE_ADSENSE_CLIENT,
        contactEmail: env.VITE_CONTACT_EMAIL,
        pages: ['', 'privacidade.html'],
      }),
    ],
    build: {
      target: 'es2020',
      // O Phaser sozinho tem ~1.2 MB; fica em um chunk separado, carregado
      // só quando o jogo começa (ou em segundo plano no menu).
      chunkSizeWarningLimit: 1600,
      rolldownOptions: {
        input: {
          main: resolve(import.meta.dirname, 'index.html'),
          privacidade: resolve(import.meta.dirname, 'privacidade.html'),
        },
        output: {
          codeSplitting: {
            groups: [{ name: 'phaser', test: /node_modules[\\/]phaser/ }],
          },
        },
      },
    },
    test: {
      include: ['tests/**/*.test.ts'],
    },
  }
})
