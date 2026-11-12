import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)

function readFlag(name, fallback) {
  const index = args.indexOf(name)
  return index === -1 ? fallback : args[index + 1]
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/assemble-pages-site.mjs [options]

Assembles one GitHub Pages artifact from the three application builds:
the template at the site root, the minimal example under /minimal/ and the
custom-shell example under /custom-shell/. Every application is built with a
relative base, so the same builds also work from a subdirectory.

Options:
  --repo-root <dir>  Repository root to read builds from. Defaults to this checkout.
  --out <dir>        Output directory, relative to the repository root. Defaults to site.
  -h, --help         Show this help.

Exit codes: 0 when the site was assembled, 1 when an application build is missing.
`)
  process.exit(0)
}

const repoRoot = resolve(root, readFlag('--repo-root', root))
const outPath = resolve(repoRoot, readFlag('--out', 'site'))

const applications = [
  {
    label: 'template',
    source: 'apps/template/dist',
    target: '.',
    build: 'npm run build',
  },
  {
    label: 'minimal',
    source: 'apps/minimal/dist',
    target: 'minimal',
    build: 'npm run build:minimal',
  },
  {
    label: 'custom-shell',
    source: 'apps/custom-shell/dist',
    target: 'custom-shell',
    build: 'npm run build:custom-shell',
  },
]

const missing = applications.filter(
  (application) => !existsSync(join(repoRoot, application.source, 'index.html')),
)

if (missing.length > 0) {
  for (const application of missing) {
    console.error(
      `✗ ${application.source}/index.html is missing; build the ${application.label} application first with "${application.build}".`,
    )
  }
  process.exit(1)
}

rmSync(outPath, { recursive: true, force: true })

for (const application of applications) {
  const sourcePath = join(repoRoot, application.source)
  const targetPath = application.target === '.' ? outPath : join(outPath, application.target)

  mkdirSync(targetPath, { recursive: true })
  for (const entry of readdirSync(sourcePath)) {
    // The Vite manifest and module inventory are build metadata, not site files.
    if (entry === '.vite') continue
    cpSync(join(sourcePath, entry), join(targetPath, entry), { recursive: true })
  }
}

console.log(`Pages site assembled in ${relative(repoRoot, outPath)}/`)
console.log('  /              template (full preset)')
console.log('  /minimal/      minimal example')
console.log('  /custom-shell/ custom-shell example')
