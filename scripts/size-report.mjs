import { execFileSync } from 'node:child_process'
import {
  appendFileSync,
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  compareToBudget,
  createReport,
  evaluateBudget,
  formatBytes,
  formatLargestAssets,
  formatMarkdownSummary,
  formatTable,
  formatVerdicts,
  measureAsset,
  summarizeAssets,
} from './lib/size-report.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)

function readFlag(name) {
  const index = args.indexOf(name)
  return index === -1 ? undefined : args[index + 1]
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/size-report.mjs [options]

Options:
  --target <name>    Build target recorded in the report. Defaults to full-preset.
  --dist <dir>       Build output to measure. Defaults to apps/template/dist.
  --build <script>   npm script to run before measuring. Defaults to build.
  --no-build         Reuse the existing --dist output instead of running the build.
  --compare <file>   Budget file to compare gzipped JavaScript against (e.g. budgets.json).
  --summary <file>   Append a Markdown table to the given file (e.g. $GITHUB_STEP_SUMMARY).
  --budget <file>    Budget file to compare against. Defaults to budgets.json.
  --report <file>    Report output path. Defaults to size-report.json.
  -h, --help         Show this help.
`)
  process.exit(0)
}

const noBuild = args.includes('--no-build')
const target = readFlag('--target') ?? 'full-preset'
const buildScript = readFlag('--build') ?? 'build'
const distPath = resolve(root, readFlag('--dist') ?? 'apps/template/dist')
const distLabel = relative(root, distPath).split(sep).join('/') || '.'
const budgetPath = resolve(root, readFlag('--budget') ?? 'budgets.json')
const reportPath = resolve(root, readFlag('--report') ?? 'size-report.json')
const comparisonPath = readFlag('--compare')
const summaryPath = readFlag('--summary')

function fail(message) {
  console.error(`✗ ${message}`)
  process.exit(1)
}

if (!noBuild) {
  console.log(`Building the ${target} production bundle before measuring…`)
  try {
    execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', buildScript], {
      cwd: root,
      stdio: 'inherit',
    })
  } catch {
    fail(`The ${target} production build failed, so there is nothing to measure.`)
  }
}

const assetsDir = join(distPath, 'assets')
if (!existsSync(assetsDir)) {
  fail(`No build output found at ${distLabel}/assets. Run without --no-build to build first.`)
}

const measured = []

for (const name of readdirSync(assetsDir).sort()) {
  const path = join(assetsDir, name)
  if (!statSync(path).isFile()) continue
  measured.push(measureAsset(name, readFileSync(path)))
}

function collectOtherFiles(dirPath, prefix) {
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const absolutePath = join(dirPath, entry.name)
    if (absolutePath === assetsDir) continue

    const name = `${prefix}/${entry.name}`
    if (entry.isDirectory()) {
      collectOtherFiles(absolutePath, name)
      continue
    }

    measured.push({ name, kind: null, raw: readFileSync(absolutePath).length })
  }
}

collectOtherFiles(distPath, distLabel)

const summary = summarizeAssets(measured)

let budget
try {
  budget = JSON.parse(readFileSync(budgetPath, 'utf8'))
} catch (error) {
  fail(`Could not read the budget file at ${budgetPath}: ${error.message}`)
}

let comparison
if (comparisonPath) {
  try {
    comparison = compareToBudget(
      summary,
      JSON.parse(readFileSync(resolve(root, comparisonPath), 'utf8')),
    )
  } catch (error) {
    fail(`Could not read the comparison budget at ${comparisonPath}: ${error.message}`)
  }
  if (!comparison) {
    fail(`The comparison budget at ${comparisonPath} has no recorded JavaScript gzip value.`)
  }
}

const report = createReport({
  target,
  build: noBuild ? `reused ${distLabel}/` : `npm run ${buildScript}`,
  summary,
  comparison,
})

const result = evaluateBudget(report, budget)

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)

console.log('')
console.log(formatTable(report))
console.log('')
console.log(formatVerdicts(result, budget))

if (report.comparison) {
  console.log('')
  console.log(
    `${target} JavaScript is ${(report.comparison.ratio * 100).toFixed(1)} % of ` +
      `${report.comparison.baseline} (${formatBytes(report.comparison.jsGzip)} vs ` +
      `${formatBytes(report.comparison.referenceGzip)} gzip).`,
  )
}

if (result.verdict === 'fail') {
  console.log('')
  console.log('Largest assets, for attribution:')
  console.log(formatLargestAssets(report))
}

console.log('')
console.log(`Report written to ${reportPath}`)

if (summaryPath) {
  appendFileSync(
    resolve(root, summaryPath),
    `\n### Bundle size: ${target}\n\n${formatMarkdownSummary(report, result)}\n`,
  )
}

process.exit(result.verdict === 'fail' ? 1 : 0)
