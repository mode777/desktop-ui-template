import { gzipSync } from 'node:zlib'

// Gzip is computed in-process so the numbers do not depend on a system gzip
// binary. Level 9 keeps the report comparable across runs and matches the
// budget tolerance recorded in budgets.json.
const GZIP_LEVEL = 9

const KIND_BY_EXTENSION = new Map([
  ['.js', 'js'],
  ['.mjs', 'js'],
  ['.css', 'css'],
])

export const KINDS = ['js', 'css']

export function assetKind(name) {
  const match = /\.[^.]+$/.exec(name)
  return match ? (KIND_BY_EXTENSION.get(match[0]) ?? null) : null
}

export function measureAsset(name, contents) {
  return {
    name,
    kind: assetKind(name),
    raw: contents.length,
    gzip: gzipSync(contents, { level: GZIP_LEVEL }).length,
  }
}

function emptyTotal() {
  return { raw: 0, gzip: 0, count: 0 }
}

/**
 * Sums measured assets into JavaScript and CSS totals.
 * Assets that are neither (fonts, HTML, images) are counted separately so the
 * report can state that they are tracked outside the budget.
 */
export function summarizeAssets(assets) {
  const measured = assets
    .map((asset) => ({
      ...asset,
      kind: asset.kind === undefined ? assetKind(asset.name) : asset.kind,
    }))
    .filter((asset) => asset.kind === 'js' || asset.kind === 'css')

  const totals = { js: emptyTotal(), css: emptyTotal() }
  for (const asset of measured) {
    const total = totals[asset.kind]
    total.raw += asset.raw
    total.gzip += asset.gzip
    total.count += 1
  }

  const other = assets.filter((asset) => asset.kind !== 'js' && asset.kind !== 'css')

  return {
    assets: measured.sort((a, b) => b.raw - a.raw),
    totals,
    other: {
      count: other.length,
      raw: other.reduce((sum, asset) => sum + asset.raw, 0),
    },
  }
}

export function formatBytes(bytes) {
  const kib = bytes / 1024
  return `${bytes.toLocaleString('en-US')} B (${kib.toFixed(1)} KiB)`
}

/**
 * Builds the machine-readable report for one build target. Keeping the target
 * and comparison metadata here makes the CLI thin and the report shape testable.
 */
export function createReport({
  target = 'full-preset',
  generatedAt = new Date().toISOString(),
  build = 'build',
  summary,
  comparison,
}) {
  return {
    generatedAt,
    target,
    build,
    ...summary,
    ...(comparison ? { comparison } : {}),
  }
}

/**
 * Compares a measured target's gzipped JavaScript with another budget's
 * recorded baseline, so the minimal example can state its ratio to the preset.
 */
export function compareToBudget(report, comparisonBudget) {
  const measured = report?.totals?.js?.gzip
  const reference = comparisonBudget?.budgets?.js?.gzip
  if (typeof measured !== 'number' || typeof reference !== 'number' || reference <= 0) {
    return null
  }
  return {
    baseline: comparisonBudget.baseline ?? 'comparison build',
    jsGzip: measured,
    referenceGzip: reference,
    ratio: measured / reference,
  }
}

function pad(value, width) {
  return String(value).padStart(width)
}

export function formatTable(report) {
  const totals = KINDS.map((kind) => {
    const total = report.totals[kind]
    return {
      kind,
      total,
      label: `${kind === 'js' ? 'JavaScript' : 'CSS'} total (${total.count} asset${
        total.count === 1 ? '' : 's'
      })`,
    }
  })

  const nameWidth = Math.max(
    12,
    ...report.assets.map((asset) => asset.name.length),
    ...totals.map((entry) => entry.label.length),
  )
  const rawWidth = Math.max(10, ...report.assets.map((asset) => formatBytes(asset.raw).length))
  const gzipWidth = Math.max(10, ...report.assets.map((asset) => formatBytes(asset.gzip).length))

  const lines = [
    ...(report.target ? [`Target: ${report.target}`, ''] : []),
    `${'Asset'.padEnd(nameWidth)} ${pad('Raw', rawWidth)} ${pad('Gzip', gzipWidth)}`,
    `${'-'.repeat(nameWidth)} ${'-'.repeat(rawWidth)} ${'-'.repeat(gzipWidth)}`,
  ]

  for (const asset of report.assets) {
    lines.push(
      `${asset.name.padEnd(nameWidth)} ${pad(formatBytes(asset.raw), rawWidth)} ${pad(
        formatBytes(asset.gzip),
        gzipWidth,
      )}`,
    )
  }

  for (const { total, label } of totals) {
    lines.push(
      `${label.padEnd(nameWidth)} ${pad(formatBytes(total.raw), rawWidth)} ${pad(
        formatBytes(total.gzip),
        gzipWidth,
      )}`,
    )
  }

  lines.push(
    '',
    report.other.count === 0
      ? 'No other emitted files were found next to the scripts and styles.'
      : `Tracked separately: ${report.other.count} other emitted file${
          report.other.count === 1 ? '' : 's'
        } (${formatBytes(report.other.raw)}) such as the Codicon font and HTML.`,
  )

  return lines.join('\n')
}

export function allowedBudget(recorded, tolerance = {}) {
  const percent = typeof tolerance.percent === 'number' ? tolerance.percent : 0
  const minBytes = typeof tolerance.minBytes === 'number' ? tolerance.minBytes : 0
  return recorded + Math.max(Math.ceil((recorded * percent) / 100), minBytes)
}

function verdictFor(enforcement, kind) {
  return enforcement?.[kind] === 'warn' ? 'warn' : 'fail'
}

/**
 * Compares measured totals with the recorded budgets. Each kind is evaluated
 * on both raw and gzip; the worst metric decides the kind's verdict.
 */
export function evaluateBudget(report, budget) {
  const checks = []

  for (const kind of KINDS) {
    for (const metric of ['raw', 'gzip']) {
      const recorded = budget.budgets?.[kind]?.[metric]
      if (typeof recorded !== 'number') continue

      const measured = report.totals[kind][metric]
      const allowed = allowedBudget(recorded, budget.tolerance)
      const over = Math.max(0, measured - allowed)

      checks.push({
        kind,
        metric,
        recorded,
        allowed,
        measured,
        over,
        headroom: Math.max(0, allowed - measured),
        verdict: over > 0 ? verdictFor(budget.enforcement, kind) : 'pass',
      })
    }
  }

  const verdict = checks.some((check) => check.verdict === 'fail')
    ? 'fail'
    : checks.some((check) => check.verdict === 'warn')
      ? 'warn'
      : 'pass'

  return { verdict, checks }
}

function kindLabel(kind) {
  return kind === 'js' ? 'JavaScript' : 'CSS'
}

export function formatVerdicts(result, budget) {
  const lines = []

  for (const kind of KINDS) {
    const checks = result.checks.filter((check) => check.kind === kind)
    if (checks.length === 0) continue

    const failing = checks.find((check) => check.verdict === 'fail')
    const warning = checks.find((check) => check.verdict === 'warn')
    const worst = failing ?? warning

    if (!worst) {
      const gzip = checks.find((check) => check.metric === 'gzip')
      const headroom = gzip ? ` — ${formatBytes(gzip.headroom)} gzip headroom` : ''
      lines.push(`✓ ${kindLabel(kind)} within budget${headroom}`)
      continue
    }

    const details = checks
      .map(
        (check) =>
          `${check.metric} ${formatBytes(check.measured)} vs ${formatBytes(
            check.allowed,
          )} allowed (${formatBytes(check.over)} over, baseline ${formatBytes(check.recorded)})`,
      )
      .join('; ')
    const marker = worst.verdict === 'fail' ? '✗' : '!'
    const suffix =
      worst.verdict === 'warn' && budget.enforcement?.[kind] === 'warn'
        ? ' — warning only in this phase'
        : ''
    lines.push(`${marker} ${kindLabel(kind)} over budget: ${details}${suffix}`)
  }

  return lines.join('\n')
}

export function formatLargestAssets(report, limit = 5) {
  const largest = report.assets.slice(0, limit)
  if (largest.length === 0) return 'No JavaScript or CSS assets were found in the build output.'
  return largest
    .map(
      (asset) => `  ${asset.name}  ${formatBytes(asset.raw)} raw / ${formatBytes(asset.gzip)} gzip`,
    )
    .join('\n')
}

export function formatMarkdownSummary(report, result) {
  const rows = []

  if (report.target) {
    rows.push(`**Target:** \`${report.target}\``, '')
  }

  rows.push(
    '| Kind | Measured raw | Measured gzip | Budget raw | Budget gzip | Verdict |',
    '| --- | ---: | ---: | ---: | ---: | --- |',
  )

  for (const kind of KINDS) {
    const raw = result.checks.find((check) => check.kind === kind && check.metric === 'raw')
    const gzip = result.checks.find((check) => check.kind === kind && check.metric === 'gzip')
    if (!raw || !gzip) continue
    const verdict = raw.verdict === 'fail' || gzip.verdict === 'fail' ? 'fail' : gzip.verdict
    rows.push(
      `| ${kindLabel(kind)} | ${formatBytes(report.totals[kind].raw)} | ${formatBytes(
        report.totals[kind].gzip,
      )} | ${formatBytes(raw.recorded)} | ${formatBytes(gzip.recorded)} | ${verdict} |`,
    )
  }

  rows.push('', `Overall verdict: **${result.verdict}**.`)

  if (report.comparison) {
    const percent = (report.comparison.ratio * 100).toFixed(1)
    rows.push(
      `Measured JavaScript is ${percent} % of ${report.comparison.baseline} ` +
        `(${formatBytes(report.comparison.jsGzip)} vs ${formatBytes(
          report.comparison.referenceGzip,
        )} gzip).`,
    )
  }

  return rows.join('\n')
}
