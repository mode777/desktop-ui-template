import { dirname, resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { checkDistribution, formatDistributionViolations } from './lib/distribution.mjs'

const scriptRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)

function readFlag(name, fallback) {
  const index = args.indexOf(name)
  return index === -1 ? fallback : args[index + 1]
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/check-distribution.mjs [options]

Options:
  --config <file>      Distribution declaration to enforce. Defaults to distribution.json.
  --repo-root <dir>    Repository root the config is resolved from. Defaults to this checkout.
  -h, --help           Show this help.

Exit codes: 0 when the distribution model is satisfied, 1 on any violation.
`)
  process.exit(0)
}

const repoRoot = resolve(scriptRoot, readFlag('--repo-root', scriptRoot))
const configPath = resolve(scriptRoot, readFlag('--config', 'distribution.json'))

let config
try {
  config = JSON.parse(readFileSync(configPath, 'utf8'))
} catch (error) {
  console.error(`✗ Could not read the distribution declaration at ${configPath}: ${error.message}`)
  process.exit(1)
}

const result = checkDistribution(repoRoot, config)
const publicState = result.publicPackagePresent
  ? `public package ${result.publicPackageName}`
  : `public package ${result.publicPackageName ?? '(not configured)'} not built yet`

console.log(`Distribution check: ${result.moduleCount} internal modules, ${publicState}`)

if (result.violations.length === 0) {
  console.log('✓ internal modules are private; dependency edges and public surface are allowed')
  process.exit(0)
}

console.error('')
console.error(
  `✗ ${result.violations.length} distribution violation${
    result.violations.length === 1 ? '' : 's'
  }:`,
)
console.error('')
console.error(formatDistributionViolations(result.violations))
process.exit(1)
