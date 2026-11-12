import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { checkReleaseTag, formatReleaseProblem } from './lib/release.mjs'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/check-release-tag.mjs --tag <tag> [options]

Options:
  --tag <tag>        Release tag to check, for example v0.1.0. Defaults to
                     GITHUB_REF_NAME when the workflow provides it.
  --repo-root <dir>  Repository root to check. Defaults to this checkout.
  -h, --help         Show this help.

Checks that the release tag is exactly v<facade version>.

Exit codes: 0 when the tag matches, 1 on a missing or mismatched tag.
`)
  process.exit(0)
}

const readFlag = (name, fallback) => {
  const index = args.indexOf(name)
  return index === -1 ? fallback : args[index + 1]
}

const root = resolve(repoRoot, readFlag('--repo-root', repoRoot))
const tag = readFlag('--tag', process.env.GITHUB_REF_NAME ?? '')
const result = checkReleaseTag(root, tag)

console.log(
  `Release tag check: tag ${result.tag || '(missing)'}, facade ${result.version ?? '(missing)'}`,
)

if (result.problems.length === 0) {
  console.log(`✓ tag ${result.tag} matches the facade version`)
  process.exit(0)
}

console.error('')
console.error('✗ release tag problem:')
console.error('')
for (const problem of result.problems) {
  console.error(`  ${formatReleaseProblem(problem, root)}`)
}
process.exit(1)
