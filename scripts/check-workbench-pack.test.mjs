// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it } from 'vitest'

const scriptPath = fileURLToPath(new URL('./check-workbench-pack.mjs', import.meta.url))
const roots = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function write(root, path, content) {
  const file = join(root, path)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
}

function fixturePackage() {
  const root = mkdtempSync(join(tmpdir(), 'pack-cli-'))
  roots.push(root)

  write(
    root,
    'package.json',
    `${JSON.stringify(
      {
        name: '@workbench-kit/workbench',
        version: '0.1.0',
        private: false,
        type: 'module',
        files: ['dist', 'docs', 'AGENTS.md', 'llms.txt', 'LICENSE', 'THIRD_PARTY_NOTICES.md'],
        exports: {
          '.': {
            types: './dist/preset/index.d.ts',
            import: './dist/preset/index.js',
            default: './dist/preset/index.js',
          },
          './react': {
            types: './dist/react/index.d.ts',
            import: './dist/react/index.js',
            default: './dist/react/index.js',
          },
          './core': {
            types: './dist/core/index.d.ts',
            import: './dist/core/index.js',
            default: './dist/core/index.js',
          },
          './elements/all': {
            types: './dist/elements/all.d.ts',
            import: './dist/elements/all.js',
            default: './dist/elements/all.js',
          },
          './elements/types': {
            types: './dist/elements/global.d.ts',
          },
          './styles/tokens.css': './dist/styles/tokens.css',
        },
        peerDependencies: {
          '@vscode-elements/elements': '>=2.5.1 <3',
          react: '>=19',
          'react-dom': '>=19',
        },
        dependencies: {
          zustand: '^5.1.0',
        },
      },
      null,
      2,
    )}\n`,
  )
  write(root, 'README.md', '# Fixture package\n')
  write(root, 'AGENTS.md', '# Fixture agent guide\n')
  write(root, 'llms.txt', '# Fixture llms index\n')
  write(root, 'LICENSE', 'MIT\n')
  write(root, 'THIRD_PARTY_NOTICES.md', '# Fixture notices\n')
  write(root, 'docs/index.md', '# Fixture docs\n')
  write(root, 'docs/quickstart.md', '# Fixture quickstart\n')
  write(root, 'docs/manifest.json', '{ "pages": [] }\n')

  write(
    root,
    'dist/preset/index.js',
    'export const VSCodeWorkbench = 1\nexport const useWorkbenchStore = 1\nexport const defaultCommands = []\nexport const createCommandRegistry = () => ({})\n',
  )
  write(root, 'dist/preset/index.d.ts', 'export declare const VSCodeWorkbench: unknown\n')
  write(
    root,
    'dist/react/index.js',
    'export const WorkbenchShell = 1\nexport const TabStrip = 1\nexport const ResizablePane = 1\nexport const IconButton = 1\n',
  )
  write(root, 'dist/react/index.d.ts', 'export declare const WorkbenchShell: unknown\n')
  write(
    root,
    'dist/core/index.js',
    'export const clampSize = (value) => value\nexport const openTabIn = 1\nexport const readVersioned = 1\n',
  )
  write(root, 'dist/core/index.d.ts', 'export declare const clampSize: unknown\n')
  write(root, 'dist/elements/all.js', 'export {}\n')
  write(root, 'dist/elements/all.d.ts', 'export {}\n')
  write(root, 'dist/elements/global.d.ts', 'declare namespace JSX {}\n')
  write(root, 'dist/styles/tokens.css', ':root {}\n')

  return root
}

function run(root) {
  return spawnSync(process.execPath, [scriptPath, '--package-dir', root, '--no-build'], {
    encoding: 'utf8',
  })
}

describe('check-workbench-pack CLI', () => {
  it('fails with the missing export target path', () => {
    const root = fixturePackage()
    rmSync(join(root, 'dist/react/index.js'))

    const result = run(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('dist/react/index.js')
  })

  it('fails with the leaked app marker path', () => {
    const root = fixturePackage()
    write(
      root,
      'dist/preset/leak.js',
      "export const marker = 'apps/template/src/demo/ExplorerView'\n",
    )

    const result = run(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('dist/preset/leak.js')
    expect(result.stderr).toContain('apps/template/src/')
  })

  it('fails with the missing declaration path', () => {
    const root = fixturePackage()
    rmSync(join(root, 'dist/react/index.d.ts'))

    const result = run(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('dist/react/index.d.ts')
  })
})
