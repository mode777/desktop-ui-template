// @vitest-environment node
import { describe, expect, it } from 'vitest'

import {
  COMPONENT_ORDER,
  aggregateProblems,
  componentStylesheets,
  extractImports,
  facadeStyleProblems,
  formatStyleViolation,
  indexProblems,
  missingComponentStyleExports,
  missingExportTargets,
  selectorViolations,
  sourceStyleImports,
  styleSubsetProblems,
} from './styles.mjs'

const BASE_FILES = ['index.css', 'tokens.css', 'global.css', 'workbench.css']

function aggregateFor(files) {
  return files.map((file) => `@import './${file}';`).join('\n')
}

function stylesManifest(componentFiles = COMPONENT_ORDER) {
  return {
    exports: {
      '.': './src/index.css',
      './index.css': './src/index.css',
      './tokens.css': './src/tokens.css',
      './global.css': './src/global.css',
      './workbench.css': './src/workbench.css',
      ...Object.fromEntries(componentFiles.map((file) => [`./${file}`, `./src/${file}`])),
    },
  }
}

function facadeManifest(componentFiles = COMPONENT_ORDER) {
  return {
    exports: {
      './styles': './dist/styles/index.css',
      './styles/index.css': './dist/styles/index.css',
      './styles/tokens.css': './dist/styles/tokens.css',
      './styles/global.css': './dist/styles/global.css',
      './styles/workbench.css': './dist/styles/workbench.css',
      ...Object.fromEntries(
        componentFiles.map((file) => [`./styles/${file}`, `./dist/styles/${file}`]),
      ),
    },
  }
}

describe('componentStylesheets', () => {
  it('keeps component files and excludes token, base and aggregate files', () => {
    expect(componentStylesheets([...BASE_FILES, ...COMPONENT_ORDER, 'notes.txt'])).toEqual(
      [...COMPONENT_ORDER].sort(),
    )
  })
})

describe('extractImports', () => {
  it('reads quoted and url() imports', () => {
    expect(
      extractImports(
        "@import './shell.css';\n@import url(./panel.css);\n.workbench { display: flex; }",
      ),
    ).toEqual(['./shell.css', './panel.css'])
  })
})

describe('aggregateProblems', () => {
  it('accepts the complete ordered aggregate', () => {
    expect(aggregateProblems(aggregateFor(COMPONENT_ORDER), COMPONENT_ORDER)).toEqual([])
  })

  it('reports a missing or duplicated component import', () => {
    const missing = aggregateFor(COMPONENT_ORDER.filter((file) => file !== 'panel.css'))
    const duplicate = aggregateFor(['shell.css', 'shell.css', ...COMPONENT_ORDER.slice(1)])

    expect(aggregateProblems(missing, COMPONENT_ORDER)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'missing-aggregate-import', file: 'panel.css' }),
      ]),
    )
    expect(aggregateProblems(duplicate, COMPONENT_ORDER)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'duplicate-aggregate-import', file: 'shell.css' }),
      ]),
    )
  })

  it('reports a wrong order and an unknown import', () => {
    const reversed = aggregateFor([...COMPONENT_ORDER].reverse())

    expect(aggregateProblems(reversed, COMPONENT_ORDER)).toEqual(
      expect.arrayContaining([expect.objectContaining({ rule: 'aggregate-order' })]),
    )
    expect(aggregateProblems("@import './tokens.css';", COMPONENT_ORDER)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'unknown-aggregate-import', file: 'tokens.css' }),
      ]),
    )
  })
})

describe('indexProblems', () => {
  it('requires tokens, global and workbench in order', () => {
    expect(
      indexProblems("@import './tokens.css';\n@import './global.css';\n@import './workbench.css';"),
    ).toEqual([])
    expect(indexProblems("@import './global.css';\n@import './tokens.css';")).toEqual([
      expect.objectContaining({ rule: 'index-order' }),
    ])
  })
})

describe('manifest checks', () => {
  it('accepts matching styles and facade entries', () => {
    expect(missingComponentStyleExports(stylesManifest(), COMPONENT_ORDER)).toEqual([])
    expect(facadeStyleProblems(facadeManifest(), COMPONENT_ORDER)).toEqual([])
  })

  it('reports a missing styles-package export', () => {
    const manifest = stylesManifest(COMPONENT_ORDER.filter((file) => file !== 'panel.css'))

    expect(missingComponentStyleExports(manifest, COMPONENT_ORDER)).toEqual([
      expect.objectContaining({ rule: 'missing-component-export', subpath: './panel.css' }),
    ])
  })

  it('reports a missing or mis-targeted facade export', () => {
    const missing = facadeManifest(COMPONENT_ORDER.filter((file) => file !== 'panel.css'))
    const misTargeted = facadeManifest()
    misTargeted.exports['./styles/shell.css'] = './dist/styles/not-shell.css'

    expect(facadeStyleProblems(missing, COMPONENT_ORDER)).toEqual([
      expect.objectContaining({
        rule: 'missing-facade-style-export',
        subpath: './styles/panel.css',
      }),
    ])
    expect(facadeStyleProblems(misTargeted, COMPONENT_ORDER)).toEqual([
      expect.objectContaining({ rule: 'wrong-facade-style-target', subpath: './styles/shell.css' }),
    ])
  })

  it('reports export targets that do not exist', () => {
    expect(
      missingExportTargets(stylesManifest(), (target) => target === 'src/shell.css', 'styles'),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'missing-style-target', target: 'src/tokens.css' }),
      ]),
    )
  })
})

describe('selectorViolations', () => {
  it('finds demo view selectors in kit CSS', () => {
    expect(
      selectorViolations(
        '.explorer-view { color: red; }\n.workbench { display: flex; }',
        ['.explorer-'],
        'shell.css',
      ),
    ).toEqual([
      expect.objectContaining({
        rule: 'forbidden-selector',
        selector: '.explorer-view',
        file: 'shell.css',
      }),
    ])
    expect(
      selectorViolations('.workbench { display: flex; }', ['.explorer-'], 'shell.css'),
    ).toEqual([])
  })

  it('formats a violation with its location', () => {
    expect(
      formatStyleViolation({
        rule: 'missing-component-export',
        subpath: './panel.css',
        message: 'Missing panel.',
      }),
    ).toBe('./panel.css  [missing-component-export]\n    Missing panel.')
  })
})

describe('application style subsets', () => {
  const source = [
    "import '@workbench-kit/styles-vscode/tokens.css'",
    "import '@workbench-kit/styles-vscode/global.css'",
    "import '@workbench-kit/styles-vscode/shell.css'",
    "import '@workbench-kit/styles-vscode/panel.css'",
  ].join('\n')
  const subset = { entries: ['tokens.css', 'global.css', 'shell.css'] }

  it('reads workspace stylesheet imports', () => {
    expect(sourceStyleImports(source)).toEqual([
      'tokens.css',
      'global.css',
      'shell.css',
      'panel.css',
    ])
    expect(sourceStyleImports("import '@workbench-kit/styles-vscode'")).toEqual(['index.css'])
  })

  it('reports missing and extra entries', () => {
    expect(styleSubsetProblems(source, subset, 'minimal')).toEqual([
      expect.objectContaining({
        rule: 'unexpected-app-style',
        entry: 'panel.css',
        label: 'minimal',
      }),
    ])
    expect(
      styleSubsetProblems("import '@workbench-kit/styles-vscode/tokens.css'", subset, 'minimal'),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'missing-app-style', entry: 'global.css' }),
        expect.objectContaining({ rule: 'missing-app-style', entry: 'shell.css' }),
      ]),
    )
  })

  it('calls out an aggregate import', () => {
    expect(
      styleSubsetProblems(
        "import '@workbench-kit/styles-vscode/workbench.css'",
        { entries: [] },
        'minimal',
      ),
    ).toEqual([
      expect.objectContaining({
        rule: 'unexpected-app-style',
        entry: 'workbench.css',
        message: expect.stringContaining('aggregate entry'),
      }),
    ])
  })
})
