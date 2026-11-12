// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { inspectBundle, inspectStyles, LEAK_MARKERS } from './bundle-composition.mjs'

const manifest = {
  'index.html': {
    file: 'assets/index-abc.js',
    src: 'index.html',
    isEntry: true,
    css: ['assets/index-abc.css'],
  },
}

const cleanModules = [
  '/repo/apps/minimal/src/App.tsx',
  '/repo/apps/minimal/src/main.tsx',
  '/repo/packages/core/src/layout/resize.ts',
  '/repo/packages/react/src/TabStrip.tsx',
  '/repo/node_modules/react/index.js',
]

const cleanScripts = [
  { name: 'assets/index-abc.js', text: 'const kit = "workbench shell"; console.log(kit)' },
]

describe('inspectBundle', () => {
  it('passes a clean bundle and reports what it examined', () => {
    const result = inspectBundle({ manifest, modules: cleanModules, scripts: cleanScripts })

    expect(result.violations).toEqual([])
    expect(result.moduleCount).toBe(cleanModules.length)
    expect(result.assetCount).toBe(1)
    expect(result.entry).toBe('index.html')
  })

  it('rejects a demo, app or preset module in the inventory', () => {
    const result = inspectBundle({
      manifest,
      modules: [
        '/repo/apps/minimal/src/App.tsx',
        '/repo/apps/template/src/demo/data/workspace.ts',
        '../../apps/template/src/app/App.tsx',
        '/repo/packages/preset-vscode/src/index.ts',
      ],
      scripts: cleanScripts,
    })

    const modules = result.violations
      .filter((violation) => violation.rule === 'forbidden-module')
      .map((violation) => violation.module)

    expect(modules).toHaveLength(3)
    expect(modules.join('\n')).toContain('apps/template/src/demo/data/workspace.ts')
    expect(modules.join('\n')).toContain('apps/template/src/app/App.tsx')
    expect(modules.join('\n')).toContain('packages/preset-vscode/src/index.ts')
  })

  it('rejects a forbidden module listed only in the manifest', () => {
    const result = inspectBundle({
      manifest: {
        'index.html': {
          ...manifest['index.html'],
          modules: { 'apps/template/src/demo/views/TerminalView.tsx': { renderedLength: 10 } },
        },
      },
      modules: ['/repo/apps/minimal/src/App.tsx'],
      scripts: cleanScripts,
    })

    expect(result.violations).toEqual([expect.objectContaining({ rule: 'forbidden-module' })])
  })

  it('uses the target label in forbidden-module messages', () => {
    const result = inspectBundle({
      manifest,
      modules: ['/repo/apps/template/src/app/App.tsx'],
      scripts: cleanScripts,
      label: 'custom-shell',
    })

    expect(result.violations[0].message).toContain('custom-shell bundle')
  })

  it('rejects demo and preset UI markers even when paths are hidden', () => {
    const script = { name: 'assets/index-abc.js', text: LEAK_MARKERS.join(' ') }
    const result = inspectBundle({ manifest, modules: cleanModules, scripts: [script] })

    const markers = result.violations
      .filter((violation) => violation.rule === 'forbidden-marker')
      .map((violation) => violation.marker)

    expect(markers).toEqual(LEAK_MARKERS)
    expect(result.violations.every((violation) => violation.asset === script.name)).toBe(true)
  })

  it('fails when the manifest is missing', () => {
    const result = inspectBundle({ manifest: null, modules: cleanModules, scripts: cleanScripts })

    expect(result.violations).toEqual([expect.objectContaining({ rule: 'missing-manifest' })])
  })

  it('fails when the manifest does not contain the expected entry', () => {
    const result = inspectBundle({
      manifest: { 'other.html': { file: 'assets/other.js', src: 'other.html', isEntry: true } },
      modules: cleanModules,
      scripts: cleanScripts,
    })

    expect(result.violations).toEqual([expect.objectContaining({ rule: 'missing-entry' })])
  })

  it('fails when the module inventory is empty', () => {
    const result = inspectBundle({ manifest, modules: [], scripts: cleanScripts })

    expect(result.violations).toEqual([expect.objectContaining({ rule: 'missing-modules' })])
  })
})

describe('inspectStyles', () => {
  const cleanStyles = [
    {
      name: 'assets/index-abc.css',
      text: '.workbench { display: flex; }\n.statusbar { height: 22px; }',
    },
  ]

  it('passes a stylesheet without forbidden region rules', () => {
    expect(
      inspectStyles({ styles: cleanStyles, forbiddenSelectors: ['.activitybar', '.panel'] }),
    ).toEqual({ violations: [], assetCount: 1 })
  })

  it('rejects a forbidden region selector', () => {
    const result = inspectStyles({
      styles: [{ name: 'assets/index-abc.css', text: '.activitybar { width: 48px; }' }],
      forbiddenSelectors: ['.activitybar'],
      label: 'minimal',
    })

    expect(result.violations).toEqual([
      expect.objectContaining({
        rule: 'forbidden-style-selector',
        asset: 'assets/index-abc.css',
        selector: '.activitybar',
        prefix: '.activitybar',
      }),
    ])
  })

  it('fails when the style config has no selector list', () => {
    expect(inspectStyles({ styles: cleanStyles, label: 'minimal' }).violations).toEqual([
      expect.objectContaining({ rule: 'missing-style-config' }),
    ])
  })
})
