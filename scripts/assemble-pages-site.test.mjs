// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const scriptPath = fileURLToPath(new URL('./assemble-pages-site.mjs', import.meta.url))

function write(root, path, content) {
  const absolutePath = join(root, path)
  mkdirSync(dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, content)
}

function run(repoRoot, ...extraArgs) {
  return spawnSync(
    process.execPath,
    [scriptPath, '--repo-root', repoRoot, '--out', 'site', ...extraArgs],
    { encoding: 'utf8' },
  )
}

describe('assemble-pages-site CLI', () => {
  it('places the template at the root and the examples in subdirectories', () => {
    const root = mkdtempSync(join(tmpdir(), 'pages-site-'))
    write(root, 'apps/template/dist/index.html', '<title>template</title>\n')
    write(root, 'apps/template/dist/assets/template.js', 'template\n')
    write(root, 'apps/minimal/dist/index.html', '<title>minimal</title>\n')
    write(root, 'apps/minimal/dist/assets/minimal.js', 'minimal\n')
    write(root, 'apps/minimal/dist/.vite/manifest.json', '{}\n')
    write(root, 'apps/custom-shell/dist/index.html', '<title>custom-shell</title>\n')
    write(root, 'apps/custom-shell/dist/codicons/codicon.css', 'custom-shell\n')
    write(root, 'docs-site/dist/index.html', '<title>docs</title>\n')
    write(root, 'docs-site/dist/llms.txt', '# llms\n')
    write(root, 'docs-site/dist/raw/index.md', '# docs\n')
    write(root, 'site/stale.txt', 'stale\n')

    const result = run(root)

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Pages site assembled in site/')
    expect(readFileSync(join(root, 'site/index.html'), 'utf8')).toContain('template')
    expect(readFileSync(join(root, 'site/assets/template.js'), 'utf8')).toBe('template\n')
    expect(readFileSync(join(root, 'site/minimal/index.html'), 'utf8')).toContain('minimal')
    expect(readFileSync(join(root, 'site/minimal/assets/minimal.js'), 'utf8')).toBe('minimal\n')
    expect(readFileSync(join(root, 'site/custom-shell/index.html'), 'utf8')).toContain(
      'custom-shell',
    )
    expect(readFileSync(join(root, 'site/custom-shell/codicons/codicon.css'), 'utf8')).toBe(
      'custom-shell\n',
    )
    expect(readFileSync(join(root, 'site/docs/index.html'), 'utf8')).toContain('docs')
    expect(readFileSync(join(root, 'site/docs/llms.txt'), 'utf8')).toBe('# llms\n')
    expect(readFileSync(join(root, 'site/llms.txt'), 'utf8')).toBe('# llms\n')
    expect(readFileSync(join(root, 'site/docs/raw/index.md'), 'utf8')).toBe('# docs\n')
    expect(existsSync(join(root, 'site/stale.txt'))).toBe(false)
    expect(existsSync(join(root, 'site/minimal/.vite'))).toBe(false)
  })

  it('fails with the build command for every missing application build', () => {
    const root = mkdtempSync(join(tmpdir(), 'pages-site-'))
    write(root, 'apps/template/dist/index.html', '<title>template</title>\n')

    const result = run(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('apps/minimal/dist/index.html is missing')
    expect(result.stderr).toContain('npm run build:minimal')
    expect(result.stderr).toContain('apps/custom-shell/dist/index.html is missing')
    expect(result.stderr).toContain('npm run build:custom-shell')
    expect(result.stderr).toContain('docs-site/dist/index.html is missing')
    expect(result.stderr).toContain('npm run build:docs')
    expect(result.stderr).not.toContain('apps/template/dist')
    expect(existsSync(join(root, 'site'))).toBe(false)
  })
})
