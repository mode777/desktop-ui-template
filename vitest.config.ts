import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

import { workspaceAliases } from './vite.workspace.ts'

// Tests span the applications and the workspace packages, so the shared
// environment lives at the repository root instead of inside one application.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: workspaceAliases,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    css: false,
    restoreMocks: true,
  },
})
