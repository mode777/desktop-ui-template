import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// `base: './'` keeps the build portable: it works at the repository root,
// on GitHub Pages project sites, and inside an iframe or embedded shell.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
  },
  build: {
    // vscode-elements + Lit form a single vendor chunk; the app shell itself is
    // small. Keep the warning threshold above the known vendor size.
    chunkSizeWarningLimit: 700,
  },
})
