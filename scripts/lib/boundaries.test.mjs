// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  checkBoundaries,
  formatViolations,
  globToRegExp,
  layerFor,
  specificityOf,
  workspacePackageForPath,
} from './boundaries.mjs'

const config = JSON.parse(readFileSync(new URL('../../boundaries.json', import.meta.url), 'utf8'))

const root = mkdtempSync(join(tmpdir(), 'boundaries-'))

function addSource(path, code) {
  const absolutePath = join(root, path)
  mkdirSync(dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, code)
  return { path, absolutePath, code }
}

function check(sources) {
  return checkBoundaries(sources, config, { repoRoot: root })
}

describe('globToRegExp', () => {
  it('matches directory wildcards, filename wildcards and nested test files', () => {
    expect(globToRegExp('packages/core/**').test('packages/core/a.ts')).toBe(true)
    expect(globToRegExp('packages/core/**').test('packages/react/a.ts')).toBe(false)
    expect(globToRegExp('apps/template/src/*.ts').test('apps/template/src/main.ts')).toBe(true)
    expect(globToRegExp('apps/template/src/*.ts').test('apps/template/src/app/main.ts')).toBe(false)
    expect(globToRegExp('**/*.test.tsx').test('apps/template/src/demo/views/a.test.tsx')).toBe(true)
  })
})

describe('specificityOf', () => {
  it('counts literal path segments', () => {
    expect(specificityOf('packages/core/**')).toBe(2)
    expect(specificityOf('apps/template/src/*.ts')).toBe(3)
    expect(specificityOf('**/*.test.ts')).toBe(0)
  })
})

describe('layerFor', () => {
  it('resolves workspace packages, app, demo and example files', () => {
    expect(layerFor('packages/core/layout.ts', config)?.name).toBe('kit-core')
    expect(layerFor('packages/react/Button.tsx', config)?.name).toBe('kit-react')
    expect(layerFor('packages/elements/icon.ts', config)?.name).toBe('kit-elements')
    expect(layerFor('packages/styles-vscode/src/tokens.css', config)?.name).toBe('kit-styles')
    expect(layerFor('packages/preset-vscode/store/workbench-store.ts', config)?.name).toBe(
      'kit-preset',
    )
    expect(layerFor('packages/workbench/src/index.ts', config)?.name).toBe('kit-workbench')
    expect(layerFor('apps/template/src/main.tsx', config)?.name).toBe('app')
    expect(layerFor('apps/template/src/app/App.tsx', config)?.name).toBe('app')
    expect(layerFor('apps/template/src/demo/views/ExplorerView.tsx', config)?.name).toBe('demo')
    expect(layerFor('apps/minimal/src/App.tsx', config)?.name).toBe('example-minimal')
    expect(layerFor('apps/custom-shell/src/App.tsx', config)?.name).toBe('example-custom-shell')
    expect(layerFor('apps/custom-shell/src/regions/TitleBar.tsx', config)?.name).toBe(
      'example-custom-shell',
    )
    expect(layerFor('packages/core/layout.test.ts', config)?.name).toBe('test')
  })

  it('leaves unknown directories unclassified', () => {
    expect(layerFor('apps/template/src/unknown/thing.ts', config)).toBeNull()
    expect(layerFor('tools/helper.ts', config)).toBeNull()
  })
})

describe('workspacePackageForPath', () => {
  it('maps package roots to the declared layer and package name', () => {
    expect(workspacePackageForPath('packages/core/src/index.ts', config)).toEqual({
      name: '@workbench-kit/core',
      layer: 'kit-core',
      root: 'packages/core',
    })
    expect(workspacePackageForPath('packages/preset-vscode/src/index.ts', config)?.layer).toBe(
      'kit-preset',
    )
    expect(workspacePackageForPath('packages/workbench/dist/core/index.js', config)).toEqual({
      name: 'vscode-workbench',
      layer: 'kit-workbench',
      root: 'packages/workbench',
    })
    expect(workspacePackageForPath('apps/template/src/app/App.tsx', config)).toBeNull()
  })
})

describe('checkBoundaries', () => {
  it('accepts the declared current edges, including demo → preset and preset → kit-react', () => {
    const result = check([
      addSource(
        'apps/template/src/demo/commands/commands.ts',
        "import { useWorkbenchStore } from '@workbench-kit/preset-vscode'\n",
      ),
      addSource(
        'packages/preset-vscode/src/components/Sidebar.tsx',
        "import { IconButton } from '@workbench-kit/react'\n",
      ),
      addSource(
        'packages/preset-vscode/src/index.ts',
        'export const useWorkbenchStore = () => null\n',
      ),
      addSource('packages/react/src/index.ts', 'export const IconButton = () => null\n'),
    ])

    expect(result.violations).toEqual([])
    expect(result.fileCount).toBe(4)
    expect(result.importCount).toBe(2)
  })

  it('rejects a kit-core module that imports React or another workspace package', () => {
    const result = check([
      addSource('packages/core/src/react-user.ts', "import { useState } from 'react'\n"),
      addSource('packages/core/src/cross.ts', "import { Button } from '@workbench-kit/react'\n"),
      addSource('packages/react/src/Button.tsx', 'export const Button = () => null\n'),
    ])

    expect(result.violations.map((violation) => violation.rule)).toEqual([
      'external-not-allowed',
      'layer-not-allowed',
    ])
    expect(result.violations[0].message).toContain(
      'kit-core may not import the external package react',
    )
    expect(result.violations[1].message).toContain(
      'kit-core may not import the workspace package @workbench-kit/react (kit-react)',
    )
    expect(result.violations[1].target).toBe('@workbench-kit/react')
  })

  it('rejects a forbidden app edge such as demo → app', () => {
    const result = check([
      addSource(
        'apps/template/src/demo/data/workspace.ts',
        "import { App } from '../../app/App'\n",
      ),
      addSource('apps/template/src/app/App.tsx', 'export const App = () => null\n'),
    ])

    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]).toMatchObject({
      file: 'apps/template/src/demo/data/workspace.ts',
      line: 1,
      target: 'apps/template/src/app/App.tsx',
      rule: 'layer-not-allowed',
    })
  })

  it('allows example → kit-react but rejects example → preset, app and demo', () => {
    const result = check([
      addSource(
        'apps/minimal/src/App.tsx',
        "import { WorkbenchShell } from '@workbench-kit/react'\n",
      ),
      addSource(
        'apps/minimal/src/PresetLeak.tsx',
        "import { VSCodeWorkbench } from '@workbench-kit/preset-vscode'\n",
      ),
      addSource(
        'apps/minimal/src/AppLeak.tsx',
        "import { App } from '../../../apps/template/src/app/App'\n",
      ),
      addSource(
        'apps/minimal/src/DataLeak.tsx',
        "import { workspaceFiles } from '../../../apps/template/src/demo/data/workspace'\n",
      ),
      addSource('packages/react/src/index.ts', 'export const WorkbenchShell = () => null\n'),
      addSource(
        'packages/preset-vscode/src/index.ts',
        'export const VSCodeWorkbench = () => null\n',
      ),
      addSource('apps/template/src/app/App.tsx', 'export const App = () => null\n'),
      addSource('apps/template/src/demo/data/workspace.ts', 'export const workspaceFiles = []\n'),
    ])

    expect(result.violations).toHaveLength(3)
    expect(result.violations.map((violation) => violation.file)).toEqual([
      'apps/minimal/src/PresetLeak.tsx',
      'apps/minimal/src/AppLeak.tsx',
      'apps/minimal/src/DataLeak.tsx',
    ])
    expect(result.violations.every((violation) => violation.rule === 'layer-not-allowed')).toBe(
      true,
    )
    const crossApplication = result.violations.find((violation) =>
      violation.file.endsWith('AppLeak.tsx'),
    )
    expect(crossApplication?.message).toContain('example-minimal may not import app')
  })

  it('allows custom-shell → kit-react and rejects custom-shell → preset', () => {
    const result = check([
      addSource(
        'apps/custom-shell/src/App.tsx',
        "import { WorkbenchShell } from '@workbench-kit/react'\n",
      ),
      addSource(
        'apps/custom-shell/src/PresetLeak.tsx',
        "import { VSCodeWorkbench } from '@workbench-kit/preset-vscode'\n",
      ),
      addSource('packages/react/src/index.ts', 'export const WorkbenchShell = () => null\n'),
      addSource(
        'packages/preset-vscode/src/index.ts',
        'export const VSCodeWorkbench = () => null\n',
      ),
    ])

    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]).toMatchObject({
      file: 'apps/custom-shell/src/PresetLeak.tsx',
      line: 1,
      target: '@workbench-kit/preset-vscode',
      rule: 'layer-not-allowed',
    })
    expect(result.violations[0].message).toContain(
      'example-custom-shell may not import the workspace package @workbench-kit/preset-vscode (kit-preset)',
    )
  })

  it('rejects a relative import into another package', () => {
    const result = check([
      addSource('packages/react/src/use-core.ts', "import '../../core/src/index'\n"),
      addSource('packages/core/src/index.ts', 'export {}\n'),
    ])

    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]).toMatchObject({
      rule: 'package-relative-import',
      file: 'packages/react/src/use-core.ts',
    })
    expect(result.violations[0].message).toContain('@workbench-kit/core')
  })

  it('allows a relative import inside the same package', () => {
    const result = check([
      addSource('packages/core/src/a.ts', "import './b'\n"),
      addSource('packages/core/src/b.ts', 'export {}\n'),
    ])

    expect(result.violations).toEqual([])
  })

  it('allows a declared workspace subpath import', () => {
    const result = check([
      addSource('apps/minimal/src/elements.ts', "import '@workbench-kit/elements/icon'\n"),
      addSource('packages/elements/src/icon.ts', 'export {}\n'),
    ])

    expect(result.violations).toEqual([])
  })

  it('allows a facade subpath from the app but rejects facade implementation imports', () => {
    const allowed = check([
      addSource(
        'apps/template/src/app/facade.ts',
        "import { WorkbenchShell } from 'vscode-workbench/react'\n",
      ),
    ])

    expect(allowed.violations).toEqual([])

    const forbidden = check([
      addSource(
        'packages/workbench/src/index.ts',
        "import { VSCodeWorkbench } from '@workbench-kit/preset-vscode'\n",
      ),
    ])

    expect(forbidden.violations).toHaveLength(1)
    expect(forbidden.violations[0]).toMatchObject({
      file: 'packages/workbench/src/index.ts',
      target: '@workbench-kit/preset-vscode',
      rule: 'layer-not-allowed',
    })
    expect(forbidden.violations[0].message).toContain('kit-workbench may not import')
  })

  it('fails an unclassified path that has imports', () => {
    const result = check([
      addSource('apps/template/src/unknown/thing.ts', "import '../../demo/data/workspace'\n"),
      addSource('apps/template/src/demo/data/workspace.ts', 'export {}\n'),
    ])

    expect(result.violations).toHaveLength(1)
    expect(result.violations[0].rule).toBe('unclassified-path')
    expect(result.violations[0].file).toBe('apps/template/src/unknown/thing.ts')
  })

  it('reports unresolved relative imports with file and line', () => {
    const result = check([
      addSource(
        'apps/template/src/demo/views/Broken.tsx',
        'export const x = 1\n\nimport "../missing"\n',
      ),
    ])

    expect(result.violations[0]).toMatchObject({
      file: 'apps/template/src/demo/views/Broken.tsx',
      line: 3,
      rule: 'unresolved-relative-import',
    })
  })

  it('allows CSS assets and rejects Node built-ins', () => {
    const result = check([
      addSource('apps/template/src/app/App.tsx', "import '../demo/styles/demo-views.css'\n"),
      addSource('apps/template/src/demo/styles/demo-views.css', ''),
      addSource('apps/template/src/app/node.ts', "import fs from 'node:fs'\n"),
    ])

    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]).toMatchObject({ rule: 'builtin-import' })
  })

  it('formats violations with a file:line location and rule name', () => {
    const result = check([
      addSource('apps/template/src/demo/data/workspace.ts', "import '../../app/App'\n"),
      addSource('apps/template/src/app/App.tsx', 'export {}\n'),
    ])

    const output = formatViolations(result.violations)
    expect(output).toContain('apps/template/src/demo/data/workspace.ts:1')
    expect(output).toContain('apps/template/src/app/App.tsx')
    expect(output).toContain('[layer-not-allowed]')
  })
})
