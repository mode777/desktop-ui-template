// @vitest-environment node
import { describe, expect, it } from 'vitest'

import {
  createConsumerRuntimeSource,
  createConsumerTsConfig,
  createConsumerTypecheckSource,
  createCssDeclarations,
  findContentViolations,
  forbiddenTarballPath,
  requiredTarballFiles,
  validateTarballFiles,
} from './pack-check.mjs'

const manifest = {
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
    './elements/icon': {
      types: './dist/elements/icon.d.ts',
      import: './dist/elements/icon.js',
      default: './dist/elements/icon.js',
    },
    './elements/types': {
      types: './dist/elements/global.d.ts',
    },
    './styles/tokens.css': './dist/styles/tokens.css',
  },
}

describe('requiredTarballFiles', () => {
  it('includes the manifest, README, legal files and every export target', () => {
    expect(requiredTarballFiles(manifest)).toEqual([
      'package.json',
      'README.md',
      'LICENSE',
      'THIRD_PARTY_NOTICES.md',
      'AGENTS.md',
      'llms.txt',
      'docs/index.md',
      'docs/quickstart.md',
      'docs/manifest.json',
      'dist/preset/index.d.ts',
      'dist/preset/index.js',
      'dist/react/index.d.ts',
      'dist/react/index.js',
      'dist/elements/icon.d.ts',
      'dist/elements/icon.js',
      'dist/elements/global.d.ts',
      'dist/styles/tokens.css',
    ])
  })
})

describe('forbiddenTarballPath', () => {
  it('rejects source, fixtures, maps, build metadata and nested dependencies', () => {
    expect(forbiddenTarballPath('apps/template/src/demo/workspace.ts')).toContain('source')
    expect(forbiddenTarballPath('dist/apps/template/src/App.js')).toContain('source')
    expect(forbiddenTarballPath('dist/components/component-test-fixtures.js')).toContain('fixture')
    expect(forbiddenTarballPath('dist/index.d.ts.map')).toContain('maps')
    expect(forbiddenTarballPath('dist/.tsbuildinfo')).toContain('build metadata')
    expect(forbiddenTarballPath('node_modules/react/index.js')).toContain('dependencies')
    expect(forbiddenTarballPath('package-lock.json')).toContain('lockfiles')
  })

  it('allows the manifest, README, legal files, consumer docs and generated output', () => {
    expect(forbiddenTarballPath('package.json')).toBeNull()
    expect(forbiddenTarballPath('README.md')).toBeNull()
    expect(forbiddenTarballPath('LICENSE')).toBeNull()
    expect(forbiddenTarballPath('THIRD_PARTY_NOTICES.md')).toBeNull()
    expect(forbiddenTarballPath('AGENTS.md')).toBeNull()
    expect(forbiddenTarballPath('llms.txt')).toBeNull()
    expect(forbiddenTarballPath('docs/index.md')).toBeNull()
    expect(forbiddenTarballPath('docs/recipes/add-view.md')).toBeNull()
    expect(forbiddenTarballPath('dist/preset/index.js')).toBeNull()
  })

  it('rejects contributor documentation and application content', () => {
    expect(forbiddenTarballPath('docs/architecture.md')).toContain('contributor documentation')
    expect(forbiddenTarballPath('docs/release.md')).toContain('contributor documentation')
    expect(forbiddenTarballPath('apps/template/README.md')).toContain('repository or application')
    expect(forbiddenTarballPath('openspec/changes/x/proposal.md')).toContain(
      'repository or application',
    )
  })
})

describe('validateTarballFiles', () => {
  it('accepts a complete surface', () => {
    expect(validateTarballFiles(requiredTarballFiles(manifest), manifest)).toEqual([])
  })

  it('reports a missing export target', () => {
    const files = requiredTarballFiles(manifest).filter((file) => file !== 'dist/react/index.js')
    const violations = validateTarballFiles(files, manifest)

    expect(violations).toContainEqual({
      rule: 'missing-file',
      path: 'dist/react/index.js',
      message: 'The tarball is missing required file dist/react/index.js.',
    })
  })

  it('reports an unexpected top-level file', () => {
    const violations = validateTarballFiles(
      [...requiredTarballFiles(manifest), 'scripts/build.mjs'],
      manifest,
    )

    expect(violations[0]).toMatchObject({
      rule: 'unexpected-file',
      path: 'scripts/build.mjs',
    })
  })
})

describe('findContentViolations', () => {
  it('accepts clean generated output', () => {
    expect(
      findContentViolations({
        files: ['dist/core/index.js'],
        readFile: () => "export { clampSize } from './size.js'\n",
      }),
    ).toEqual([])
  })

  it('reports a private package reference', () => {
    expect(
      findContentViolations({
        files: ['dist/core/index.js'],
        readFile: () => "import '@workbench-kit/core'\n",
      }),
    ).toContainEqual({
      rule: 'private-package-reference',
      file: 'dist/core/index.js',
      message: 'dist/core/index.js references the private package @workbench-kit/core.',
    })
  })

  it('reports app and demo content', () => {
    expect(
      findContentViolations({
        files: ['dist/preset/index.js'],
        readFile: () =>
          "export { ExplorerView } from 'apps/template/src/demo/views/ExplorerView'\n",
      }),
    ).toContainEqual({
      rule: 'app-content',
      file: 'dist/preset/index.js',
      message: 'dist/preset/index.js contains the app/demo marker "apps/template/src/".',
    })
  })
})

describe('consumer fixtures', () => {
  it('generates a runtime that checks value exports, element tags and styles', () => {
    const source = createConsumerRuntimeSource({
      jsSubpaths: ['.', './react', './core', './elements/icon', './elements/all'],
      cssSubpaths: ['./styles/tokens.css'],
    })

    expect(source).toContain('JSDOM')
    expect(source).toContain('@workbench-kit/workbench${subpath.slice(1)}')
    expect(source).toContain('vscode-icon')
    expect(source).toContain('"./styles/tokens.css"')
    expect(source).toContain("typeof module[name] === 'undefined'")
  })

  it('generates a typecheck consumer with every subpath and CSS declaration', () => {
    const source = createConsumerTypecheckSource({
      jsSubpaths: ['.', './react', './core', './elements/icon'],
      cssSubpaths: ['./styles/tokens.css'],
      typesSubpath: './elements/types',
    })

    expect(source).toContain(
      "import { VSCodeWorkbench, useWorkbenchStore, defaultCommands, createCommandRegistry } from '@workbench-kit/workbench'",
    )
    expect(source).toContain(
      "import { WorkbenchShell, TabStrip, ResizablePane, IconButton } from '@workbench-kit/workbench/react'",
    )
    expect(source).toContain("import '@workbench-kit/workbench/elements/icon'")
    expect(source).toContain("import '@workbench-kit/workbench/elements/types'")
    expect(source).toContain("import '@workbench-kit/workbench/styles/tokens.css'")
    expect(source).toContain('WorkbenchConfig')
    expect(createCssDeclarations()).toContain("declare module '*.css'")
    expect(createConsumerTsConfig().compilerOptions.moduleResolution).toBe('Bundler')
  })
})
