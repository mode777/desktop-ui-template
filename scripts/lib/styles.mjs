/**
 * Pure helpers for the stylesheet surface.
 *
 * The aggregate stylesheet is an import manifest, each reusable component owns
 * one file, and the public facade mirrors the same names. These helpers keep
 * the three declarations comparable without requiring a build.
 */

export const BASE_STYLESHEETS = ['index.css', 'tokens.css', 'global.css', 'workbench.css']

export const COMPONENT_ORDER = [
  'shell.css',
  'title-bar.css',
  'menu-bar.css',
  'icon-button.css',
  'activity-bar.css',
  'resizable-pane.css',
  'sidebar.css',
  'tab-strip.css',
  'editor-area.css',
  'panel.css',
  'status-bar.css',
  'quick-open.css',
  'context-menu.css',
  'notifications.css',
]

/**
 * Selectors that belong to the template demo views. The kit must never ship
 * them, and the examples must not pull their rules into their production CSS.
 */
export const DEMO_SELECTOR_PREFIXES = [
  '.explorer-',
  '.search-',
  '.source-control',
  '.run-',
  '.extensions-',
  '.chat-',
  '.problems-',
  '.output-',
  '.terminal-',
  '.welcome-',
  '.walkthrough-',
  '.readme-',
  '.document-view',
  '.code-preview',
  '.code-line',
  '.line-number',
  '.tok-',
  '.mini-list',
  '.file-icon-',
  '.empty-editor',
  '.untitled-document',
]

const IMPORT_PATTERN = /@import\s+(?:url\(\s*)?(?:["']([^"']+)["']|([^'")]+))\s*\)?\s*[^;]*;/g
const SELECTOR_PATTERN = /([^{}]+)\{/g
const APP_STYLE_IMPORT_PATTERN =
  /import\s+(?:(?:[^'"]+)\s+from\s+)?["']@workbench-kit\/styles-vscode(?:\/([^"']+))?["']/g

function normalizeImportPath(value) {
  return value.replace(/^\.\//, '')
}

export function componentStylesheets(files) {
  return files.filter((file) => file.endsWith('.css') && !BASE_STYLESHEETS.includes(file)).sort()
}

export function extractImports(css) {
  return [...css.matchAll(IMPORT_PATTERN)].map((match) => (match[1] ?? match[2]).trim())
}

export function aggregateProblems(aggregateCss, componentFiles) {
  const imports = extractImports(aggregateCss).map(normalizeImportPath)
  const expected = COMPONENT_ORDER.filter((file) => componentFiles.includes(file))
  const problems = []

  for (const file of expected) {
    const count = imports.filter((value) => value === file).length

    if (count === 0) {
      problems.push({
        rule: 'missing-aggregate-import',
        file,
        message: `The workbench aggregate does not import ${file}.`,
      })
    } else if (count > 1) {
      problems.push({
        rule: 'duplicate-aggregate-import',
        file,
        message: `The workbench aggregate imports ${file} ${count} times.`,
      })
    }
  }

  for (const value of imports) {
    if (componentFiles.includes(value)) continue
    problems.push({
      rule: 'unknown-aggregate-import',
      file: value,
      message: `The workbench aggregate imports ${value}, which is not a component stylesheet.`,
    })
  }

  const actualOrder = imports.filter((value) => componentFiles.includes(value))

  if (actualOrder.join('\n') !== expected.join('\n')) {
    problems.push({
      rule: 'aggregate-order',
      message: `The workbench aggregate order is ${actualOrder.join(', ') || '(empty)'}; expected ${expected.join(', ')}.`,
    })
  }

  return problems
}

export function indexProblems(indexCss) {
  const imports = extractImports(indexCss).map(normalizeImportPath)
  const expected = ['tokens.css', 'global.css', 'workbench.css']

  if (imports.join('\n') === expected.join('\n')) return []

  return [
    {
      rule: 'index-order',
      message: `The root stylesheet order is ${imports.join(', ') || '(empty)'}; expected ${expected.join(', ')}.`,
    },
  ]
}

export function stylesheetExports(manifest) {
  const entries = []

  for (const [subpath, value] of Object.entries(manifest.exports ?? {})) {
    if (typeof value !== 'string' || !value.endsWith('.css')) continue
    entries.push({ subpath, target: normalizeImportPath(value) })
  }

  return entries
}

export function missingComponentStyleExports(stylesManifest, componentFiles) {
  const exported = new Set(stylesheetExports(stylesManifest).map((entry) => entry.subpath))

  return componentFiles
    .map((file) => `./${file}`)
    .filter((subpath) => !exported.has(subpath))
    .map((subpath) => ({
      rule: 'missing-component-export',
      subpath,
      message: `The styles package has no ${subpath} export.`,
    }))
}

export function facadeStyleProblems(facadeManifest, componentFiles) {
  const exported = new Map(
    stylesheetExports(facadeManifest).map((entry) => [entry.subpath, entry.target]),
  )
  const problems = []

  for (const file of componentFiles) {
    const subpath = `./styles/${file}`
    const target = exported.get(subpath)

    if (!target) {
      problems.push({
        rule: 'missing-facade-style-export',
        subpath,
        message: `The public facade has no ${subpath} export.`,
      })
    } else if (target !== `dist/styles/${file}`) {
      problems.push({
        rule: 'wrong-facade-style-target',
        subpath,
        target,
        message: `The public facade maps ${subpath} to ${target}; expected dist/styles/${file}.`,
      })
    }
  }

  return problems
}

export function missingExportTargets(manifest, fileExists, label = 'manifest') {
  return stylesheetExports(manifest)
    .filter(({ target }) => !fileExists(target))
    .map(({ subpath, target }) => ({
      rule: 'missing-style-target',
      subpath,
      target,
      message: `${label} export ${subpath} points at missing file ${target}.`,
    }))
}

function extractSelectors(css) {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const selectors = []

  for (const match of withoutComments.matchAll(SELECTOR_PATTERN)) {
    const selector = match[1].trim()
    if (!selector || selector.startsWith('@')) continue
    selectors.push(selector)
  }

  return selectors
}

export function selectorViolations(css, prefixes, file) {
  const violations = []

  for (const selector of extractSelectors(css)) {
    for (const prefix of prefixes) {
      if (!selector.includes(prefix)) continue
      violations.push({
        rule: 'forbidden-selector',
        file,
        selector,
        prefix,
        message: `${file} contains ${selector}, which matches forbidden prefix ${prefix}.`,
      })
    }
  }

  return violations
}

export function sourceStyleImports(source) {
  const imports = []

  for (const match of source.matchAll(APP_STYLE_IMPORT_PATTERN)) {
    imports.push(match[1] ?? 'index.css')
  }

  return imports
}

export function styleSubsetProblems(source, subset, label) {
  const expected = Array.isArray(subset?.entries) ? subset.entries : []
  const actual = sourceStyleImports(source)
  const problems = []

  for (const entry of expected) {
    if (actual.includes(entry)) continue
    problems.push({
      rule: 'missing-app-style',
      label,
      entry,
      message: `${label} does not import the expected style entry ${entry}.`,
    })
  }

  for (const entry of actual) {
    if (expected.includes(entry)) continue
    const aggregate = entry === 'index.css' || entry === 'workbench.css'
    problems.push({
      rule: 'unexpected-app-style',
      label,
      entry,
      message: `${label} imports ${entry}${aggregate ? ' (an aggregate entry)' : ''}, which is outside its style subset.`,
    })
  }

  return problems
}

export function formatStyleViolation(violation) {
  return `${violation.file ?? violation.subpath ?? violation.label ?? 'styles'}  [${violation.rule}]\n    ${violation.message}`
}
