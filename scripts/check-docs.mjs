import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  collectPublicValueExports,
  documentationFiles,
  extractMarkdownLinks,
  extractNpmRunScripts,
  extractPublishedSpecifiers,
  formatDocProblem,
  missingExportMentions,
  resolveDocLink,
  specifierToExportKey,
} from './lib/docs.mjs'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/check-docs.mjs [options]

Options:
  --repo-root <dir>  Repository root to check. Defaults to this checkout.
  -h, --help         Show this help.

Checks relative Markdown links, documented npm scripts, published package
specifiers and docs/api.md coverage of public value exports and export keys.

Exit codes: 0 when the documentation is consistent, 1 on any problem.
`)
  process.exit(0)
}

const readFlag = (name, fallback) => {
  const index = args.indexOf(name)
  return index === -1 ? fallback : args[index + 1]
}

const root = resolve(repoRoot, readFlag('--repo-root', repoRoot))
const rootManifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const facadeManifest = JSON.parse(
  readFileSync(resolve(root, 'packages/workbench/package.json'), 'utf8'),
)
const rootScripts = new Set(Object.keys(rootManifest.scripts ?? {}))
const exportKeys = new Set(Object.keys(facadeManifest.exports ?? {}))
const files = documentationFiles(root)
const problems = []
const stats = { links: 0, scripts: 0, specifiers: 0 }

for (const file of files) {
  const content = readFileSync(file, 'utf8')

  for (const link of extractMarkdownLinks(content)) {
    const target = resolveDocLink(file, link.target, root)
    if (target === null) continue
    stats.links += 1
    if (!existsSync(target)) {
      problems.push({
        file,
        line: link.line,
        message: `Broken relative link "${link.target}".`,
      })
    }
  }

  for (const { script, line } of extractNpmRunScripts(content)) {
    stats.scripts += 1
    if (!rootScripts.has(script)) {
      problems.push({
        file,
        line,
        message: `Documented script "npm run ${script}" does not exist in the root package.json.`,
      })
    }
  }

  for (const { specifier, line } of extractPublishedSpecifiers(content)) {
    stats.specifiers += 1
    const key = specifierToExportKey(specifier)
    if (key === null || !exportKeys.has(key)) {
      problems.push({
        file,
        line,
        message: `Documented specifier "${specifier}" is not in the public export map.`,
      })
    }
  }
}

const apiPath = resolve(root, 'docs/api.md')
const apiText = existsSync(apiPath) ? readFileSync(apiPath, 'utf8') : ''
const exportGroups = collectPublicValueExports(root)

for (const entry of missingExportMentions(exportGroups, apiText)) {
  problems.push({
    file: apiPath,
    line: 1,
    message: `Public value export "${entry.name}" (${entry.group}) is not mentioned in docs/api.md.`,
  })
}

for (const key of exportKeys) {
  const specifier =
    key === '.' ? '@workbench-kit/workbench' : `@workbench-kit/workbench${key.slice(1)}`
  if (!apiText.includes(specifier)) {
    problems.push({
      file: apiPath,
      line: 1,
      message: `Public export key "${key}" is not documented in docs/api.md.`,
    })
  }
}

const exportCount = Object.values(exportGroups).reduce((total, names) => total + names.length, 0)

console.log(
  `Documentation check: ${files.length} files, ${stats.links} relative links, ${stats.scripts} script references, ${stats.specifiers} public specifiers, ${exportCount} value exports, ${exportKeys.size} export keys`,
)

if (problems.length === 0) {
  console.log('✓ documentation links, scripts, specifiers and API coverage are consistent')
  process.exit(0)
}

console.error('')
console.error(`✗ ${problems.length} documentation problem${problems.length === 1 ? '' : 's'}:`)
console.error('')

for (const problem of problems) console.error(`  ${formatDocProblem(problem, root)}`)

process.exit(1)
