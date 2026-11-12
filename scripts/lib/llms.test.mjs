// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { rawUrlFor, renderLlmsFull, renderLlmsIndex, validateManifest } from './llms.mjs'

const manifest = {
  packageName: 'vscode-workbench',
  version: '0.1.0',
  availability: 'preview',
  siteUrl: 'https://example.test/desktop-ui-template',
  title: 'Workbench Kit',
  description: 'A workbench for tests.',
  sections: [
    { id: 'start', title: 'Start here' },
    { id: 'project', title: 'Project' },
  ],
  pages: [
    {
      path: 'index.md',
      route: '/',
      title: 'Home',
      description: 'Home page.',
      section: 'start',
      order: 1,
    },
    {
      path: 'quickstart.md',
      route: '/quickstart',
      title: 'Quickstart',
      description: 'Install it.',
      section: 'start',
      order: 2,
    },
    {
      path: 'changelog.md',
      route: '/changelog',
      title: 'Changelog',
      description: 'Changes.',
      section: 'project',
      order: 1,
    },
  ],
}

describe('llms generation', () => {
  it('builds absolute raw links grouped by section', () => {
    const index = renderLlmsIndex(manifest)

    expect(index).toContain('vscode-workbench')
    expect(index).toContain('0.1.0')
    expect(index).toContain('preview')
    expect(index).toContain('## Start here')
    expect(index).toContain('## Project')
    expect(index).toContain('https://example.test/desktop-ui-template/docs/raw/quickstart.md')
    expect(index).not.toContain('docs/architecture.md')
  })

  it('builds a full text with page sources', () => {
    const full = renderLlmsFull(manifest, (path) => `# ${path}\n`)
    expect(full).toContain('Source: https://example.test/desktop-ui-template/docs/raw/index.md')
    expect(full).toContain('# quickstart.md')
  })

  it('computes a raw URL from the manifest site URL', () => {
    expect(rawUrlFor(manifest, manifest.pages[0])).toBe(
      'https://example.test/desktop-ui-template/docs/raw/index.md',
    )
  })

  it('rejects duplicate pages and unknown sections', () => {
    const problems = validateManifest({
      ...manifest,
      pages: [
        ...manifest.pages,
        { ...manifest.pages[0] },
        { ...manifest.pages[0], path: 'other.md', section: 'missing' },
      ],
    })
    expect(problems).toContain('duplicate page index.md')
    expect(problems).toContain('page other.md uses unknown section missing')
  })
})
