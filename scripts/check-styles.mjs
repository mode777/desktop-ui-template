import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  COMPONENT_ORDER,
  DEMO_SELECTOR_PREFIXES,
  aggregateProblems,
  componentStylesheets,
  facadeStyleProblems,
  formatStyleViolation,
  indexProblems,
  missingComponentStyleExports,
  missingExportTargets,
  selectorViolations,
  styleSubsetProblems,
} from './lib/styles.mjs'

const scriptRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)

function readFlag(name, fallback) {
  const index = args.indexOf(name)
  return index === -1 ? fallback : args[index + 1]
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/check-styles.mjs [options]

Checks the per-component stylesheet surface: declared exports, aggregate
completeness and order, the root stylesheet order, demo-selector isolation and
the style subsets of example applications.

Options:
  --repo-root <dir>  Repository root to check. Defaults to this checkout.
  -h, --help         Show this help.

Exit codes: 0 when the style surface is consistent, 1 on any violation.
`)
  process.exit(0)
}

const repoRoot = resolve(scriptRoot, readFlag('--repo-root', scriptRoot))
const stylesDir = join(repoRoot, 'packages/styles-vscode')
const stylesSrc = join(stylesDir, 'src')
const facadeDir = join(repoRoot, 'packages/workbench')
const appsDir = join(repoRoot, 'apps')

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

const stylesManifest = readJson(join(stylesDir, 'package.json'))
const facadeManifest = readJson(join(facadeDir, 'package.json'))
const styleFiles = readdirSync(stylesSrc)
  .filter((file) => file.endsWith('.css'))
  .sort()
const componentFiles = componentStylesheets(styleFiles)
const problems = []

for (const file of COMPONENT_ORDER) {
  if (styleFiles.includes(file)) continue
  problems.push({
    rule: 'missing-component-file',
    file,
    message: `Expected component stylesheet ${file} is missing from packages/styles-vscode/src.`,
  })
}

for (const file of componentFiles) {
  if (COMPONENT_ORDER.includes(file)) continue
  problems.push({
    rule: 'unlisted-component-file',
    file,
    message: `Component stylesheet ${file} is not listed in the documented component order.`,
  })
}

problems.push(...missingComponentStyleExports(stylesManifest, componentFiles))
problems.push(...facadeStyleProblems(facadeManifest, componentFiles))
problems.push(
  ...missingExportTargets(
    stylesManifest,
    (target) => existsSync(join(stylesDir, target)),
    'styles package',
  ),
)
problems.push(
  ...aggregateProblems(readFileSync(join(stylesSrc, 'workbench.css'), 'utf8'), componentFiles),
)
problems.push(...indexProblems(readFileSync(join(stylesSrc, 'index.css'), 'utf8')))

for (const file of styleFiles) {
  const css = readFileSync(join(stylesSrc, file), 'utf8')
  problems.push(...selectorViolations(css, DEMO_SELECTOR_PREFIXES, file))
}

const appSubsets = []

for (const entry of readdirSync(appsDir, { withFileTypes: true }).sort((a, b) =>
  a.name.localeCompare(b.name),
)) {
  if (!entry.isDirectory()) continue

  const configPath = join(appsDir, entry.name, 'style-subset.json')
  if (!existsSync(configPath)) continue

  const subset = readJson(configPath)
  const sourcePath = join(appsDir, entry.name, 'src/main.tsx')

  if (!existsSync(sourcePath)) {
    problems.push({
      rule: 'missing-app-source',
      file: relative(repoRoot, sourcePath),
      message: `Style subset for ${entry.name} has no src/main.tsx to check.`,
    })
    continue
  }

  appSubsets.push(entry.name)
  problems.push(...styleSubsetProblems(readFileSync(sourcePath, 'utf8'), subset, entry.name))
}

console.log(
  `Style check: ${componentFiles.length} component stylesheets, ${styleFiles.length} files, ${appSubsets.length} app subset${appSubsets.length === 1 ? '' : 's'}`,
)

if (problems.length === 0) {
  console.log('✓ component entries, aggregate order and demo-selector isolation are consistent')
  process.exit(0)
}

console.error('')
console.error(`✗ ${problems.length} style problem${problems.length === 1 ? '' : 's'}:`)
console.error('')

for (const problem of problems) console.error(`  ${formatStyleViolation(problem)}`)

process.exit(1)
