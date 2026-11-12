import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = dirname(fileURLToPath(import.meta.url))

/**
 * Local development and tests resolve workspace packages to their source so a
 * clean checkout does not need a package build first. Packed consumers use the
 * `dist/` entry points declared in each package.json.
 */
export const workspaceAliases = [
  {
    find: /^@workbench-kit\/core$/,
    replacement: resolve(repoRoot, 'packages/core/src/index.ts'),
  },
  {
    find: /^@workbench-kit\/react$/,
    replacement: resolve(repoRoot, 'packages/react/src/index.ts'),
  },
  {
    find: /^@workbench-kit\/preset-vscode$/,
    replacement: resolve(repoRoot, 'packages/preset-vscode/src/index.ts'),
  },
  {
    find: /^@workbench-kit\/elements$/,
    replacement: resolve(repoRoot, 'packages/elements/src/all.ts'),
  },
  {
    find: /^@workbench-kit\/elements\/(.*)$/,
    replacement: resolve(repoRoot, 'packages/elements/src/$1.ts'),
  },
]
