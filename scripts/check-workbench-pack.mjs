import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { exportTargets } from './lib/facade.mjs'
import {
  createConsumerRuntimeSource,
  createConsumerTsConfig,
  createConsumerTypecheckSource,
  createCssDeclarations,
  findContentViolations,
  validateTarballFiles,
} from './lib/pack-check.mjs'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)

function readFlag(name, fallback) {
  const index = args.indexOf(name)
  return index === -1 ? fallback : args[index + 1]
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node scripts/check-workbench-pack.mjs [options]

Options:
  --package-dir <dir>  Package directory to pack. Defaults to packages/workbench.
  --no-build           Skip the facade build and use the existing output.
  --keep-temp          Keep the extracted tarball and consumer directory.
  -h, --help           Show this help.

Exit codes: 0 when the tarball is complete and consumable, 1 on any violation.
`)
  process.exit(0)
}

const packageDir = resolve(repoRoot, readFlag('--package-dir', 'packages/workbench'))
const noBuild = args.includes('--no-build')
const keepTemp = args.includes('--keep-temp')

function fail(message, details = []) {
  console.error('')
  console.error(`✗ ${message}`)

  for (const detail of details) console.error(`  ${detail}`)

  process.exit(1)
}

function run(command, commandArgs, options = {}) {
  return spawnSync(command, commandArgs, {
    encoding: 'utf8',
    ...options,
  })
}

if (!noBuild) {
  const build = run('npm', ['run', 'build:facade'], { cwd: repoRoot, stdio: 'inherit' })

  if (build.status !== 0) fail('The facade build failed before packing.')
}

const manifestPath = join(packageDir, 'package.json')

if (!existsSync(manifestPath)) fail(`No package manifest at ${relative(repoRoot, manifestPath)}.`)

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const targets = exportTargets(manifest)
const jsSubpaths = []
const cssSubpaths = []
let typesSubpath = null

for (const subpath of Object.keys(manifest.exports ?? {})) {
  const subpathTargets = targets.filter((entry) => entry.subpath === subpath)
  const hasJavaScript = subpathTargets.some((entry) => entry.target.endsWith('.js'))
  const hasCss = subpathTargets.some((entry) => entry.target.endsWith('.css'))

  if (subpath === './elements/types') {
    typesSubpath = subpath
  } else if (hasJavaScript) {
    jsSubpaths.push(subpath)
  } else if (hasCss) {
    cssSubpaths.push(subpath)
  }
}

const tempRoot = mkdtempSync(join(tmpdir(), 'workbench-pack-'))
let succeeded = false

try {
  const packDestination = join(tempRoot, 'pack')
  mkdirSync(packDestination, { recursive: true })

  const pack = run('npm', ['pack', '--json', '--pack-destination', packDestination], {
    cwd: packageDir,
  })

  if (pack.status !== 0) fail('npm pack failed.', [pack.stderr])

  let packed

  try {
    packed = JSON.parse(pack.stdout)
  } catch {
    fail('Could not parse npm pack output.', [pack.stdout])
  }

  if (packed.length !== 1) fail(`Expected exactly one tarball, got ${packed.length}.`)

  const [entry] = packed
  const tarballPath = join(packDestination, entry.filename)
  const files = entry.files.map((file) => file.path)
  const fileViolations = validateTarballFiles(files, manifest)

  if (fileViolations.length > 0) {
    fail(
      `The tarball has ${fileViolations.length} file or manifest problem${fileViolations.length === 1 ? '' : 's'}.`,
      fileViolations.map((violation) => violation.message),
    )
  }

  const extractRoot = join(tempRoot, 'extract')
  mkdirSync(extractRoot, { recursive: true })

  const extract = run('tar', ['-xzf', tarballPath, '-C', extractRoot])

  if (extract.status !== 0) fail('Could not extract the tarball.', [extract.stderr])

  const extractedPackage = join(extractRoot, 'package')
  const contentViolations = findContentViolations({
    files: files.filter((file) => file.startsWith('dist/')),
    readFile: (file) => readFileSync(join(extractedPackage, file), 'utf8'),
  })

  if (contentViolations.length > 0) {
    fail(
      `The tarball has ${contentViolations.length} content problem${contentViolations.length === 1 ? '' : 's'}.`,
      contentViolations.map((violation) => violation.message),
    )
  }

  const consumerDir = join(tempRoot, 'consumer')
  const consumerModules = join(consumerDir, 'node_modules')
  const facadeLink = join(consumerModules, '@workbench-kit/workbench')

  mkdirSync(dirname(facadeLink), { recursive: true })
  renameSync(extractedPackage, facadeLink)

  const runtimePackages = [
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.dependencies ?? {}),
    'jsdom',
    '@types/react',
    '@types/react-dom',
  ]

  for (const packageName of runtimePackages) {
    const source = join(repoRoot, 'node_modules', packageName)

    if (!existsSync(source)) {
      fail(`Cannot link ${packageName} for the pack consumer; it is missing from node_modules.`)
    }

    const target = join(consumerModules, packageName)
    mkdirSync(dirname(target), { recursive: true })

    if (!existsSync(target)) symlinkSync(source, target, 'dir')
  }

  writeFileSync(
    join(consumerDir, 'package.json'),
    `${JSON.stringify({ name: 'workbench-pack-consumer', private: true, type: 'module' }, null, 2)}\n`,
  )

  writeFileSync(
    join(consumerDir, 'runtime.mjs'),
    createConsumerRuntimeSource({ jsSubpaths, cssSubpaths }),
  )

  const runtime = run(process.execPath, ['runtime.mjs'], { cwd: consumerDir })

  if (runtime.status !== 0) {
    fail('The packed package failed a runtime import.', [runtime.stdout, runtime.stderr])
  }

  writeFileSync(
    join(consumerDir, 'consumer.tsx'),
    createConsumerTypecheckSource({ jsSubpaths, cssSubpaths, typesSubpath }),
  )
  writeFileSync(join(consumerDir, 'css.d.ts'), createCssDeclarations())
  writeFileSync(
    join(consumerDir, 'tsconfig.json'),
    `${JSON.stringify(createConsumerTsConfig(), null, 2)}\n`,
  )

  const tscPath = join(repoRoot, 'node_modules/typescript/bin/tsc')

  if (!existsSync(tscPath)) fail('Cannot find the repository TypeScript compiler.')

  const typecheck = run(process.execPath, [tscPath, '-p', join(consumerDir, 'tsconfig.json')], {
    cwd: consumerDir,
  })

  if (typecheck.status !== 0) {
    fail('The packed package failed the consumer typecheck.', [typecheck.stdout, typecheck.stderr])
  }

  succeeded = true

  console.log('')
  console.log(`Pack check: ${entry.filename} (${files.length} files, ${entry.size} B packaged)`)
  console.log(`✓ tarball contents and manifest`)
  console.log(`✓ resolved ${jsSubpaths.length} JavaScript and ${cssSubpaths.length} CSS subpaths`)
  console.log(`✓ runtime imports and element registrations`)
  console.log(`✓ consumer typecheck`)
} finally {
  if (succeeded || !keepTemp) {
    rmSync(tempRoot, { recursive: true, force: true })
  } else {
    console.error(`Pack check temp directory kept at ${tempRoot}`)
  }
}
