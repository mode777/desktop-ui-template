import { existsSync } from 'node:fs'
import { basename, dirname, extname, join, normalize, relative, sep } from 'node:path'

const EXCLUDED_FILE_PATTERNS = [
  /(^|\/)component-test-fixtures\.[^/]+$/,
  /(^|\/).+\.test\.[^/]+$/,
  /(^|\/).+\.spec\.[^/]+$/,
  /(^|\/).+\.map$/,
  /(^|\/)\.tsbuildinfo$/,
]

const SPECIFIER_PATTERN = /((?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*))(['"])([^'"]+)\2/g

export class FacadeBuildError extends Error {
  constructor(message) {
    super(message)
    this.name = 'FacadeBuildError'
  }
}

function toPosix(path) {
  return path.split(sep).join('/')
}

function relativeSpecifier(fromFile, target) {
  const fromDirectory = dirname(toPosix(fromFile))
  let specifier = toPosix(relative(fromDirectory === '.' ? '' : fromDirectory, target))

  if (!specifier.startsWith('.')) specifier = `./${specifier}`
  return specifier
}

function packageSpecifierTarget(specifier) {
  const match = /^@workbench-kit\/(core|react|elements|styles-vscode)(?:\/(.+))?$/.exec(specifier)
  if (!match) return null

  const [, moduleName, rest] = match

  if (moduleName === 'styles-vscode') {
    return rest ? `styles/${rest}` : 'styles/index.css'
  }

  if (moduleName === 'elements') {
    if (!rest) return 'elements/all.js'
    if (rest === 'types') return 'elements/global.d.ts'
    return rest.includes('.') ? `elements/${rest}` : `elements/${rest}.js`
  }

  if (moduleName === 'core' || moduleName === 'react') {
    return rest ? `${moduleName}/${rest}` : `${moduleName}/index.js`
  }

  return null
}

function rewriteOne(specifier, file, fileExists) {
  const packageTarget = packageSpecifierTarget(specifier)
  if (packageTarget) return relativeSpecifier(file, packageTarget)

  if (/^@vscode-elements\/elements\/dist\/[^/]+$/.test(specifier)) return `${specifier}/index.js`

  if (!specifier.startsWith('.')) return specifier
  if (extname(specifier)) return specifier

  const fromDirectory = dirname(toPosix(file))
  const target = normalize(join(fromDirectory === '.' ? '' : fromDirectory, specifier))

  if (fileExists(`${target}.js`)) return `${specifier}.js`
  if (fileExists(`${target}/index.js`)) return `${specifier}/index.js`

  throw new FacadeBuildError(
    `Cannot resolve relative import "${specifier}" from ${file} inside the facade output.`,
  )
}

export function isFacadeFile(path) {
  const normalised = toPosix(path)
  return !EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(normalised))
}

export function rewriteSpecifiers(code, file, { facadeRoot, fileExists } = {}) {
  const exists = fileExists ?? ((target) => existsSync(join(facadeRoot, target)))

  return code.replace(SPECIFIER_PATTERN, (match, prefix, quote, specifier) => {
    const rewritten = rewriteOne(specifier, file, exists)
    return `${prefix}${quote}${rewritten}${quote}`
  })
}

export function stripSourceMapComments(code) {
  return code.replace(/^[ \t]*\/\/[#@]\s*sourceMappingURL=.*(?:\r?\n)?/gm, '')
}

function normaliseTarget(target) {
  return target.replace(/^\.\//, '')
}

function collectExportTargets(value, subpath, condition, targets) {
  if (typeof value === 'string') {
    targets.push({ subpath, condition, target: normaliseTarget(value) })
    return
  }

  if (!value || typeof value !== 'object') return

  for (const [key, nested] of Object.entries(value)) {
    collectExportTargets(nested, subpath, key, targets)
  }
}

export function exportTargets(manifest) {
  const targets = []

  for (const [subpath, value] of Object.entries(manifest.exports ?? {})) {
    collectExportTargets(value, subpath, 'default', targets)
  }

  return targets
}

export function validateExportTargets(manifest, fileExists) {
  return exportTargets(manifest)
    .filter(({ target }) => !fileExists(target))
    .map(({ subpath, condition, target }) => ({
      subpath,
      condition,
      target,
      message: `Export "${subpath}" (${condition}) points at missing file ${target}.`,
    }))
}

export function missingElementExports(manifest, elementFiles) {
  const exported = new Set(Object.keys(manifest.exports ?? {}))

  return elementFiles
    .filter((file) => file.endsWith('.js') && file !== 'all.js')
    .map((file) => file.slice(0, -'.js'.length))
    .filter((tag) => !exported.has(`./elements/${tag}`))
}

export function missingTypesConditions(manifest) {
  const missing = []

  for (const [subpath, value] of Object.entries(manifest.exports ?? {})) {
    if (typeof value === 'string') {
      if (value.endsWith('.js')) missing.push(subpath)
      continue
    }

    if (!value || typeof value !== 'object') continue

    const hasJavaScript = Object.values(value).some(
      (target) => typeof target === 'string' && target.endsWith('.js'),
    )

    if (hasJavaScript && typeof value.types !== 'string') missing.push(subpath)
  }

  return missing
}

function collectStylesheetTargets(value, targets) {
  if (typeof value === 'string') {
    if (value.endsWith('.css')) targets.add(normaliseTarget(value))
    return
  }

  if (!value || typeof value !== 'object') return

  for (const nested of Object.values(value)) collectStylesheetTargets(nested, targets)
}

/**
 * Derives the flat facade stylesheet copy list from a styles package manifest.
 *
 * Every declared CSS target is copied to `styles/<basename>` so the aggregate
 * stylesheet's relative `@import` paths keep resolving inside the facade.
 * Duplicate export keys that point at the same file are copied once; two
 * different files with the same basename are a hard error because they would
 * collide in the generated directory.
 */
export function stylesheetEntries(manifest) {
  const entries = new Map()

  for (const [subpath, value] of Object.entries(manifest.exports ?? {})) {
    const sources = new Set()
    collectStylesheetTargets(value, sources)

    for (const source of sources) {
      const target = `styles/${basename(source)}`
      const existing = entries.get(target)

      if (existing && existing.source !== source) {
        throw new FacadeBuildError(
          `Stylesheet exports "${existing.subpath}" and "${subpath}" both map to ${target}.`,
        )
      }

      if (!existing) entries.set(target, { subpath, source, target })
    }
  }

  return [...entries.values()]
}

export function missingStylesheetSources(manifest, fileExists) {
  return stylesheetEntries(manifest).filter(({ source }) => !fileExists(source))
}
