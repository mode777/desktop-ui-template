import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  isFacadeFile,
  missingElementExports,
  missingStylesheetSources,
  missingTypesConditions,
  rewriteSpecifiers,
  stripSourceMapComments,
  stylesheetEntries,
  validateExportTargets,
} from './lib/facade.mjs'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const packageDir = join(repoRoot, 'packages/workbench')
const outputRoot = join(packageDir, 'dist')

const moduleSources = [
  { name: 'core', source: join(repoRoot, 'packages/core/dist'), target: 'core' },
  { name: 'react', source: join(repoRoot, 'packages/react/dist'), target: 'react' },
  { name: 'elements', source: join(repoRoot, 'packages/elements/dist'), target: 'elements' },
  {
    name: 'preset-vscode',
    source: join(repoRoot, 'packages/preset-vscode/dist'),
    target: 'preset',
  },
]

const stylesPackageDir = join(repoRoot, 'packages/styles-vscode')
const stylesManifest = JSON.parse(readFileSync(join(stylesPackageDir, 'package.json'), 'utf8'))
const styles = stylesheetEntries(stylesManifest)

function walkFiles(directory, prefix = '') {
  const files = []

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(prefix, entry.name)

    if (entry.isDirectory()) {
      files.push(...walkFiles(join(directory, entry.name), path))
      continue
    }

    files.push(path.split('\\').join('/'))
  }

  return files
}

function copyModule(source, target) {
  if (!existsSync(source)) {
    throw new Error(
      `Cannot build the facade: ${relative(repoRoot, source)} is missing. Run the internal package builds first.`,
    )
  }

  for (const file of walkFiles(source)) {
    if (!isFacadeFile(file)) continue

    const destination = join(outputRoot, target, file)
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, readFileSync(join(source, file)))
  }
}

function copyStyles() {
  const missing = missingStylesheetSources(stylesManifest, (source) =>
    existsSync(join(stylesPackageDir, source)),
  )

  if (missing.length > 0) {
    throw new Error(
      `Cannot build the facade: stylesheet ${missing
        .map((entry) => entry.source)
        .join(', ')} is missing.`,
    )
  }

  for (const entry of styles) {
    const source = join(stylesPackageDir, entry.source)
    const destination = join(outputRoot, entry.target)
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, readFileSync(source))
  }
}

function copyElementTypings() {
  const source = join(repoRoot, 'packages/elements/src/global.d.ts')

  if (!existsSync(source)) {
    throw new Error('Cannot build the facade: packages/elements/src/global.d.ts is missing.')
  }

  mkdirSync(join(outputRoot, 'elements'), { recursive: true })
  writeFileSync(join(outputRoot, 'elements/global.d.ts'), readFileSync(source))
}

function copyLegalFiles() {
  for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) {
    const source = join(repoRoot, file)

    if (!existsSync(source)) {
      throw new Error(`Cannot build the facade: ${file} is missing at the repository root.`)
    }

    writeFileSync(join(packageDir, file), readFileSync(source))
  }
}

function rewriteOutput() {
  const rewrittenFiles = []

  for (const file of walkFiles(outputRoot)) {
    if (!file.endsWith('.js') && !file.endsWith('.d.ts')) continue

    const destination = join(outputRoot, file)
    const code = stripSourceMapComments(readFileSync(destination, 'utf8'))
    const rewritten = rewriteSpecifiers(code, file, {
      facadeRoot: outputRoot,
      fileExists: (target) => existsSync(join(outputRoot, target)),
    })

    writeFileSync(destination, rewritten)
    rewrittenFiles.push(file)
  }

  return rewrittenFiles
}

function findPrivateReferences(files) {
  return files.filter((file) => {
    if (!file.endsWith('.js') && !file.endsWith('.d.ts')) return false
    return readFileSync(join(outputRoot, file), 'utf8').includes('@workbench-kit/')
  })
}

function fail(messages) {
  console.error('')
  console.error(
    `✗ Facade build failed with ${messages.length} problem${messages.length === 1 ? '' : 's'}:`,
  )
  console.error('')

  for (const message of messages) console.error(`  ${message}`)

  process.exit(1)
}

try {
  rmSync(outputRoot, { recursive: true, force: true })
  mkdirSync(outputRoot, { recursive: true })

  for (const module of moduleSources) copyModule(module.source, module.target)
  copyStyles()
  copyElementTypings()
  copyLegalFiles()

  const rewrittenFiles = rewriteOutput()
  const manifest = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'))
  const allFiles = walkFiles(outputRoot)
  const problems = [
    ...validateExportTargets(manifest, (target) => existsSync(join(packageDir, target))).map(
      (violation) => violation.message,
    ),
    ...missingElementExports(manifest, readdirSync(join(outputRoot, 'elements'))).map(
      (tag) => `Element entry "${tag}" has no ./elements/${tag} export in the facade manifest.`,
    ),
    ...missingTypesConditions(manifest).map(
      (subpath) => `Export "${subpath}" has JavaScript but no types condition.`,
    ),
    ...findPrivateReferences(allFiles).map(
      (file) => `${file} still references a private @workbench-kit package.`,
    ),
  ]

  if (problems.length > 0) fail(problems)

  console.log(
    `Facade build: ${moduleSources.length} modules, ${styles.length} stylesheets, ${rewrittenFiles.length} rewritten files`,
  )
  console.log(`✓ ${allFiles.length} files in ${relative(repoRoot, outputRoot)}`)
} catch (error) {
  if (error.message.startsWith('Cannot build the facade:')) fail([error.message])
  throw error
}
