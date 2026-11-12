// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { checkAdoption, inferLevel } from './adoption.mjs'

const created = []

function app(files) {
  const root = mkdtempSync(join(tmpdir(), 'workbench-adoption-'))
  created.push(root)

  for (const [path, content] of Object.entries(files)) {
    const destination = join(root, path)
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, content)
  }

  return root
}

const goodPackage = JSON.stringify({
  dependencies: {
    'vscode-workbench': '0.1.0',
    react: '^19.0.0',
    'react-dom': '^19.0.0',
    '@vscode-elements/elements': '^2.5.1',
  },
})

const goodSource = `import 'vscode-workbench/elements/icon'
import 'vscode-workbench/elements/tab-header'
import 'vscode-workbench/styles/tokens.css'
import 'vscode-workbench/styles/global.css'
import 'vscode-workbench/styles/shell.css'
import { WorkbenchShell } from 'vscode-workbench/react'

export function App() {
  return <WorkbenchShell><vscode-icon name="files" /><vscode-tab-header title="README" /></WorkbenchShell>
}
`

afterEach(() => {
  for (const root of created.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('inferLevel', () => {
  it('detects preset, composition and primitives', () => {
    expect(inferLevel([{ content: '<VSCodeWorkbench />' }])).toBe('preset')
    expect(inferLevel([{ content: '<WorkbenchShell />' }])).toBe('composition')
    expect(inferLevel([{ content: '<ResizablePane />' }])).toBe('primitives')
  })
})

describe('checkAdoption', () => {
  it('accepts a clean composition app', () => {
    const root = app({ 'package.json': goodPackage, 'src/main.tsx': goodSource })
    const report = checkAdoption({ appDir: root, packageManifest: { version: '0.1.0' } })

    expect(report.level).toBe('composition')
    expect(report.findings).toEqual([])
    expect(report.ok).toBe(true)
  })

  it('reports private imports and unregistered elements', () => {
    const root = app({
      'package.json': goodPackage,
      'src/main.tsx': `import '@workbench-kit/react'
import 'vscode-workbench/styles/tokens.css'
import 'vscode-workbench/styles/global.css'
import 'vscode-workbench/styles/shell.css'
export function App() { return <WorkbenchShell><vscode-icon name="files" /></WorkbenchShell> }
`,
    })
    const report = checkAdoption({ appDir: root, packageManifest: { version: '0.1.0' } })

    expect(report.findings.map((finding) => finding.rule)).toEqual(
      expect.arrayContaining(['private-import', 'unregistered-element']),
    )
  })

  it('reports missing base styles', () => {
    const root = app({
      'package.json': goodPackage,
      'src/main.tsx': `import 'vscode-workbench/elements/icon'
import 'vscode-workbench/styles/shell.css'
export function App() { return <WorkbenchShell><vscode-icon name="files" /></WorkbenchShell> }
`,
    })
    const report = checkAdoption({ appDir: root, packageManifest: { version: '0.1.0' } })

    expect(report.findings.filter((finding) => finding.rule === 'missing-base-style')).toHaveLength(
      2,
    )
  })

  it('reports preset and demo leaks in a composition app', () => {
    const root = app({
      'package.json': goodPackage,
      'src/main.tsx': `${goodSource}\nimport { useWorkbenchStore } from 'vscode-workbench'
export const store = useWorkbenchStore
`,
    })
    const report = checkAdoption({ appDir: root, packageManifest: { version: '0.1.0' } })

    expect(report.findings.map((finding) => finding.rule)).toContain('preset-leak')
  })

  it('reports version and peer problems', () => {
    const root = app({
      'package.json': JSON.stringify({
        dependencies: { 'vscode-workbench': '^0.2.0', react: '^18.0.0' },
      }),
      'src/main.tsx': goodSource,
    })
    const report = checkAdoption({ appDir: root, packageManifest: { version: '0.1.0' } })

    expect(report.findings.map((finding) => finding.rule)).toEqual(
      expect.arrayContaining(['version-mismatch', 'missing-peer', 'peer-version']),
    )
  })

  it('allows preset markers at the preset level', () => {
    const root = app({
      'package.json': goodPackage,
      'src/main.tsx': `import { VSCodeWorkbench, useWorkbenchStore } from 'vscode-workbench'
export const store = useWorkbenchStore
export function App() { return <VSCodeWorkbench /> }
`,
    })
    const report = checkAdoption({
      appDir: root,
      level: 'preset',
      packageManifest: { version: '0.1.0' },
    })

    expect(report.findings).toEqual([])
  })
})
