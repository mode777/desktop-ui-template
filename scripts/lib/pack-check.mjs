import { exportTargets } from './facade.mjs'

const PRIVATE_SPECIFIER =
  /@workbench-kit\/(?:core|react|elements|styles-vscode|preset-vscode)(?:[\w/-]*)/

const APP_MARKERS = [
  'apps/template/src/',
  'demo-views',
  'workspaceTree',
  'workspaceFiles',
  'mock workspace',
  'ExplorerView',
  'ChatView',
  'TerminalView',
  'ProblemsView',
  'WelcomeView',
  'initial-session',
  'workbench.config',
]

const ELEMENT_TAGS = {
  './elements/all': ['vscode-badge', 'vscode-icon', 'vscode-tree'],
  './elements/badge': ['vscode-badge'],
  './elements/button': ['vscode-button'],
  './elements/collapsible': ['vscode-collapsible'],
  './elements/context-menu': ['vscode-context-menu'],
  './elements/icon': ['vscode-icon'],
  './elements/tab-header': ['vscode-tab-header'],
  './elements/tab-panel': ['vscode-tab-panel'],
  './elements/tabs': ['vscode-tabs'],
  './elements/textarea': ['vscode-textarea'],
  './elements/textfield': ['vscode-textfield'],
  './elements/tree': ['vscode-tree'],
}

const VALUE_EXPORTS = {
  '.': ['VSCodeWorkbench', 'useWorkbenchStore', 'defaultCommands', 'createCommandRegistry'],
  './react': ['WorkbenchShell', 'TabStrip', 'ResizablePane', 'IconButton'],
  './core': ['clampSize', 'openTabIn', 'readVersioned'],
}

export function normaliseTarballPath(path) {
  return path.replace(/^package\//, '')
}

const ROOT_TARBALL_FILES = ['package.json', 'README.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md']

export function requiredTarballFiles(manifest) {
  return [
    ...new Set([...ROOT_TARBALL_FILES, ...exportTargets(manifest).map(({ target }) => target)]),
  ]
}

export function forbiddenTarballPath(path) {
  if (ROOT_TARBALL_FILES.includes(path) || path.startsWith('dist/')) {
    if (path.includes('/src/') || path.startsWith('dist/src/')) {
      return 'private source must not ship'
    }

    if (/(^|\/)component-test-fixtures\./.test(path)) {
      return 'test fixtures must not ship'
    }

    if (/(^|\/).+\.(?:test|spec)\./.test(path)) {
      return 'test files must not ship'
    }

    if (/\.map$/.test(path)) {
      return 'declaration and source maps must not ship'
    }

    if (/(^|\/)\.tsbuildinfo$/.test(path)) {
      return 'TypeScript build metadata must not ship'
    }

    return null
  }

  if (path.startsWith('src/') || path.includes('/src/')) return 'private source must not ship'
  if (path.startsWith('node_modules/') || path.includes('/node_modules/')) {
    return 'nested dependencies must not ship'
  }

  if (/(^|\/)(?:package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(path)) {
    return 'package-manager lockfiles must not ship'
  }

  return null
}

function isAllowedTarballPath(path) {
  return ROOT_TARBALL_FILES.includes(path) || path.startsWith('dist/')
}

export function validateTarballFiles(files, manifest) {
  const normalised = files.map(normaliseTarballPath)
  const present = new Set(normalised)
  const violations = []

  for (const required of requiredTarballFiles(manifest)) {
    if (!present.has(required)) {
      violations.push({
        rule: 'missing-file',
        path: required,
        message: `The tarball is missing required file ${required}.`,
      })
    }
  }

  for (const file of normalised) {
    const forbidden = forbiddenTarballPath(file)

    if (forbidden) {
      violations.push({
        rule: 'forbidden-file',
        path: file,
        message: `${file}: ${forbidden}.`,
      })
      continue
    }

    if (!isAllowedTarballPath(file)) {
      violations.push({
        rule: 'unexpected-file',
        path: file,
        message: `${file} is outside the manifest, README and dist/ allowlist.`,
      })
    }
  }

  return violations
}

export function findContentViolations({ files, readFile }) {
  const violations = []

  for (const file of files) {
    if (!file.endsWith('.js') && !file.endsWith('.d.ts') && !file.endsWith('.css')) continue

    const content = readFile(file)
    const privateMatch = content.match(PRIVATE_SPECIFIER)

    if (privateMatch) {
      violations.push({
        rule: 'private-package-reference',
        file,
        message: `${file} references the private package ${privateMatch[0]}.`,
      })
    }

    const marker = APP_MARKERS.find((candidate) => content.includes(candidate))

    if (marker) {
      violations.push({
        rule: 'app-content',
        file,
        message: `${file} contains the app/demo marker "${marker}".`,
      })
    }
  }

  return violations
}

function quote(value) {
  return `'${value}'`
}

export function createConsumerRuntimeSource({ jsSubpaths, cssSubpaths }) {
  const valueChecks = jsSubpaths
    .filter((subpath) => VALUE_EXPORTS[subpath])
    .map((subpath) => ({ subpath, exports: VALUE_EXPORTS[subpath] }))
  const elementChecks = jsSubpaths
    .filter((subpath) => ELEMENT_TAGS[subpath])
    .map((subpath) => ({ subpath, tags: ELEMENT_TAGS[subpath] }))
  const resolveSubpaths = [
    ...jsSubpaths.filter((subpath) => subpath !== './elements/types'),
    ...cssSubpaths,
  ]

  return `import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'

const valueChecks = ${JSON.stringify(valueChecks, null, 2)}
const elementChecks = ${JSON.stringify(elementChecks, null, 2)}
const resolveSubpaths = ${JSON.stringify(resolveSubpaths, null, 2)}

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
})
const browser = dom.window

for (const name of [
  'window',
  'document',
  'Document',
  'customElements',
  'HTMLElement',
  'HTMLTemplateElement',
  'HTMLDivElement',
  'HTMLSpanElement',
  'Element',
  'Node',
  'Text',
  'Comment',
  'DocumentFragment',
  'MutationObserver',
  'CSSStyleSheet',
  'ShadowRoot',
  'SVGElement',
  'DOMRect',
  'DOMTokenList',
  'Event',
  'CustomEvent',
  'HTMLStyleElement',
]) {
  Object.defineProperty(globalThis, name, {
    value: browser[name],
    configurable: true,
    writable: true,
  })
}

Object.defineProperty(globalThis, 'navigator', {
  value: browser.navigator,
  configurable: true,
})
globalThis.getComputedStyle = browser.getComputedStyle.bind(browser)
globalThis.requestAnimationFrame = browser.requestAnimationFrame?.bind(browser) ?? ((callback) => setTimeout(callback, 0))
globalThis.cancelAnimationFrame = browser.cancelAnimationFrame?.bind(browser) ?? clearTimeout
globalThis.self = browser
globalThis.IS_REACT_ACT_ENVIRONMENT = true

for (const subpath of resolveSubpaths) {
  const specifier = subpath.startsWith('.') ? \`@workbench-kit/workbench\${subpath.slice(1)}\` : subpath
  const resolved = fileURLToPath(import.meta.resolve(specifier))

  if (!existsSync(resolved)) throw new Error(\`Missing export target for \${specifier}: \${resolved}\`)
}

for (const { subpath, exports: names } of valueChecks) {
  const specifier = subpath === '.' ? '@workbench-kit/workbench' : \`@workbench-kit/workbench\${subpath.slice(1)}\`
  const module = await import(specifier)

  for (const name of names) {
    if (typeof module[name] === 'undefined') {
      throw new Error(\`\${specifier} does not export \${name}\`)
    }
  }
}

for (const { subpath } of elementChecks) {
  const specifier = \`@workbench-kit/workbench\${subpath.slice(1)}\`
  await import(specifier)
}

for (const { subpath, tags } of elementChecks) {
  for (const tag of tags) {
    if (!customElements.get(tag)) {
      throw new Error(\`\${subpath} did not register \${tag}\`)
    }
  }
}

console.log(\`Runtime imports OK: \${valueChecks.length} value entries, \${elementChecks.length} element entries, \${resolveSubpaths.length} resolvable exports\`)
`
}

export function createConsumerTypecheckSource({ jsSubpaths, cssSubpaths, typesSubpath }) {
  const lines = []

  for (const subpath of jsSubpaths) {
    const specifier =
      subpath === '.' ? '@workbench-kit/workbench' : `@workbench-kit/workbench${subpath.slice(1)}`
    const names = VALUE_EXPORTS[subpath]

    if (names) {
      lines.push(`import { ${names.join(', ')} } from ${quote(specifier)}`)
    } else {
      lines.push(`import ${quote(specifier)}`)
    }
  }

  if (typesSubpath) {
    lines.push(`import ${quote(`@workbench-kit/workbench${typesSubpath.slice(1)}`)}`)
  }

  for (const subpath of cssSubpaths) {
    lines.push(`import ${quote(`@workbench-kit/workbench${subpath.slice(1)}`)}`)
  }

  lines.push("import type { WorkbenchConfig } from '@workbench-kit/workbench'")
  lines.push('')
  lines.push(
    'export const consumerChecks = [VSCodeWorkbench, useWorkbenchStore, WorkbenchShell, TabStrip, clampSize]',
  )
  lines.push('export type ConsumerConfig = WorkbenchConfig')

  return `${lines.join('\n')}\n`
}

export function createConsumerTsConfig() {
  return {
    compilerOptions: {
      target: 'ES2023',
      lib: ['ES2023', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'react-jsx',
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      types: [],
    },
    include: ['consumer.tsx', 'css.d.ts'],
  }
}

export function createCssDeclarations() {
  return "declare module '*.css'\ndeclare module '@workbench-kit/workbench/styles'\n"
}
