// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  extractImports,
  isAssetPath,
  isRelative,
  isSourceFile,
  lineForOffset,
  packageNameOf,
  resolveRelativeImport,
} from './import-graph.mjs'

describe('extractImports', () => {
  it('ignores import-looking text inside strings and comments', () => {
    const code = [
      '// import commented from "./commented"',
      'const doc = `import { fake } from "./fake-module"`',
      'const sample = "import other from \'../other\'"',
      'export const value = 1',
    ].join('\n')

    expect(extractImports(code, 'mock.ts')).toEqual([])
  })

  it('reports static, type-only, re-export and dynamic imports with line numbers', () => {
    const code = [
      "import { a } from './a'",
      "import type { B } from './b'",
      "export { c } from './c'",
      "export * from './d'",
      "const lazy = () => import('./e')",
    ].join('\n')

    expect(extractImports(code, 'module.ts')).toEqual([
      { specifier: './a', line: 1, kind: 'static' },
      { specifier: './b', line: 2, kind: 'static' },
      { specifier: './c', line: 3, kind: 'static' },
      { specifier: './d', line: 4, kind: 'static' },
      { specifier: './e', line: 5, kind: 'dynamic' },
    ])
  })

  it('parses TSX and JSX content', () => {
    const code =
      'import { View } from \'./View\'\nexport const App = () => <View title="x">hi</View>\n'

    expect(extractImports(code, 'App.tsx')).toEqual([
      { specifier: './View', line: 1, kind: 'static' },
    ])
  })

  it('handles the mock documents in apps/template/src/demo/data/workspace.ts without inventing edges', () => {
    const code = [
      'export const documents = {',
      "  'apps/template/src/app/App.tsx': `import { Workbench } from '../layout/Workbench'",
      "import { useWorkbenchStore } from '../store/workbench-store'`,",
      '}',
    ].join('\n')

    expect(extractImports(code, 'workspace.ts')).toEqual([])
  })
})

describe('lineForOffset', () => {
  it('counts one-based lines and handles multi-byte text by code unit', () => {
    const code = 'const é = 1\nimport x from "./x"\n'

    expect(lineForOffset(code, 0)).toBe(1)
    expect(lineForOffset(code, code.indexOf('import'))).toBe(2)
  })
})

describe('resolveRelativeImport', () => {
  const root = mkdtempSync(join(tmpdir(), 'boundaries-'))
  mkdirSync(join(root, 'dir'), { recursive: true })
  writeFileSync(join(root, 'a.ts'), '')
  writeFileSync(join(root, 'b.tsx'), '')
  writeFileSync(join(root, 'styles.css'), '')
  writeFileSync(join(root, 'dir', 'index.ts'), '')
  const from = join(root, 'main.ts')

  it('resolves extensions, index files and assets', () => {
    expect(resolveRelativeImport(from, './a')).toBe(join(root, 'a.ts'))
    expect(resolveRelativeImport(from, './b')).toBe(join(root, 'b.tsx'))
    expect(resolveRelativeImport(from, './dir')).toBe(join(root, 'dir', 'index.ts'))
    expect(resolveRelativeImport(from, './styles.css')).toBe(join(root, 'styles.css'))
  })

  it('returns null for a specifier that does not exist', () => {
    expect(resolveRelativeImport(from, './missing')).toBeNull()
  })
})

describe('helpers', () => {
  it('classifies source files and assets', () => {
    expect(isSourceFile('view.tsx')).toBe(true)
    expect(isSourceFile('types.d.ts')).toBe(false)
    expect(isSourceFile('style.css')).toBe(false)
    expect(isAssetPath('style.css')).toBe(true)
    expect(isAssetPath('data.json')).toBe(true)
    expect(isAssetPath('view.tsx')).toBe(false)
  })

  it('distinguishes relative specifiers', () => {
    expect(isRelative('./a')).toBe(true)
    expect(isRelative('../a')).toBe(true)
    expect(isRelative('react')).toBe(false)
    expect(isRelative('@scope/pkg')).toBe(false)
  })

  it('reduces specifiers to package names', () => {
    expect(packageNameOf('react')).toBe('react')
    expect(packageNameOf('zustand/middleware')).toBe('zustand')
    expect(packageNameOf('@vscode-elements/elements/dist/tabs')).toBe('@vscode-elements/elements')
  })
})
