import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { checkBoundaries, formatViolations } from './lib/boundaries.mjs'
import { isSourceFile } from './lib/import-graph.mjs'

const scriptRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)

function readFlag(name, fallback) {
  const index = args.indexOf(name)
  return index === -1 ? fallback : args[index + 1]
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/check-boundaries.mjs [options]

Options:
  --config <file>      Layer declaration to enforce. Defaults to boundaries.json.
  --repo-root <dir>    Repository root the config is resolved from. Defaults to this checkout.
  -h, --help           Show this help.

Exit codes: 0 when the tree satisfies the declaration, 1 on any violation.
`)
  process.exit(0)
}

const repoRoot = resolve(scriptRoot, readFlag('--repo-root', scriptRoot))
const configPath = resolve(scriptRoot, readFlag('--config', 'boundaries.json'))

let config
try {
  config = JSON.parse(readFileSync(configPath, 'utf8'))
} catch (error) {
  console.error(`✗ Could not read the boundary declaration at ${configPath}: ${error.message}`)
  process.exit(1)
}

const sourceRoots =
  Array.isArray(config.roots) && config.roots.length > 0 ? config.roots : [config.root ?? 'src']

function collectSources(dir) {
  const sources = []

  if (!existsSync(dir)) return sources

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = join(dir, entry.name)

    if (entry.isDirectory()) {
      sources.push(...collectSources(absolutePath))
      continue
    }

    if (!isSourceFile(entry.name)) continue

    sources.push({
      path: relative(repoRoot, absolutePath).split(sep).join('/'),
      absolutePath,
      code: readFileSync(absolutePath, 'utf8'),
    })
  }

  return sources
}

const sources = sourceRoots.flatMap((dir) => collectSources(resolve(repoRoot, dir)))
const result = checkBoundaries(sources, config, { repoRoot })

console.log(
  `Boundary check: ${result.fileCount} file${result.fileCount === 1 ? '' : 's'}, ${
    result.importCount
  } import${result.importCount === 1 ? '' : 's'} against ${config.layers.length} declared layers`,
)

if (result.violations.length === 0) {
  console.log('✓ 0 violations')
  process.exit(0)
}

const files = new Set(result.violations.map((violation) => violation.file))
console.error('')
console.error(
  `✗ ${result.violations.length} violation${result.violations.length === 1 ? '' : 's'} in ${
    files.size
  } file${files.size === 1 ? '' : 's'}:`,
)
console.error('')
console.error(formatViolations(result.violations))
process.exit(1)
