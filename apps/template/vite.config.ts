import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { workspaceAliases } from '../../vite.workspace.ts'

const appRoot = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(appRoot, '../..')

// `base: './'` keeps the build portable: it works at the repository root,
// on GitHub Pages project sites, and inside an iframe or embedded shell.
export default defineConfig({
  root: appRoot,
  base: './',
  publicDir: resolve(repoRoot, 'public'),
  plugins: [react()],
  resolve: {
    alias: workspaceAliases,
  },
  build: {
    outDir: resolve(appRoot, 'dist'),
    emptyOutDir: true,
    // vscode-elements + Lit form a single vendor chunk; the app shell itself is
    // small. Keep the warning threshold above the known vendor size.
    chunkSizeWarningLimit: 700,
  },
})
