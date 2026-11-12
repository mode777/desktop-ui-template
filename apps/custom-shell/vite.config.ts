import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { moduleInventoryPlugin } from '../../scripts/vite-module-inventory.mjs'
import { workspaceAliases } from '../../vite.workspace.ts'

const appRoot = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(appRoot, '../..')

// A separate entry so the custom-shell example can be measured and inspected
// without touching the template or minimal output.
export default defineConfig({
  root: appRoot,
  base: './',
  publicDir: resolve(repoRoot, 'public'),
  plugins: [react(), moduleInventoryPlugin()],
  resolve: {
    alias: workspaceAliases,
  },
  build: {
    outDir: resolve(appRoot, 'dist'),
    emptyOutDir: true,
    manifest: true,
    chunkSizeWarningLimit: 700,
  },
})
