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
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { checkAdoption, formatAdoptionFinding, parsePackageManifest } from './lib/adoption.mjs'
import { extractQuickstartFiles } from './lib/quickstart.mjs'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const packageDir = join(repoRoot, 'packages/workbench')
const args = process.argv.slice(2)
const keepTemp = args.includes('--keep-temp')

function run(command, commandArgs, options = {}) {
  return spawnSync(command, commandArgs, { encoding: 'utf8', ...options })
}

function fail(message, details = []) {
  console.error('')
  console.error(`✗ ${message}`)
  for (const detail of details) console.error(`  ${detail}`)
  process.exit(1)
}

const tempRoot = mkdtempSync(join(tmpdir(), 'workbench-quickstart-'))
let succeeded = false

try {
  const quickstartPath = join(repoRoot, 'packages/workbench/docs/quickstart.md')
  const files = extractQuickstartFiles(readFileSync(quickstartPath, 'utf8'))

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

  const tarballPath = join(packDestination, packed[0].filename)
  const extractRoot = join(tempRoot, 'extract')
  mkdirSync(extractRoot, { recursive: true })

  const extract = run('tar', ['-xzf', tarballPath, '-C', extractRoot])
  if (extract.status !== 0) fail('Could not extract the package tarball.', [extract.stderr])

  const consumerDir = join(tempRoot, 'consumer')
  const consumerModules = join(consumerDir, 'node_modules')
  const packageLink = join(consumerModules, 'vscode-workbench')

  mkdirSync(dirname(packageLink), { recursive: true })
  renameSync(join(extractRoot, 'package'), packageLink)

  const runtimePackages = [
    'react',
    'react-dom',
    'zustand',
    '@vscode-elements/elements',
    '@vitejs/plugin-react',
    'vite',
    'typescript',
    '@types/react',
    '@types/react-dom',
  ]

  for (const packageName of runtimePackages) {
    const source = join(repoRoot, 'node_modules', packageName)
    if (!existsSync(source)) fail(`Cannot link ${packageName}; it is missing from node_modules.`)
    const target = join(consumerModules, packageName)
    mkdirSync(dirname(target), { recursive: true })
    if (!existsSync(target)) symlinkSync(source, target, 'dir')
  }

  for (const file of files) {
    const destination = join(consumerDir, file.path)
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, file.content)
  }

  writeFileSync(
    join(consumerDir, 'package.json'),
    `${JSON.stringify(
      {
        name: 'workbench-quickstart-consumer',
        private: true,
        type: 'module',
        scripts: { build: 'vite build', typecheck: 'tsc --noEmit' },
        dependencies: {
          'vscode-workbench': '0.1.2',
          '@vscode-elements/elements': '^2.5.1',
          react: '^19.0.0',
          'react-dom': '^19.0.0',
        },
      },
      null,
      2,
    )}\n`,
  )

  writeFileSync(
    join(consumerDir, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2023',
          lib: ['ES2023', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          moduleResolution: 'Bundler',
          jsx: 'react-jsx',
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          types: ['vite/client'],
        },
        include: ['src'],
      },
      null,
      2,
    )}\n`,
  )

  writeFileSync(
    join(consumerDir, 'src/vite-env.d.ts'),
    '/// <reference types="vite/client" />\ndeclare module \'*.css\'\n',
  )

  const vitePath = join(repoRoot, 'node_modules/vite/bin/vite.js')
  const tscPath = join(repoRoot, 'node_modules/typescript/bin/tsc')
  if (!existsSync(vitePath)) fail('Cannot find the repository Vite binary.')
  if (!existsSync(tscPath)) fail('Cannot find the repository TypeScript compiler.')

  const typecheck = run(process.execPath, [tscPath, '-p', join(consumerDir, 'tsconfig.json')], {
    cwd: consumerDir,
  })
  if (typecheck.status !== 0) {
    fail('The documented quickstart failed the TypeScript check.', [
      typecheck.stdout,
      typecheck.stderr,
      `Files: ${files.map((file) => file.path).join(', ')}`,
    ])
  }

  const build = run(process.execPath, [vitePath, 'build'], { cwd: consumerDir })
  if (build.status !== 0) {
    fail('The documented quickstart failed the production build.', [
      build.stdout,
      build.stderr,
      `Files: ${files.map((file) => file.path).join(', ')}`,
    ])
  }

  if (!existsSync(join(consumerDir, 'dist/index.html'))) {
    fail('The quickstart build produced no dist/index.html.')
  }

  const adoption = checkAdoption({
    appDir: consumerDir,
    level: 'auto',
    packageManifest: parsePackageManifest(packageDir),
  })
  if (!adoption.ok) {
    fail(
      `The quickstart failed ${adoption.summary.errors} adoption checks.`,
      adoption.findings
        .filter((finding) => finding.severity === 'error')
        .map((finding) => formatAdoptionFinding(finding, consumerDir)),
    )
  }

  succeeded = true
  console.log(`Quickstart check: ${files.length} files from ${quickstartPath}`)
  console.log('✓ documented quickstart typechecks')
  console.log('✓ documented quickstart builds from the packed package')
  console.log(`✓ documented quickstart passes adoption checks (${adoption.level} level)`)
} finally {
  if (succeeded || !keepTemp) {
    rmSync(tempRoot, { recursive: true, force: true })
  } else {
    console.error(`Quickstart temp directory kept at ${tempRoot}`)
  }
}
