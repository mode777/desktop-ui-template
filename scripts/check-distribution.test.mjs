// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const scriptPath = fileURLToPath(new URL('./check-distribution.mjs', import.meta.url))
const configPath = fileURLToPath(new URL('../distribution.json', import.meta.url))
const config = JSON.parse(readFileSync(configPath, 'utf8'))

function writeManifest(root, packagePath, manifest) {
  const file = join(root, packagePath, 'package.json')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`)
}

function internalManifest(entry) {
  const manifest = {
    name: entry.name,
    version: '0.1.0',
    private: true,
    type: 'module',
  }

  if (entry.mayDependOn.length > 0) {
    manifest.dependencies = Object.fromEntries(entry.mayDependOn.map((name) => [name, '*']))
  }

  return manifest
}

function writeInternalModules(root, overrides = {}) {
  for (const entry of config.internalModules) {
    writeManifest(root, entry.path, {
      ...internalManifest(entry),
      ...(overrides[entry.name] ?? {}),
    })
  }
}

function run(root) {
  return spawnSync(process.execPath, [scriptPath, '--repo-root', root, '--config', configPath], {
    encoding: 'utf8',
  })
}

function publicManifest(overrides = {}) {
  return {
    name: config.publicPackage.name,
    version: '0.1.0',
    private: false,
    type: 'module',
    exports: {
      '.': './dist/preset/index.js',
      './react': './dist/react/index.js',
      './core': './dist/core/index.js',
      './elements/icon': './dist/elements/icon.js',
      './styles/tokens.css': './dist/styles/tokens.css',
    },
    peerDependencies: {
      react: '>=19',
      'react-dom': '>=19',
      '@vscode-elements/elements': '>=2.5.1 <3',
    },
    ...overrides,
  }
}

describe('check-distribution CLI', () => {
  it('passes five private modules and a planned public package', () => {
    const root = mkdtempSync(join(tmpdir(), 'distribution-cli-'))
    writeInternalModules(root)

    const result = run(root)

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Distribution check: 5 internal modules')
    expect(result.stdout).toContain('not built yet')
    expect(result.stdout).toContain('✓')
  })

  it('fails when an internal module is not private', () => {
    const root = mkdtempSync(join(tmpdir(), 'distribution-cli-'))
    writeInternalModules(root, {
      '@workbench-kit/core': { private: false },
    })

    const result = run(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('internal-module-published')
    expect(result.stderr).toContain('unexpected-public-package')
  })

  it('fails a reverse internal dependency', () => {
    const root = mkdtempSync(join(tmpdir(), 'distribution-cli-'))
    writeInternalModules(root, {
      '@workbench-kit/react': {
        dependencies: {
          '@workbench-kit/core': '*',
          '@workbench-kit/preset-vscode': '*',
        },
      },
    })

    const result = run(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('internal-dependency-not-allowed')
    expect(result.stderr).toContain('@workbench-kit/preset-vscode')
  })

  it('passes a single public package with the required surface', () => {
    const root = mkdtempSync(join(tmpdir(), 'distribution-cli-'))
    writeInternalModules(root)
    writeManifest(root, config.publicPackage.path, publicManifest())

    const result = run(root)

    expect(result.status).toBe(0)
    expect(result.stdout).toContain(`public package ${config.publicPackage.name}`)
    expect(result.stdout).toContain('✓')
  })

  it('fails when the public package depends on an internal module', () => {
    const root = mkdtempSync(join(tmpdir(), 'distribution-cli-'))
    writeInternalModules(root)
    writeManifest(
      root,
      config.publicPackage.path,
      publicManifest({
        dependencies: {
          '@workbench-kit/core': '*',
        },
      }),
    )

    const result = run(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('public-depends-on-internal')
  })

  it('fails when a required public entry is missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'distribution-cli-'))
    writeInternalModules(root)
    writeManifest(
      root,
      config.publicPackage.path,
      publicManifest({
        exports: {
          '.': './dist/preset/index.js',
          './react': './dist/react/index.js',
          './core': './dist/core/index.js',
        },
      }),
    )

    const result = run(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('public-export-missing')
  })

  it('fails when a required public peer is missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'distribution-cli-'))
    writeInternalModules(root)
    writeManifest(
      root,
      config.publicPackage.path,
      publicManifest({
        peerDependencies: {
          react: '>=19',
        },
      }),
    )

    const result = run(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('public-peer-missing')
  })

  it('fails an undeclared sixth package', () => {
    const root = mkdtempSync(join(tmpdir(), 'distribution-cli-'))
    writeInternalModules(root)
    writeManifest(root, 'packages/extra', {
      name: '@workbench-kit/extra',
      version: '0.1.0',
      private: true,
      type: 'module',
    })

    const result = run(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('unexpected-package')
  })
})
