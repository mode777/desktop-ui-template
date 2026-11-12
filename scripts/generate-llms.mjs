import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { renderLlmsFull, renderLlmsIndex, validateManifest } from './lib/llms.mjs'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const packageDir = resolve(repoRoot, 'packages/workbench')
const docsDir = resolve(packageDir, 'docs')
const manifestPath = resolve(docsDir, 'manifest.json')
const args = process.argv.slice(2)

function readFlag(name, fallback) {
  const index = args.indexOf(name)
  return index === -1 ? fallback : args[index + 1]
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/generate-llms.mjs [options]

Reads packages/workbench/docs/manifest.json and writes the package llms.txt.
With --site-dir, also writes llms.txt and llms-full.txt for the hosted site.

Options:
  --site-dir <dir>  Directory for the site copies, relative to the repository root.
  -h, --help        Show this help.
`)
  process.exit(0)
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const problems = validateManifest(manifest)

if (problems.length > 0) {
  console.error('Cannot generate llms.txt:')
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

const readPage = (path) => readFileSync(resolve(docsDir, path), 'utf8')
const index = renderLlmsIndex(manifest)
const packageIndexPath = resolve(packageDir, 'llms.txt')

writeFileSync(packageIndexPath, index)
console.log(`Wrote ${packageIndexPath}`)

const siteDir = readFlag('--site-dir', null)
if (siteDir) {
  const outputDir = resolve(repoRoot, siteDir)
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })
  writeFileSync(resolve(outputDir, 'llms.txt'), index)
  writeFileSync(resolve(outputDir, 'llms-full.txt'), renderLlmsFull(manifest, readPage))
  console.log(`Wrote ${outputDir}/llms.txt and llms-full.txt`)
}
