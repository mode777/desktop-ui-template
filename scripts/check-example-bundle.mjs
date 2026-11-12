import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  formatCompositionViolations,
  inspectBundle,
  inspectStyles,
} from './lib/bundle-composition.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)

function readFlag(name, fallback) {
  const index = args.indexOf(name)
  return index === -1 ? fallback : args[index + 1]
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/check-example-bundle.mjs [options]

Checks one example application's production bundle for preset, template or demo
code, for known demo UI markers and for stylesheet rules outside its declared
style subset.

Options:
  --dist <dir>             Application build output. Defaults to apps/minimal/dist.
  --entry <file>           Expected manifest entry. Defaults to index.html.
  --label <name>           Target name used in messages. Defaults to minimal.
  --build-command <cmd>    Build command named when the output is missing.
                           Defaults to "npm run build:minimal".
  --style-config <file>    JSON file with the app's forbiddenSelectors list.
                           When omitted, the CSS check is skipped.
  -h, --help               Show this help.

Exit codes: 0 when no forbidden module, marker or style selector is present,
1 otherwise.
`)
  process.exit(0)
}

const distPath = resolve(root, readFlag('--dist', 'apps/minimal/dist'))
const entry = readFlag('--entry', 'index.html')
const label = readFlag('--label', 'minimal')
const buildCommand = readFlag('--build-command', 'npm run build:minimal')
const styleConfigPath = readFlag('--style-config')
const manifestPath = join(distPath, '.vite', 'manifest.json')
const modulesPath = join(distPath, '.vite', 'modules.json')
const assetsDir = join(distPath, 'assets')

function readJson(path) {
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    console.error(`✗ Could not read ${path}: ${error.message}`)
    process.exit(1)
  }
}

if (!existsSync(assetsDir)) {
  console.error(`✗ No build output found at ${assetsDir}. Run "${buildCommand}" before checking.`)
  process.exit(1)
}

const manifest = readJson(manifestPath)
const inventory = readJson(modulesPath)
const scripts = readdirSync(assetsDir)
  .filter((name) => name.endsWith('.js') || name.endsWith('.mjs'))
  .sort()
  .map((name) => {
    const path = join(assetsDir, name)
    if (!statSync(path).isFile()) return null
    return { name: `assets/${name}`, text: readFileSync(path, 'utf8') }
  })
  .filter(Boolean)
const styles = readdirSync(assetsDir)
  .filter((name) => name.endsWith('.css'))
  .sort()
  .map((name) => {
    const path = join(assetsDir, name)
    if (!statSync(path).isFile()) return null
    return { name: `assets/${name}`, text: readFileSync(path, 'utf8') }
  })
  .filter(Boolean)

const styleConfig = styleConfigPath ? readJson(resolve(root, styleConfigPath)) : null

if (styleConfigPath && !styleConfig) {
  console.error(`✗ No style config found at ${resolve(root, styleConfigPath)}.`)
  process.exit(1)
}

const result = inspectBundle({
  manifest,
  modules: Array.isArray(inventory?.modules) ? inventory.modules : [],
  scripts,
  entry,
  label,
})
const styleResult = styleConfig
  ? inspectStyles({
      styles,
      forbiddenSelectors: styleConfig.forbiddenSelectors,
      label,
    })
  : { violations: [], assetCount: 0 }
const violations = [...result.violations, ...styleResult.violations]

console.log(
  `Bundle composition (${label}): ${result.moduleCount} module${
    result.moduleCount === 1 ? '' : 's'
  }, ${result.assetCount} script${result.assetCount === 1 ? '' : 's'}, ` +
    `${styleResult.assetCount} stylesheet${styleResult.assetCount === 1 ? '' : 's'}, ` +
    `entry ${result.entry ?? '(missing)'}`,
)

if (violations.length === 0) {
  console.log(
    `✓ 0 violations — no demo, app or preset code and no forbidden style selectors reached the ${label} bundle`,
  )
  process.exit(0)
}

console.error('')
console.error(
  `✗ ${violations.length} violation${violations.length === 1 ? '' : 's'} in the ${label} bundle:`,
)
console.error('')
console.error(formatCompositionViolations(violations))
process.exit(1)
