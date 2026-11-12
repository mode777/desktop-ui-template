import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'

/** Matches inline Markdown links, excluding images. */
const MARKDOWN_LINK = /(?<!!)\[[^\]]*\]\(([^)]+)\)/g
const NPM_RUN = /\bnpm run ([A-Za-z0-9:_-]+)/g
const PUBLISHED_SPECIFIER = /@workbench-kit\/workbench(?:\/[A-Za-z0-9._/-]+)?/g
const PLACEHOLDER_CHARS = /[<{*]/

const PUBLIC_ENTRIES = [
  { group: 'preset', path: 'packages/preset-vscode/src/index.ts' },
  { group: 'react', path: 'packages/react/src/index.ts' },
  { group: 'core', path: 'packages/core/src/index.ts' },
]

function lineAt(content, index) {
  return content.slice(0, index).split('\n').length
}

function normaliseLinkTarget(raw) {
  let target = raw.trim()

  if (target.startsWith('<') && target.endsWith('>')) {
    target = target.slice(1, -1)
  }

  // Markdown allows a title after the destination: (./file.md "Title").
  const titleMatch = target.match(/^(\S+)\s+(?:"[^"]*"|'[^']*'|\([^)]*\))$/)
  if (titleMatch) target = titleMatch[1]

  return target
}

export function isExternalLink(target) {
  const lower = target.toLowerCase()
  return (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:') ||
    lower.startsWith('data:') ||
    lower.startsWith('//') ||
    target.startsWith('#')
  )
}

export function extractMarkdownLinks(markdown) {
  const links = []

  for (const match of markdown.matchAll(MARKDOWN_LINK)) {
    links.push({
      target: normaliseLinkTarget(match[1]),
      line: lineAt(markdown, match.index),
    })
  }

  return links
}

/** Resolves a relative link to an absolute path, or returns null when it is not checked. */
export function resolveDocLink(sourcePath, target, _repoRoot) {
  if (!target || isExternalLink(target)) return null

  const withoutFragment = target.split('#')[0]
  if (!withoutFragment) return null

  let decoded
  try {
    decoded = decodeURIComponent(withoutFragment)
  } catch {
    decoded = withoutFragment
  }

  if (isAbsolute(decoded)) return resolve(decoded)

  return resolve(dirname(sourcePath), decoded)
}

export function extractNpmRunScripts(markdown) {
  const scripts = []
  const seen = new Set()

  for (const match of markdown.matchAll(NPM_RUN)) {
    const script = match[1]
    if (seen.has(script)) continue
    seen.add(script)
    scripts.push({ script, line: lineAt(markdown, match.index) })
  }

  return scripts
}

function trimSpecifierPunctuation(specifier) {
  let result = specifier
  while (/[.,;:)\]}]+$/.test(result)) result = result.slice(0, -1)
  return result
}

export function isPlaceholderSpecifier(specifier) {
  return PLACEHOLDER_CHARS.test(specifier)
}

export function extractPublishedSpecifiers(markdown) {
  const specifiers = []

  for (const match of markdown.matchAll(PUBLISHED_SPECIFIER)) {
    const specifier = trimSpecifierPunctuation(match[0])
    const nextCharacter = markdown[match.index + match[0].length]
    if (specifier.endsWith('/') || PLACEHOLDER_CHARS.test(nextCharacter ?? '')) continue
    if (isPlaceholderSpecifier(specifier)) continue
    specifiers.push({ specifier, line: lineAt(markdown, match.index) })
  }

  return specifiers
}

export function specifierToExportKey(specifier) {
  const prefix = '@workbench-kit/workbench'
  if (specifier === prefix) return '.'
  if (!specifier.startsWith(`${prefix}/`)) return null
  return `.${specifier.slice(prefix.length)}`
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function mentionsName(text, name) {
  return new RegExp(`\\b${escapeRegExp(name)}\\b`).test(text)
}

export function missingExportMentions(groups, text) {
  const missing = []

  for (const [group, names] of Object.entries(groups)) {
    for (const name of names) {
      if (!mentionsName(text, name)) missing.push({ group, name })
    }
  }

  return missing
}

/**
 * Collects value exports from the three JavaScript public entries by walking
 * the source re-export graph. Type-only exports are excluded because the API
 * reference has a separate type index.
 *
 * This is a deliberately small source scanner rather than a compiler-API
 * dependency: the entry files are authored TypeScript and the check needs the
 * exported names, not a full type graph.
 */
export function collectPublicValueExports(repoRoot, options = {}) {
  const readFile = options.readFile ?? ((file) => readFileSync(file, 'utf8'))
  const result = {}

  for (const entry of PUBLIC_ENTRIES) {
    const names = collectValueExports(resolve(repoRoot, entry.path), readFile, new Set())
    result[entry.group] = [...names].sort()
  }

  return result
}

function resolveModuleFile(fromFile, specifier, exists = existsSync) {
  const base = resolve(dirname(fromFile), specifier)
  const candidates = [
    `${base}.ts`,
    `${base}.tsx`,
    resolve(base, 'index.ts'),
    resolve(base, 'index.tsx'),
  ]
  return candidates.find((candidate) => exists(candidate)) ?? null
}

function parseExportNames(clause) {
  const names = []

  for (const part of clause.split(',')) {
    const item = part.trim()
    if (!item || item.startsWith('type ')) continue
    const alias = item.split(/\s+as\s+/)
    const name = alias[alias.length - 1].trim()
    if (name && name !== 'default') names.push(name)
  }

  return names
}

function collectValueExports(file, readFile, seen) {
  const names = new Set()
  if (seen.has(file) || !existsSync(file)) return names

  seen.add(file)
  const source = readFile(file)

  for (const match of source.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g)) {
    const target = resolveModuleFile(file, match[1])
    if (target) for (const name of collectValueExports(target, readFile, seen)) names.add(name)
  }

  for (const match of source.matchAll(
    /export\s+(?!type\b)\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g,
  )) {
    const target = resolveModuleFile(file, match[2])
    if (!target) continue
    const available = collectValueExports(target, readFile, seen)
    for (const name of parseExportNames(match[1])) {
      if (available.has(name)) names.add(name)
    }
  }

  for (const match of source.matchAll(/export\s+(?!type\b)\{([^}]+)\}(?!\s+from)/g)) {
    for (const name of parseExportNames(match[1])) names.add(name)
  }

  for (const match of source.matchAll(
    /export\s+(?:async\s+)?(?:function|const|let|var|class|enum)\s+([A-Za-z_$][\w$]*)/g,
  )) {
    names.add(match[1])
  }

  return names
}

/** Files whose links, scripts, specifiers and API coverage the docs check owns. */
export function documentationFiles(repoRoot) {
  const rootFiles = [
    'README.md',
    'ROADMAP.md',
    'AGENTS.md',
    'CHANGELOG.md',
    'THIRD_PARTY_NOTICES.md',
  ]
  const files = rootFiles.map((file) => resolve(repoRoot, file))

  for (const file of ['api.md', 'architecture.md', 'eject.md', 'migration.md', 'release.md']) {
    files.push(resolve(repoRoot, 'docs', file))
  }

  for (const group of ['packages', 'apps']) {
    const directory = resolve(repoRoot, group)
    if (!existsSync(directory)) continue
    for (const entry of readdirSync(directory)) {
      const readme = resolve(directory, entry, 'README.md')
      if (existsSync(readme)) files.push(readme)
    }
  }

  return [...new Set(files)].filter((file) => existsSync(file))
}

export function formatDocProblem(problem, repoRoot) {
  const location = problem.file ? relative(repoRoot, problem.file) : 'documentation'
  return `${location}:${problem.line ?? 1}: ${problem.message}`
}
