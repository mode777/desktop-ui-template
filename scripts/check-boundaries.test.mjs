// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const scriptPath = fileURLToPath(new URL('./check-boundaries.mjs', import.meta.url))
const configPath = fileURLToPath(new URL('../boundaries.json', import.meta.url))

function write(root, path, code) {
  const absolutePath = join(root, path)
  mkdirSync(dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, code)
}

function run(repoRoot) {
  return spawnSync(
    process.execPath,
    [scriptPath, '--repo-root', repoRoot, '--config', configPath],
    {
      encoding: 'utf8',
    },
  )
}

describe('check-boundaries CLI', () => {
  it('passes a clean tree and reports the examined counts', () => {
    const root = mkdtempSync(join(tmpdir(), 'boundaries-cli-'))
    write(root, 'apps/template/src/demo/data/workspace.ts', 'export const workspace = {}\n')

    const result = run(root)

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Boundary check: 1 file, 0 imports')
    expect(result.stdout).toContain('✓ 0 violations')
  })

  it('fails a temporary fixture with a forbidden import and an unresolved import', () => {
    const root = mkdtempSync(join(tmpdir(), 'boundaries-cli-'))
    write(root, 'apps/template/src/app/App.tsx', 'export const App = () => null\n')
    write(root, 'apps/template/src/demo/data/workspace.ts', "import { App } from '../../app/App'\n")
    write(root, 'apps/template/src/demo/views/Broken.tsx', "import { missing } from '../missing'\n")
    copyFileSync(configPath, join(root, 'boundaries.json'))

    const result = run(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('2 violations in 2 files')
    expect(result.stderr).toContain('apps/template/src/demo/data/workspace.ts:1')
    expect(result.stderr).toContain('apps/template/src/demo/views/Broken.tsx:1')
    expect(result.stderr).toContain('[layer-not-allowed]')
    expect(result.stderr).toContain('[unresolved-relative-import]')
  })

  it('scans the example root but not its build configuration', () => {
    const root = mkdtempSync(join(tmpdir(), 'boundaries-cli-'))
    write(
      root,
      'apps/minimal/src/App.tsx',
      "import { WorkbenchShell } from '@workbench-kit/react'\n",
    )
    write(root, 'packages/react/src/index.ts', 'export const WorkbenchShell = () => null\n')
    write(root, 'apps/minimal/vite.config.ts', "import { resolve } from 'node:path'\n")
    copyFileSync(configPath, join(root, 'boundaries.json'))

    const result = run(root)

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Boundary check: 2 files, 1 import')
    expect(result.stdout).toContain('✓ 0 violations')
  })

  it('fails a relative import into another package', () => {
    const root = mkdtempSync(join(tmpdir(), 'boundaries-cli-'))
    write(
      root,
      'apps/minimal/src/App.tsx',
      "import { WorkbenchShell } from '../../../packages/react/src/index'\n",
    )
    write(root, 'packages/react/src/index.ts', 'export const WorkbenchShell = () => null\n')
    copyFileSync(configPath, join(root, 'boundaries.json'))

    const result = run(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('package-relative-import')
    expect(result.stderr).toContain('@workbench-kit/react')
  })

  it('fails a forbidden workspace package import', () => {
    const root = mkdtempSync(join(tmpdir(), 'boundaries-cli-'))
    write(root, 'packages/core/src/leak.ts', "import '@workbench-kit/preset-vscode'\n")
    write(root, 'packages/preset-vscode/src/index.ts', 'export {}\n')
    copyFileSync(configPath, join(root, 'boundaries.json'))

    const result = run(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('layer-not-allowed')
    expect(result.stderr).toContain('@workbench-kit/preset-vscode')
  })
})
