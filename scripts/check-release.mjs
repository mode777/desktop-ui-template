import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { checkRelease, formatReleaseProblem } from './lib/release.mjs'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/check-release.mjs [options]

Options:
  --repo-root <dir>  Repository root to check. Defaults to this checkout.
  -h, --help         Show this help.

Checks shared package versions, internal privacy, facade npm metadata, the
changelog heading and license material.

Exit codes: 0 when the release metadata is consistent, 1 on any problem.
`)
  process.exit(0)
}

const readFlag = (name, fallback) => {
  const index = args.indexOf(name)
  return index === -1 ? fallback : args[index + 1]
}

const root = resolve(repoRoot, readFlag('--repo-root', repoRoot))
const result = checkRelease(root)

console.log(
  `Release check: version ${result.version ?? '(missing)'}, ${result.internalCount} internal modules, facade ${result.facadeName ?? '(missing)'}`,
)

if (result.problems.length === 0) {
  console.log('✓ versions, privacy, npm metadata, changelog and license material are consistent')
  process.exit(0)
}

console.error('')
console.error(
  `✗ ${result.problems.length} release problem${result.problems.length === 1 ? '' : 's'}:`,
)
console.error('')

for (const problem of result.problems) {
  console.error(`  ${formatReleaseProblem(problem, root)}`)
}

process.exit(1)
