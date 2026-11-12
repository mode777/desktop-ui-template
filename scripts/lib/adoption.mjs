import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'

const PRIVATE_IMPORT =
  /@workbench-kit\/(?:core|react|elements|styles-vscode|preset-vscode)(?:[\w/-]*)/
const ELEMENT_IMPORT = /(?:@workbench-kit|vscode-workbench)\/elements\/([a-z-]+)/g
const STYLE_IMPORT = /(?:@workbench-kit|vscode-workbench)\/styles\/([a-z-]+\.css)/g
const RENDERED_TAG = /<(vscode-[a-z-]+)/g
const CREATED_TAG = /createElement\(\s*['"](vscode-[a-z-]+)['"]\s*\)/g
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.html'])

const DEMO_MARKERS = [
  'workspaceTree',
  'workspaceFiles',
  'ExplorerView',
  'ChatView',
  'TerminalView',
  'ProblemsView',
  'WelcomeView',
  'desktop-ui-template:v1',
]

const PRESET_MARKERS = [
  'VSCodeWorkbench',
  'useWorkbenchStore',
  'createCommandRegistry',
  'defaultCommands',
]
const SSR_FRAMEWORKS = ['next', 'nuxt', '@remix-run/react', '@sveltejs/kit', 'astro']

function lineAt(content, index) {
  return content.slice(0, index).split('\n').length
}

function walk(directory, output = []) {
  if (!existsSync(directory)) return output
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue
      walk(path, output)
      continue
    }
    if (SOURCE_EXTENSIONS.has(extname(entry.name)) || entry.name === 'package.json')
      output.push(path)
  }
  return output
}

export function inferLevel(sources) {
  const text = sources.map((source) => source.content).join('\n')
  if (/\bVSCodeWorkbench\b/.test(text)) return 'preset'
  if (/\bWorkbenchShell\b/.test(text)) return 'composition'
  return 'primitives'
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function declaredVersion(range) {
  if (!range) return null
  const match = String(range).match(/(\d+\.\d+\.\d+)/)
  return match ? match[1] : null
}

export function checkAdoption({ appDir, level = 'auto', packageManifest = null }) {
  const root = resolve(appDir)
  const files = walk(root).map((file) => ({
    file,
    path: relative(root, file).split(/[\\/]/).join('/'),
    content: readFileSync(file, 'utf8'),
  }))
  const sourceFiles = files.filter((entry) => entry.path !== 'package.json')
  const sources = sourceFiles.map((entry) => entry.content)
  const resolvedLevel = level === 'auto' ? inferLevel(sourceFiles) : level
  const findings = []

  const push = (rule, severity, entry, message, index = 0) => {
    findings.push({
      rule,
      severity,
      file: entry?.file ?? null,
      line: entry ? lineAt(entry.content, index) : 1,
      message,
    })
  }

  for (const entry of sourceFiles) {
    const privateMatch = entry.content.match(PRIVATE_IMPORT)
    if (privateMatch) {
      push(
        'private-import',
        'error',
        entry,
        `Import the public package instead of ${privateMatch[0]}.`,
        privateMatch.index,
      )
    }
  }

  if (resolvedLevel !== 'preset') {
    const importedTags = new Set()
    let aggregateElements = false

    for (const entry of sourceFiles) {
      for (const match of entry.content.matchAll(ELEMENT_IMPORT)) {
        if (match[1] === 'all') aggregateElements = true
        else importedTags.add(`vscode-${match[1]}`)
      }
    }

    for (const entry of sourceFiles) {
      for (const regex of [RENDERED_TAG, CREATED_TAG]) {
        regex.lastIndex = 0
        for (const match of entry.content.matchAll(regex)) {
          const tag = match[1]
          if (!aggregateElements && !importedTags.has(tag)) {
            push(
              'unregistered-element',
              'error',
              entry,
              `The rendered tag ${tag} has no element registration import.`,
              match.index,
            )
          }
        }
      }
    }

    const importedStyles = new Set()
    for (const entry of sourceFiles) {
      for (const match of entry.content.matchAll(STYLE_IMPORT)) importedStyles.add(match[1])
    }

    const hasAggregate =
      importedStyles.has('workbench.css') ||
      importedStyles.has('index.css') ||
      sources.some((source) => /(?:@workbench-kit|vscode-workbench)\/styles['"]/.test(source))
    const componentStyles = [...importedStyles].filter(
      (style) => !['tokens.css', 'global.css', 'workbench.css', 'index.css'].includes(style),
    )

    if (!importedStyles.has('tokens.css')) {
      push('missing-base-style', 'error', null, 'Missing vscode-workbench/styles/tokens.css.')
    }
    if (!importedStyles.has('global.css')) {
      push('missing-base-style', 'error', null, 'Missing vscode-workbench/styles/global.css.')
    }
    if (!hasAggregate && componentStyles.length === 0) {
      push(
        'missing-component-style',
        'error',
        null,
        'Import the aggregate workbench.css or the component stylesheets the app renders.',
      )
    }

    if (aggregateElements) {
      push(
        'aggregate-elements',
        'warning',
        null,
        'elements/all is convenient for demos; selective consumers should use per-tag entries.',
      )
    }

    for (const entry of sourceFiles) {
      for (const marker of [...DEMO_MARKERS, ...PRESET_MARKERS]) {
        const index = entry.content.indexOf(marker)
        if (index !== -1) {
          push(
            'preset-leak',
            'error',
            entry,
            `${resolvedLevel} consumers should not include the preset or demo marker "${marker}".`,
            index,
          )
        }
      }
    }
  }

  const packagePath = join(root, 'package.json')
  if (existsSync(packagePath)) {
    const manifest = readJson(packagePath)
    const declared = { ...(manifest.dependencies ?? {}), ...(manifest.devDependencies ?? {}) }
    const expectedVersion = packageManifest?.version
    const workbenchRange = declared['vscode-workbench']

    if (!workbenchRange) {
      push('missing-package', 'error', null, 'package.json does not declare vscode-workbench.')
    } else if (expectedVersion && declaredVersion(workbenchRange) !== expectedVersion) {
      push(
        'version-mismatch',
        'error',
        null,
        `Declared vscode-workbench ${workbenchRange} does not match package version ${expectedVersion}.`,
      )
    }

    for (const peer of ['react', 'react-dom', '@vscode-elements/elements']) {
      if (!declared[peer]) {
        push('missing-peer', 'error', null, `package.json does not declare the peer ${peer}.`)
      }
    }

    if (declared.react && !/\b19\./.test(String(declared.react))) {
      push('peer-version', 'error', null, `React 19 is required; found ${declared.react}.`)
    }
    if (declared['react-dom'] && !/\b19\./.test(String(declared['react-dom']))) {
      push(
        'peer-version',
        'error',
        null,
        `React DOM 19 is required; found ${declared['react-dom']}.`,
      )
    }
    if (
      declared['@vscode-elements/elements'] &&
      !/^\^?2\.(?:[5-9]|\d{2,})/.test(String(declared['@vscode-elements/elements']))
    ) {
      push(
        'peer-version',
        'error',
        null,
        `@vscode-elements/elements >=2.5 <3 is required; found ${declared['@vscode-elements/elements']}.`,
      )
    }

    const hasSsrFramework = SSR_FRAMEWORKS.some(
      (name) => declared[name] || (manifest.devDependencies ?? {})[name],
    )
    if (hasSsrFramework) {
      for (const entry of sourceFiles) {
        if (entry.path === 'src/main.tsx' || entry.path === 'src/entry-client.tsx') continue
        const match = entry.content.match(/^(?:window|document)\./m)
        if (match) {
          push(
            'ssr-global',
            'error',
            entry,
            'Top-level window/document access is not SSR-safe; move it into a client-only effect.',
            match.index,
          )
        }
      }
    }
  }

  const errors = findings.filter((finding) => finding.severity === 'error')
  const warnings = findings.filter((finding) => finding.severity === 'warning')

  return {
    ok: errors.length === 0,
    appDir: root,
    level: resolvedLevel,
    findings,
    summary: { errors: errors.length, warnings: warnings.length, files: sourceFiles.length },
  }
}

export function formatAdoptionFinding(finding, appDir) {
  const location = finding.file ? relative(appDir, finding.file) : 'package.json'
  return `${location}:${finding.line ?? 1}: ${finding.severity} [${finding.rule}] ${finding.message}`
}

export function parsePackageManifest(packageDir) {
  return readJson(resolve(packageDir, 'package.json'))
}

export function adoptionAppDirs(appDir) {
  return walk(resolve(appDir)).map((file) => dirname(file))
}
