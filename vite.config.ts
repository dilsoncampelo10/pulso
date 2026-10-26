/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// `base` relativo ('./') faz a build funcionar tanto na raiz de um domínio
// quanto em um subdiretório (ex.: GitHub Pages em /<repo>/).
// Para forçar um caminho absoluto: VITE_BASE=/pulso/ npm run build
export default defineConfig({
  base: process.env.VITE_BASE ?? './',
  plugins: [vue()],
  build: {
    target: 'es2020',
    // O Phaser sozinho tem ~1.2 MB; fica em um chunk separado e cacheável.
    chunkSizeWarningLimit: 1600,
    rolldownOptions: {
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
})
