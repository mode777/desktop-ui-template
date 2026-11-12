// @vitest-environment node
import { describe, expect, it } from 'vitest'

import {
  allowedBudget,
  assetKind,
  compareToBudget,
  createReport,
  evaluateBudget,
  formatBytes,
  formatMarkdownSummary,
  formatTable,
  formatVerdicts,
  measureAsset,
  summarizeAssets,
} from './size-report.mjs'

describe('assetKind', () => {
  it('classifies scripts and styles and ignores other emitted files', () => {
    expect(assetKind('index-abc123.js')).toBe('js')
    expect(assetKind('chunk.mjs')).toBe('js')
    expect(assetKind('index-abc123.css')).toBe('css')
    expect(assetKind('codicon.ttf')).toBeNull()
    expect(assetKind('index.html')).toBeNull()
  })
})

describe('measureAsset', () => {
  it('reports raw and gzip sizes for the same content', () => {
    const source = 'console.log("hello")\n'.repeat(200)
    const measured = measureAsset('app.js', Buffer.from(source))

    expect(measured.raw).toBe(source.length)
    expect(measured.gzip).toBeGreaterThan(0)
    expect(measured.gzip).toBeLessThan(measured.raw)
    expect(measured.kind).toBe('js')
  })
})

describe('summarizeAssets', () => {
  it('totals JavaScript and CSS separately and sorts assets by raw size', () => {
    const summary = summarizeAssets([
      { name: 'small.js', kind: 'js', raw: 10, gzip: 5 },
      { name: 'big.css', kind: 'css', raw: 100, gzip: 20 },
      { name: 'big.js', kind: 'js', raw: 50, gzip: 15 },
    ])

    expect(summary.totals.js).toEqual({ raw: 60, gzip: 20, count: 2 })
    expect(summary.totals.css).toEqual({ raw: 100, gzip: 20, count: 1 })
    expect(summary.assets.map((asset) => asset.name)).toEqual(['big.css', 'big.js', 'small.js'])
  })

  it('counts fonts and HTML as separately tracked assets', () => {
    const summary = summarizeAssets([
      { name: 'index-abc.js', kind: 'js', raw: 10, gzip: 5 },
      { name: 'codicon.ttf', kind: null, raw: 125_828, gzip: 0 },
      { name: 'index.html', kind: null, raw: 1_576, gzip: 0 },
    ])

    expect(summary.totals.js.raw).toBe(10)
    expect(summary.totals.css).toEqual({ raw: 0, gzip: 0, count: 0 })
    expect(summary.other).toEqual({ count: 2, raw: 127_404 })
  })

  it('handles an empty build output without inventing totals', () => {
    const summary = summarizeAssets([])

    expect(summary.assets).toEqual([])
    expect(summary.totals.js).toEqual({ raw: 0, gzip: 0, count: 0 })
    expect(summary.other).toEqual({ count: 0, raw: 0 })
  })
})

describe('formatTable', () => {
  it('lists every asset and both kind totals', () => {
    const table = formatTable(
      summarizeAssets([
        { name: 'index-abc.js', kind: 'js', raw: 417_839, gzip: 115_252 },
        { name: 'index-abc.css', kind: 'css', raw: 44_445, gzip: 8_147 },
        { name: 'codicon.ttf', kind: null, raw: 125_828, gzip: 0 },
      ]),
    )

    expect(table).toContain('index-abc.js')
    expect(table).toContain('JavaScript total (1 asset)')
    expect(table).toContain('CSS total (1 asset)')
    expect(table).toContain('Tracked separately: 1 other emitted file')
    expect(table).toContain(formatBytes(115_252))
  })

  it('labels the measured build target when the report carries one', () => {
    const table = formatTable({
      target: 'minimal-example',
      ...summarizeAssets([{ name: 'index-abc.js', kind: 'js', raw: 1_000, gzip: 400 }]),
    })

    expect(table).toContain('Target: minimal-example')
  })
})

describe('createReport', () => {
  const summary = summarizeAssets([{ name: 'index-abc.js', kind: 'js', raw: 1_000, gzip: 400 }])

  it('records the target, build command and summary metadata', () => {
    const report = createReport({
      target: 'minimal-example',
      generatedAt: '2026-01-01T00:00:00.000Z',
      build: 'npm run build:minimal',
      summary,
    })

    expect(report).toMatchObject({
      target: 'minimal-example',
      generatedAt: '2026-01-01T00:00:00.000Z',
      build: 'npm run build:minimal',
      totals: summary.totals,
    })
    expect(report).not.toHaveProperty('comparison')
  })

  it('attaches an optional comparison against another budget', () => {
    const report = createReport({
      target: 'minimal-example',
      summary,
      comparison: compareToBudget(summary, {
        baseline: 'full preset',
        budgets: { js: { raw: 4_000, gzip: 2_000 } },
      }),
    })

    expect(report.comparison).toEqual({
      baseline: 'full preset',
      jsGzip: 400,
      referenceGzip: 2_000,
      ratio: 0.2,
    })
  })
})

describe('compareToBudget', () => {
  it('returns null when either side has no recorded gzip value', () => {
    expect(compareToBudget({ totals: { js: { gzip: 400 } } }, { budgets: { js: {} } })).toBeNull()
  })
})

const baselineBudget = {
  tolerance: { percent: 1, minBytes: 1024 },
  enforcement: { js: 'fail', css: 'warn' },
  budgets: {
    js: { raw: 417_839, gzip: 115_252 },
    css: { raw: 44_445, gzip: 8_147 },
  },
}

function reportWith({ jsRaw = 417_839, jsGzip = 115_252, cssRaw = 44_445, cssGzip = 8_147 } = {}) {
  return {
    assets: [
      { name: 'index-abc.js', kind: 'js', raw: jsRaw, gzip: jsGzip },
      { name: 'index-abc.css', kind: 'css', raw: cssRaw, gzip: cssGzip },
    ],
    totals: {
      js: { raw: jsRaw, gzip: jsGzip, count: 1 },
      css: { raw: cssRaw, gzip: cssGzip, count: 1 },
    },
    other: { count: 0, raw: 0 },
  }
}

describe('allowedBudget', () => {
  it('adds the larger of the percentage and the byte floor', () => {
    expect(allowedBudget(100_000, { percent: 1, minBytes: 1024 })).toBe(101_024)
    expect(allowedBudget(10_000, { percent: 1, minBytes: 1024 })).toBe(11_024)
    expect(allowedBudget(100, {})).toBe(100)
  })
})

describe('evaluateBudget', () => {
  it('passes a build that matches the baseline and reports headroom', () => {
    const result = evaluateBudget(reportWith(), baselineBudget)

    expect(result.verdict).toBe('pass')
    expect(result.checks.every((check) => check.verdict === 'pass')).toBe(true)
    expect(
      result.checks.find((check) => check.kind === 'js' && check.metric === 'gzip').headroom,
    ).toBe(allowedBudget(115_252, baselineBudget.tolerance) - 115_252)
  })

  it('tolerates drift within the recorded tolerance', () => {
    const result = evaluateBudget(reportWith({ jsGzip: 115_252 + 900 }), baselineBudget)

    expect(result.verdict).toBe('pass')
    expect(result.checks.filter((check) => check.verdict !== 'pass')).toEqual([])
  })

  it('fails when gzipped JavaScript exceeds the budget plus tolerance', () => {
    const result = evaluateBudget(reportWith({ jsGzip: 130_000 }), baselineBudget)

    expect(result.verdict).toBe('fail')
    const failing = result.checks.filter((check) => check.verdict === 'fail')
    expect(failing).toHaveLength(1)
    expect(failing[0]).toMatchObject({ kind: 'js', metric: 'gzip', measured: 130_000 })
    expect(failing[0].over).toBeGreaterThan(0)
  })

  it('warns instead of failing when only CSS exceeds the budget', () => {
    const result = evaluateBudget(reportWith({ cssGzip: 12_000 }), baselineBudget)

    expect(result.verdict).toBe('warn')
    expect(result.checks.filter((check) => check.verdict === 'fail')).toEqual([])
    expect(formatVerdicts(result, baselineBudget)).toContain('warning only in this phase')
  })

  it('formats failing verdicts with measured, budget and overage values', () => {
    const result = evaluateBudget(reportWith({ jsGzip: 130_000 }), baselineBudget)
    const output = formatVerdicts(result, baselineBudget)

    expect(output).toContain('JavaScript over budget')
    expect(output).toContain(formatBytes(130_000))
    expect(output).toContain('over')
  })

  it('renders a Markdown summary for the CI job summary', () => {
    const result = evaluateBudget(reportWith(), baselineBudget)
    const summary = formatMarkdownSummary(reportWith(), result)

    expect(summary).toContain('| JavaScript |')
    expect(summary).toContain('| CSS |')
    expect(summary).toContain('Overall verdict: **pass**')
  })

  it('includes the target and comparison ratio in the Markdown summary', () => {
    const report = {
      target: 'minimal-example',
      comparison: {
        baseline: 'full preset',
        jsGzip: 400,
        referenceGzip: 2_000,
        ratio: 0.2,
      },
      ...reportWith(),
    }
    const result = evaluateBudget(report, baselineBudget)
    const summary = formatMarkdownSummary(report, result)

    expect(summary).toContain('**Target:** `minimal-example`')
    expect(summary).toContain('Measured JavaScript is 20.0 % of full preset')
  })
})
