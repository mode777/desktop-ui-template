/**
 * Structural and behavioral checks for an example application's production
 * bundle.
 *
 * The Vite manifest proves which entry was built; the build-emitted module
 * inventory proves which source modules contributed code; string markers catch
 * demo/preset UI that reached the output even if a path is obscured; and the
 * stylesheet check catches component rules that belong to regions the example
 * does not render.
 */

import { selectorViolations } from './styles.mjs'

export const FORBIDDEN_MODULE_PREFIXES = ['apps/template/src/', 'packages/preset-vscode/']

export const LEAK_MARKERS = [
  'explorer-view',
  'terminal-view',
  'chat-view',
  'welcome-view',
  'quick-open-overlay',
  'Desktop UI Template',
]

function normalizePath(value) {
  return String(value)
    .replace(/\\/g, '/')
    .replace(/[?#].*$/, '')
}

/** Makes absolute and root-relative module ids comparable with repo prefixes. */
function relativeModulePath(value) {
  let path = normalizePath(value)
  while (path.startsWith('../')) path = path.slice(3)
  if (path.startsWith('./')) path = path.slice(2)
  return path
}

function forbiddenPrefixFor(modulePath) {
  const path = relativeModulePath(modulePath)
  return FORBIDDEN_MODULE_PREFIXES.find(
    (prefix) =>
      path === prefix.slice(0, -1) || path.startsWith(prefix) || path.includes(`/${prefix}`),
  )
}

function manifestModules(manifest) {
  const modules = new Set()

  for (const [key, chunk] of Object.entries(manifest)) {
    modules.add(key)
    if (typeof chunk?.src === 'string') modules.add(chunk.src)
    if (typeof chunk?.file === 'string') modules.add(chunk.file)
    for (const css of chunk?.css ?? []) modules.add(css)
    for (const id of Object.keys(chunk?.modules ?? {})) modules.add(id)
  }

  return modules
}
/**
 * @param {object} input
 * @param {Record<string, object> | null | undefined} input.manifest Parsed Vite manifest.
 * @param {string[]} [input.modules] Source module ids emitted by the build.
 * @param {{ name: string, text: string }[]} [input.scripts] Emitted JavaScript assets.
 * @param {string} [input.entry] Expected entry path in the manifest.
 * @param {string} [input.label] Target name used in violation messages.
 */
export function inspectBundle({
  manifest,
  modules = [],
  scripts = [],
  entry = 'index.html',
  label = 'minimal',
}) {
  const violations = []
  const inventory = new Set(modules)
  const manifestPaths = new Set()

  if (!manifest || Object.keys(manifest).length === 0) {
    violations.push({
      rule: 'missing-manifest',
      message: 'No Vite manifest was found, so the bundle composition cannot be verified.',
    })
  } else {
    for (const id of manifestModules(manifest)) manifestPaths.add(id)

    const entries = Object.entries(manifest)
    const entryChunk = entries.find(
      ([key, chunk]) =>
        chunk?.isEntry === true &&
        (normalizePath(key) === normalizePath(entry) ||
          normalizePath(chunk.src ?? '') === normalizePath(entry)),
    )

    if (!entryChunk) {
      violations.push({
        rule: 'missing-entry',
        message: `The manifest does not list "${entry}" as an entry point.`,
      })
    }
  }

  if (manifest && inventory.size === 0) {
    violations.push({
      rule: 'missing-modules',
      message: 'The build produced no module inventory, so the check would pass vacuously.',
    })
  }

  const reportedModules = new Set()
  for (const id of [...manifestPaths, ...inventory]) {
    const forbidden = forbiddenPrefixFor(id)
    if (!forbidden) continue
    if (reportedModules.has(id)) continue
    reportedModules.add(id)
    violations.push({
      rule: 'forbidden-module',
      module: normalizePath(id),
      message: `Forbidden ${forbidden} module contributed to the ${label} bundle: ${normalizePath(id)}`,
    })
  }

  for (const script of scripts) {
    for (const marker of LEAK_MARKERS) {
      if (!script.text.includes(marker)) continue
      violations.push({
        rule: 'forbidden-marker',
        asset: script.name,
        marker,
        message: `Demo/preset marker "${marker}" appears in ${script.name}.`,
      })
    }
  }

  return {
    violations,
    moduleCount: inventory.size,
    assetCount: scripts.length,
    entry: manifest ? (Object.keys(manifest)[0] ?? null) : null,
  }
}

/**
 * Checks emitted stylesheet assets against the app's forbidden region selectors.
 *
 * A missing selector list is a violation rather than a skip so a deleted or
 * malformed style-subset.json cannot silently disable the CSS proof.
 */
export function inspectStyles({ styles = [], forbiddenSelectors, label = 'minimal' } = {}) {
  if (!Array.isArray(forbiddenSelectors)) {
    return {
      violations: [
        {
          rule: 'missing-style-config',
          message: `No forbidden selector list was provided for the ${label} stylesheet check.`,
        },
      ],
      assetCount: styles.length,
    }
  }

  const violations = []

  for (const style of styles) {
    for (const violation of selectorViolations(style.text, forbiddenSelectors, style.name)) {
      violations.push({
        rule: 'forbidden-style-selector',
        asset: style.name,
        selector: violation.selector,
        prefix: violation.prefix,
        message: `Forbidden ${violation.prefix} selector "${violation.selector}" appears in ${style.name}.`,
      })
    }
  }

  return { violations, assetCount: styles.length }
}

export function formatCompositionViolations(violations) {
  return violations
    .map((violation) => {
      const location = violation.module ?? violation.asset ?? 'bundle'
      return `${location}  [${violation.rule}]\n    ${violation.message}`
    })
    .join('\n')
}
