// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { checkRelease, formatReleaseProblem } from './release.mjs'

const roots = []

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'workbench-release-'))
  roots.push(root)

  const internalModules = ['core', 'react', 'elements', 'styles-vscode', 'preset-vscode']
  const distribution = {
    internalModules: internalModules.map((name) => ({
      name: `@workbench-kit/${name}`,
      path: `packages/${name}`,
    })),
    publicPackage: {
      name: '@workbench-kit/workbench',
      path: 'packages/workbench',
    },
  }

  writeFileSync(join(root, 'distribution.json'), `${JSON.stringify(distribution, null, 2)}\n`)
  writeFileSync(join(root, 'CHANGELOG.md'), '# Changelog\n\n## [0.1.0] - 2026-01-01\n')
  writeFileSync(join(root, 'LICENSE'), 'MIT\n')
  writeFileSync(join(root, 'THIRD_PARTY_NOTICES.md'), '# Notices\n')

  for (const name of internalModules) {
    const directory = join(root, 'packages', name)
    mkdirSync(directory, { recursive: true })
    writeFileSync(
      join(directory, 'package.json'),
      `${JSON.stringify(
        { name: `@workbench-kit/${name}`, version: '0.1.0', private: true },
        null,
        2,
      )}\n`,
    )
  }

  const facadeDirectory = join(root, 'packages', 'workbench')
  mkdirSync(facadeDirectory, { recursive: true })
  writeFileSync(
    join(facadeDirectory, 'package.json'),
    `${JSON.stringify(
      {
        name: '@workbench-kit/workbench',
        version: '0.1.0',
        private: false,
        license: 'MIT',
        repository: { url: 'git+https://example.com/repo.git' },
        homepage: 'https://example.com',
        bugs: { url: 'https://example.com/issues' },
        publishConfig: { access: 'public' },
        files: ['dist', 'LICENSE', 'THIRD_PARTY_NOTICES.md'],
      },
      null,
      2,
    )}\n`,
  )

  return root
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('checkRelease', () => {
  it('accepts a complete release fixture', () => {
    const root = createFixture()
    const result = checkRelease(root)

    expect(result.version).toBe('0.1.0')
    expect(result.internalCount).toBe(5)
    expect(result.problems).toEqual([])
  })

  it('reports a version mismatch on an internal module', () => {
    const root = createFixture()
    const manifestPath = join(root, 'packages/core/package.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    manifest.version = '0.2.0'
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

    const result = checkRelease(root)

    expect(result.problems).toContainEqual(
      expect.objectContaining({
        rule: 'version-mismatch',
        file: manifestPath,
      }),
    )
  })

  it('reports missing npm metadata and public access', () => {
    const root = createFixture()
    const manifestPath = join(root, 'packages/workbench/package.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    delete manifest.homepage
    delete manifest.publishConfig
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

    const result = checkRelease(root)

    expect(result.problems).toContainEqual(
      expect.objectContaining({ rule: 'missing-metadata', file: manifestPath }),
    )
    expect(result.problems).toContainEqual(
      expect.objectContaining({ rule: 'missing-publish-access', file: manifestPath }),
    )
  })

  it('reports a missing changelog heading', () => {
    const root = createFixture()
    writeFileSync(join(root, 'CHANGELOG.md'), '# Changelog\n\n## [0.0.9]\n')

    const result = checkRelease(root)

    expect(result.problems).toContainEqual(
      expect.objectContaining({
        rule: 'missing-changelog-heading',
        file: resolve(root, 'CHANGELOG.md'),
      }),
    )
  })

  it('reports missing license material', () => {
    const root = createFixture()
    rmSync(join(root, 'LICENSE'))

    const result = checkRelease(root)

    expect(result.problems).toContainEqual(
      expect.objectContaining({
        rule: 'missing-license-material',
        file: resolve(root, 'LICENSE'),
      }),
    )
  })

  it('formats a repository-relative release problem', () => {
    const root = createFixture()

    expect(
      formatReleaseProblem(
        {
          rule: 'version-mismatch',
          file: join(root, 'packages/core/package.json'),
          message: 'Version differs.',
        },
        root,
      ),
    ).toBe('packages/core/package.json: Version differs. (version-mismatch)')
  })
})
