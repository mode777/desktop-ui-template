// @vitest-environment node
import { describe, expect, it } from 'vitest'

import {
  FacadeBuildError,
  exportTargets,
  isFacadeFile,
  missingElementExports,
  missingStylesheetSources,
  missingTypesConditions,
  rewriteSpecifiers,
  stripSourceMapComments,
  stylesheetEntries,
  validateExportTargets,
} from './facade.mjs'

function rewrite(code, file, files) {
  return rewriteSpecifiers(code, file, {
    fileExists: (target) => files.includes(target),
  })
}

describe('isFacadeFile', () => {
  it('keeps distributable output and excludes maps, build metadata and test fixtures', () => {
    expect(isFacadeFile('preset/index.js')).toBe(true)
    expect(isFacadeFile('preset/index.d.ts')).toBe(true)
    expect(isFacadeFile('elements/global.d.ts')).toBe(true)
    expect(isFacadeFile('preset/index.d.ts.map')).toBe(false)
    expect(isFacadeFile('core/.tsbuildinfo')).toBe(false)
    expect(isFacadeFile('components/component-test-fixtures.js')).toBe(false)
    expect(isFacadeFile('components/Button.test.js')).toBe(false)
  })
})

describe('rewriteSpecifiers', () => {
  it('maps internal package imports to relative facade paths', () => {
    const files = ['core/index.js', 'react/index.js', 'elements/badge.js']

    expect(
      rewrite("import { IconButton } from '@workbench-kit/react'\n", 'preset/index.js', files),
    ).toBe("import { IconButton } from '../react/index.js'\n")

    expect(
      rewrite(
        "import { activateTabIn } from '@workbench-kit/core'\n",
        'preset/store/workbench-store.js',
        files,
      ),
    ).toBe("import { activateTabIn } from '../../core/index.js'\n")

    expect(rewrite("import '@workbench-kit/elements/badge'\n", 'preset/elements.js', files)).toBe(
      "import '../elements/badge.js'\n",
    )

    expect(
      rewrite("import '@workbench-kit/elements'\n", 'preset/elements.js', ['elements/all.js']),
    ).toBe("import '../elements/all.js'\n")
  })

  it('resolves extensionless relative files and directory indexes', () => {
    expect(rewrite("export * from './layout'\n", 'core/index.js', ['core/layout/index.js'])).toBe(
      "export * from './layout/index.js'\n",
    )

    expect(
      rewrite("export { clampSize } from './size'\n", 'core/layout/index.js', [
        'core/layout/size.js',
      ]),
    ).toBe("export { clampSize } from './size.js'\n")
  })

  it('rewrites type-only re-exports and leaves peers untouched', () => {
    expect(
      rewrite(
        "import type { StorageAdapter } from '@workbench-kit/core'\nexport * from 'zustand'\nimport 'react'\n",
        'preset/index.d.ts',
        ['core/index.js'],
      ),
    ).toBe(
      "import type { StorageAdapter } from '../core/index.js'\nexport * from 'zustand'\nimport 'react'\n",
    )
  })

  it('completes directory imports from the vscode-elements peer', () => {
    expect(
      rewrite("import '@vscode-elements/elements/dist/vscode-icon'\n", 'elements/icon.js', []),
    ).toBe("import '@vscode-elements/elements/dist/vscode-icon/index.js'\n")
  })

  it('maps element typings and stylesheet entries', () => {
    expect(
      rewrite("import '@workbench-kit/elements/types'\n", 'preset/index.d.ts', [
        'elements/global.d.ts',
      ]),
    ).toBe("import '../elements/global.d.ts'\n")

    expect(
      rewrite("import '@workbench-kit/styles-vscode/tokens.css'\n", 'preset/index.js', [
        'styles/tokens.css',
      ]),
    ).toBe("import '../styles/tokens.css'\n")
  })

  it('fails on an unresolved relative import', () => {
    expect(() => rewrite("export * from './missing'\n", 'core/index.js', [])).toThrow(
      FacadeBuildError,
    )
  })
})

describe('stripSourceMapComments', () => {
  it('removes declaration map references', () => {
    expect(stripSourceMapComments('export {}\n//# sourceMappingURL=index.d.ts.map\n')).toBe(
      'export {}\n',
    )
  })
})

describe('export target validation', () => {
  const manifest = {
    exports: {
      '.': {
        types: './dist/preset/index.d.ts',
        import: './dist/preset/index.js',
        default: './dist/preset/index.js',
      },
      './react': './dist/react/index.js',
      './elements/types': { types: './dist/elements/global.d.ts' },
    },
  }

  it('collects every condition target', () => {
    expect(exportTargets(manifest)).toEqual([
      { subpath: '.', condition: 'types', target: 'dist/preset/index.d.ts' },
      { subpath: '.', condition: 'import', target: 'dist/preset/index.js' },
      { subpath: '.', condition: 'default', target: 'dist/preset/index.js' },
      { subpath: './react', condition: 'default', target: 'dist/react/index.js' },
      { subpath: './elements/types', condition: 'types', target: 'dist/elements/global.d.ts' },
    ])
  })

  it('reports a target missing from the generated output', () => {
    const files = ['dist/preset/index.d.ts', 'dist/preset/index.js', 'dist/elements/global.d.ts']

    expect(validateExportTargets(manifest, (target) => files.includes(target))).toEqual([
      {
        subpath: './react',
        condition: 'default',
        target: 'dist/react/index.js',
        message: 'Export "./react" (default) points at missing file dist/react/index.js.',
      },
    ])
  })

  it('reports missing types conditions and element exports', () => {
    expect(missingTypesConditions(manifest)).toEqual(['./react'])
    expect(
      missingElementExports(manifest, ['all.js', 'icon.js', 'tabs.js', 'global.d.ts']),
    ).toEqual(['icon', 'tabs'])
  })
})

describe('stylesheet entries', () => {
  const stylesManifest = {
    exports: {
      '.': './src/index.css',
      './index.css': './src/index.css',
      './tokens.css': './src/tokens.css',
      './shell.css': './src/shell.css',
      './title-bar.css': { default: './src/title-bar.css' },
      './icon.js': './src/icon.js',
    },
  }

  it('flattens every declared CSS target and deduplicates shared files', () => {
    expect(stylesheetEntries(stylesManifest)).toEqual([
      { subpath: '.', source: 'src/index.css', target: 'styles/index.css' },
      { subpath: './tokens.css', source: 'src/tokens.css', target: 'styles/tokens.css' },
      { subpath: './shell.css', source: 'src/shell.css', target: 'styles/shell.css' },
      {
        subpath: './title-bar.css',
        source: 'src/title-bar.css',
        target: 'styles/title-bar.css',
      },
    ])
  })

  it('rejects two different files that would collide after flattening', () => {
    expect(() =>
      stylesheetEntries({
        exports: {
          './a.css': './src/a.css',
          './nested/a.css': './src/nested/a.css',
        },
      }),
    ).toThrow(FacadeBuildError)
  })

  it('reports declared stylesheets that are missing from the styles package', () => {
    expect(
      missingStylesheetSources(stylesManifest, (source) => source !== 'src/shell.css'),
    ).toEqual([{ subpath: './shell.css', source: 'src/shell.css', target: 'styles/shell.css' }])
  })
})
