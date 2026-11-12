import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { checkAdoption, formatAdoptionFinding, parsePackageManifest } from './lib/adoption.mjs'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)

function readFlag(name, fallback) {
  const index = args.indexOf(name)
  return index === -1 ? fallback : args[index + 1]
}

if (args.includes('--help') || args.includes('-h') || !args.includes('--app')) {
  console.log(`Usage: node scripts/check-adoption.mjs --app <dir> [options]

Options:
  --app <dir>                         Application directory to inspect. Required.
  --level <preset|composition|primitives|auto>  Adoption level. Defaults to auto.
  --json                              Print a machine-readable report.
  -h, --help                          Show this help.

Checks private imports, element registrations, style entries, preset/demo leaks,
SSR globals and package version/peer metadata.
`)
  process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1)
}

const appDir = resolve(process.cwd(), readFlag('--app'))
if (!existsSync(appDir)) {
  console.error(`Application directory does not exist: ${appDir}`)
  process.exit(1)
}

const level = readFlag('--level', 'auto')
const manifest = parsePackageManifest(resolve(repoRoot, 'packages/workbench'))
const report = checkAdoption({ appDir, level, packageManifest: manifest })

if (args.includes('--json')) {
  console.log(JSON.stringify(report, null, 2))
  process.exit(report.ok ? 0 : 1)
}

console.log(
  `Adoption check: ${report.level} level, ${report.summary.files} source files, ${report.summary.errors} errors, ${report.summary.warnings} warnings`,
)

if (report.findings.length === 0) {
  console.log('✓ imports, element registrations, styles, leaks and package metadata are consistent')
  process.exit(0)
}

for (const finding of report.findings) {
  console.error(`  ${formatAdoptionFinding(finding, appDir)}`)
}

process.exit(report.ok ? 0 : 1)
