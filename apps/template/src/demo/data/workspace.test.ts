import { describe, expect, it } from 'vitest'

import { getFile } from './workspace'

describe('mock workbench package content', () => {
  it('shows a valid public manifest with release metadata and shipped legal files', () => {
    const file = getFile('packages/workbench/package.json')

    expect(file).toBeDefined()

    const manifest = JSON.parse(file!.content)

    expect(manifest.name).toBe('@workbench-kit/workbench')
    expect(manifest.private).toBe(false)
    expect(manifest.license).toBe('MIT')
    expect(manifest.publishConfig).toEqual({ access: 'public' })
    expect(manifest.files).toEqual(
      expect.arrayContaining(['dist', 'LICENSE', 'THIRD_PARTY_NOTICES.md']),
    )
  })

  it('links the adoption and release guides from the mock README', () => {
    const file = getFile('packages/workbench/README.md')

    expect(file?.content).toContain('../../docs/api.md')
    expect(file?.content).toContain('../../docs/migration.md')
    expect(file?.content).toContain('../../docs/eject.md')
    expect(file?.content).toContain('../../docs/release.md')
    expect(file?.content).toContain('THIRD_PARTY_NOTICES.md')
  })
})
