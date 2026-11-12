import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { renderLlmsIndex } from './lib/llms.mjs'
import {
  collectPublicValueExports,
  consumerDocumentationFiles,
  consumerDocsDir,
  contributorDocumentationFiles,
  consumerReferenceText,
  extractMarkdownLinks,
  extractNpmRunScripts,
  extractPublishedSpecifiers,
  findConsumerBoundaryProblems,
  findLlmsProblems,
  findManifestProblems,
  formatDocProblem,
  missingExportMentions,
  readDocsManifest,
  resolveDocLink,
  specifierToExportKey,
} from './lib/docs.mjs'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/check-docs.mjs [options]

Options:
  --scope <contributor|consumer|all>  Documentation tree to check. Defaults to all.
  --repo-root <dir>                   Repository root to check. Defaults to this checkout.
  -h, --help                          Show this help.

Checks relative Markdown links, documented npm scripts, published package
specifiers, the consumer boundary, manifest coverage, llms.txt links and API
export coverage.

Exit codes: 0 when the documentation is consistent, 1 on any problem.
`)
  process.exit(0)
}

const readFlag = (name, fallback) => {
  const index = args.indexOf(name)
  return index === -1 ? fallback : args[index + 1]
}

const scope = readFlag('--scope', 'all')
if (!['contributor', 'consumer', 'all'].includes(scope)) {
  console.error(`Unknown documentation scope "${scope}". Use contributor, consumer or all.`)
  process.exit(1)
}

const root = resolve(repoRoot, readFlag('--repo-root', repoRoot))
const rootManifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const facadeManifest = JSON.parse(
  readFileSync(resolve(root, 'packages/workbench/package.json'), 'utf8'),
)
const rootScripts = new Set(Object.keys(rootManifest.scripts ?? {}))
const exportKeys = new Set(Object.keys(facadeManifest.exports ?? {}))
const problems = []
const stats = { files: 0, links: 0, scripts: 0, specifiers: 0 }

function checkFiles(files) {
  stats.files += files.length

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
}

function checkApiCoverage() {
  const referenceText = consumerReferenceText(root)
  const apiPath = resolve(consumerDocsDir(root), 'reference/api.md')
  const exportGroups = collectPublicValueExports(root)

  for (const entry of missingExportMentions(exportGroups, referenceText)) {
    problems.push({
      file: apiPath,
      line: 1,
      message: `Public value export "${entry.name}" (${entry.group}) is not mentioned in the consumer reference.`,
    })
  }

  for (const key of exportKeys) {
    const specifier = key === '.' ? 'vscode-workbench' : `vscode-workbench${key.slice(1)}`
    if (!referenceText.includes(specifier)) {
      problems.push({
        file: apiPath,
        line: 1,
        message: `Public export key "${key}" is not documented in the consumer reference.`,
      })
    }
  }

  const exportCount = Object.values(exportGroups).reduce((total, names) => total + names.length, 0)
  return { exportCount, exportKeys: exportKeys.size }
}

let exportCount = 0
let exportKeyCount = 0

if (scope === 'contributor' || scope === 'all') {
  checkFiles(contributorDocumentationFiles(root))
}

if (scope === 'consumer' || scope === 'all') {
  const files = consumerDocumentationFiles(root)
  checkFiles(files)
  problems.push(...findConsumerBoundaryProblems({ repoRoot: root, files }))

  const manifest = readDocsManifest(root)
  problems.push(...findManifestProblems({ repoRoot: root, manifest }))

  const llmsPath = resolve(root, 'packages/workbench/llms.txt')
  if (existsSync(llmsPath)) {
    const llmsText = readFileSync(llmsPath, 'utf8')
    problems.push(
      ...findLlmsProblems({
        docsDir: consumerDocsDir(root),
        manifest,
        llmsText,
      }),
    )

    if (llmsText !== renderLlmsIndex(manifest)) {
      problems.push({
        file: llmsPath,
        line: 1,
        message: 'llms.txt is out of date; run "npm run generate:llms".',
      })
    }
  }

  const coverage = checkApiCoverage()
  exportCount = coverage.exportCount
  exportKeyCount = coverage.exportKeys
}

console.log(
  `Documentation check (${scope}): ${stats.files} files, ${stats.links} relative links, ${stats.scripts} script references, ${stats.specifiers} public specifiers` +
    (scope === 'contributor'
      ? ''
      : `, ${exportCount} value exports, ${exportKeyCount} export keys`),
)

if (problems.length === 0) {
  console.log(
    '✓ documentation links, scripts, specifiers, boundary, manifest and API coverage are consistent',
  )
  process.exit(0)
}

console.error('')
console.error(`✗ ${problems.length} documentation problem${problems.length === 1 ? '' : 's'}:`)
console.error('')

for (const problem of problems) console.error(`  ${formatDocProblem(problem, root)}`)

process.exit(1)
