// @vitest-environment node
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  collectPublicValueExports,
  documentationFiles,
  extractMarkdownLinks,
  extractNpmRunScripts,
  extractPublishedSpecifiers,
  formatDocProblem,
  isExternalLink,
  isPlaceholderSpecifier,
  mentionsName,
  missingExportMentions,
  resolveDocLink,
  specifierToExportKey,
} from './docs.mjs'

const repoRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))

describe('extractMarkdownLinks', () => {
  it('finds inline links with their line numbers and strips titles', () => {
    const markdown =
      '# Doc\n\n[Guide](./guide.md "Guide title")\n![Image](./image.png)\n[Site](https://example.com)\n'

    expect(extractMarkdownLinks(markdown)).toEqual([
      { target: './guide.md', line: 3 },
      { target: 'https://example.com', line: 5 },
    ])
  })

  it('does not treat images as documentation links', () => {
    expect(extractMarkdownLinks('![Screenshot](./docs/screenshot.png)')).toEqual([])
  })
})

describe('isExternalLink', () => {
  it('accepts external, anchor and protocol-relative links', () => {
    expect(isExternalLink('https://example.com')).toBe(true)
    expect(isExternalLink('mailto:team@example.com')).toBe(true)
    expect(isExternalLink('#section')).toBe(true)
    expect(isExternalLink('//cdn.example.com/file')).toBe(true)
  })

  it('rejects relative links', () => {
    expect(isExternalLink('./guide.md')).toBe(false)
    expect(isExternalLink('../ROADMAP.md')).toBe(false)
  })
})

describe('resolveDocLink', () => {
  it('resolves a relative link from the source file', () => {
    const source = resolve(repoRoot, 'docs/api.md')
    const resolved = resolveDocLink(source, './migration.md#install', repoRoot)

    expect(resolved).toBe(resolve(repoRoot, 'docs/migration.md'))
    expect(existsSync(resolved)).toBe(true)
  })

  it('ignores external, anchor-only and empty links', () => {
    const source = resolve(repoRoot, 'docs/api.md')

    expect(resolveDocLink(source, 'https://example.com', repoRoot)).toBeNull()
    expect(resolveDocLink(source, '#install', repoRoot)).toBeNull()
    expect(resolveDocLink(source, '', repoRoot)).toBeNull()
  })
})

describe('extractNpmRunScripts', () => {
  it('extracts unique script names with line numbers', () => {
    const markdown =
      'Run `npm run check` then:\n\n```bash\nnpm run check\nnpm run test -- docs\n```\n'

    expect(extractNpmRunScripts(markdown)).toEqual([
      { script: 'check', line: 1 },
      { script: 'test', line: 5 },
    ])
  })
})

describe('extractPublishedSpecifiers', () => {
  it('extracts declared subpaths and trims punctuation', () => {
    const markdown =
      'Use `@workbench-kit/workbench`, `@workbench-kit/workbench/react`, and `@workbench-kit/workbench/styles/tokens.css`.'

    expect(extractPublishedSpecifiers(markdown).map((entry) => entry.specifier)).toEqual([
      '@workbench-kit/workbench',
      '@workbench-kit/workbench/react',
      '@workbench-kit/workbench/styles/tokens.css',
    ])
  })

  it('skips placeholders and unknown private-looking names', () => {
    const markdown =
      'Use `@workbench-kit/workbench/elements/<tag>` or `@workbench-kit/workbench/styles/*.css`.'

    expect(extractPublishedSpecifiers(markdown)).toEqual([])
    expect(isPlaceholderSpecifier('@workbench-kit/workbench/elements/<tag>')).toBe(true)
    expect(isPlaceholderSpecifier('@workbench-kit/workbench/styles/*.css')).toBe(true)
    expect(isPlaceholderSpecifier('@workbench-kit/workbench/react')).toBe(false)
  })
})

describe('specifierToExportKey', () => {
  it('maps the package root and subpaths to export keys', () => {
    expect(specifierToExportKey('@workbench-kit/workbench')).toBe('.')
    expect(specifierToExportKey('@workbench-kit/workbench/react')).toBe('./react')
    expect(specifierToExportKey('@workbench-kit/workbench/styles/tokens.css')).toBe(
      './styles/tokens.css',
    )
    expect(specifierToExportKey('@workbench-kit/core')).toBeNull()
  })
})

describe('mentionsName and missingExportMentions', () => {
  it('matches whole names and reports missing exports', () => {
    const text = '`VSCodeWorkbench` and `clampSize` are documented.'

    expect(mentionsName(text, 'VSCodeWorkbench')).toBe(true)
    expect(mentionsName(text, 'VSCode')).toBe(false)
    expect(
      missingExportMentions(
        { preset: ['VSCodeWorkbench', 'defaultCommands'], core: ['clampSize'] },
        text,
      ),
    ).toEqual([{ group: 'preset', name: 'defaultCommands' }])
  })
})

describe('collectPublicValueExports', () => {
  it('collects value exports and excludes type-only exports', () => {
    const groups = collectPublicValueExports(repoRoot)

    expect(groups.preset).toContain('VSCodeWorkbench')
    expect(groups.preset).toContain('defaultCommands')
    expect(groups.preset).toContain('useWorkbenchStore')
    expect(groups.react).toEqual(
      expect.arrayContaining(['IconButton', 'ResizablePane', 'TabStrip', 'WorkbenchShell']),
    )
    expect(groups.core).toEqual(
      expect.arrayContaining(['clampSize', 'openTabIn', 'readVersioned', 'writeVersioned']),
    )
    expect(groups.preset).not.toContain('WorkbenchConfig')
    expect(groups.react).not.toContain('WorkbenchShellProps')
  })
})

describe('documentationFiles', () => {
  it('includes root, docs, package and app documentation', () => {
    const files = documentationFiles(repoRoot)

    expect(files).toContain(resolve(repoRoot, 'README.md'))
    expect(files).toContain(resolve(repoRoot, 'docs/api.md'))
    expect(files).toContain(resolve(repoRoot, 'packages/workbench/README.md'))
    expect(files).toContain(resolve(repoRoot, 'apps/custom-shell/README.md'))
  })
})

describe('formatDocProblem', () => {
  it('renders a repository-relative location with a line', () => {
    expect(
      formatDocProblem(
        { file: resolve(repoRoot, 'docs/api.md'), line: 12, message: 'Missing target.' },
        repoRoot,
      ),
    ).toBe('docs/api.md:12: Missing target.')
  })
})
