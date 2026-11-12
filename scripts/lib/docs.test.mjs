// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  collectPublicValueExports,
  consumerDocumentationFiles,
  consumerDocsDir,
  contributorDocumentationFiles,
  documentationFiles,
  extractMarkdownLinks,
  extractNpmRunScripts,
  extractPublishedSpecifiers,
  findConsumerBoundaryProblems,
  findLlmsProblems,
  findManifestProblems,
  formatDocProblem,
  isExternalLink,
  isPlaceholderSpecifier,
  mentionsName,
  missingExportMentions,
  readDocsManifest,
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
    const source = resolve(repoRoot, 'packages/workbench/docs/reference/api.md')
    const resolved = resolveDocLink(source, '../recipes/eject.md#state-and-persistence', repoRoot)

    expect(resolved).toBe(resolve(repoRoot, 'packages/workbench/docs/recipes/eject.md'))
    expect(existsSync(resolved)).toBe(true)
  })

  it('ignores external, anchor-only and empty links', () => {
    const source = resolve(repoRoot, 'packages/workbench/docs/reference/api.md')

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
  it('includes contributor root, docs and app documentation', () => {
    const files = contributorDocumentationFiles(repoRoot)

    expect(files).toContain(resolve(repoRoot, 'README.md'))
    expect(files).toContain(resolve(repoRoot, 'docs/architecture.md'))
    expect(files).toContain(resolve(repoRoot, 'apps/custom-shell/README.md'))
    expect(files).not.toContain(resolve(repoRoot, 'packages/workbench/README.md'))
    expect(documentationFiles(repoRoot)).toEqual(files)
  })

  it('includes the package README, agent guide, consumer docs and llms.txt', () => {
    const files = consumerDocumentationFiles(repoRoot)

    expect(files).toContain(resolve(repoRoot, 'packages/workbench/README.md'))
    expect(files).toContain(resolve(repoRoot, 'packages/workbench/AGENTS.md'))
    expect(files).toContain(resolve(repoRoot, 'packages/workbench/docs/quickstart.md'))
    expect(files).toContain(resolve(repoRoot, 'packages/workbench/llms.txt'))
  })
})

describe('consumer documentation checks', () => {
  it('accepts the real consumer tree boundary', () => {
    expect(
      findConsumerBoundaryProblems({ repoRoot, files: consumerDocumentationFiles(repoRoot) }),
    ).toEqual([])
  })

  it('rejects a link outside the consumer tree and a private package name', () => {
    const root = mkdtempSync(join(tmpdir(), 'workbench-docs-'))
    const docsDir = join(root, 'packages/workbench/docs')
    mkdirSync(docsDir, { recursive: true })
    const file = join(docsDir, 'bad.md')
    writeFileSync(file, '[outside](../../../docs/architecture.md)\n\n`@workbench-kit/core`\n')

    const problems = findConsumerBoundaryProblems({ repoRoot: root, files: [file] })

    expect(problems.some((problem) => problem.message.includes('outside'))).toBe(true)
    expect(problems.some((problem) => problem.message.includes('private package'))).toBe(true)
    rmSync(root, { recursive: true, force: true })
  })

  it('accepts the real manifest and llms.txt links', () => {
    const manifest = readDocsManifest(repoRoot)
    const llmsText = readFileSync(resolve(repoRoot, 'packages/workbench/llms.txt'), 'utf8')

    expect(findManifestProblems({ repoRoot, manifest })).toEqual([])
    expect(findLlmsProblems({ docsDir: consumerDocsDir(repoRoot), manifest, llmsText })).toEqual([])
  })
})

describe('formatDocProblem', () => {
  it('renders a repository-relative location with a line', () => {
    expect(
      formatDocProblem(
        { file: resolve(repoRoot, 'docs/architecture.md'), line: 12, message: 'Missing target.' },
        repoRoot,
      ),
    ).toBe('docs/architecture.md:12: Missing target.')
  })
})
