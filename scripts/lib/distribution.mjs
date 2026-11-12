import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function readManifest(repoRoot, packagePath) {
  const file = join(repoRoot, packagePath, 'package.json')
  if (!existsSync(file)) return null

  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    return { __parseError: error.message }
  }
}

function dependencyNames(manifest) {
  return [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ]
}

function hasExportPrefix(exportsField, prefix) {
  if (!exportsField || typeof exportsField !== 'object') return false

  const keys = Object.keys(exportsField)
  if (prefix === '.') return keys.includes('.')

  const base = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
  return keys.some((key) => key === base || key.startsWith(`${base}/`))
}

/**
 * Validates the distribution boundary that complements the source import graph:
 * five private internal modules and, once it exists, one public package that
 * exposes them through subpath exports.
 */
export function checkDistribution(repoRoot, config) {
  const violations = []
  const internalNames = new Set(config.internalModules.map((entry) => entry.name))
  const internalPaths = new Map(config.internalModules.map((entry) => [entry.path, entry]))
  const publicPackage = config.publicPackage
  const publicManifest = publicPackage ? readManifest(repoRoot, publicPackage.path) : null
  const publicPresent = Boolean(publicManifest && publicManifest.__parseError === undefined)
  const packagesRoot = join(repoRoot, 'packages')
  const discovered = existsSync(packagesRoot)
    ? readdirSync(packagesRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => `packages/${entry.name}`)
    : []

  for (const packagePath of discovered) {
    const known = internalPaths.has(packagePath) || packagePath === publicPackage?.path
    if (!known) {
      violations.push({
        file: `${packagePath}/package.json`,
        rule: 'unexpected-package',
        message: `Unexpected workspace package at ${packagePath}. The distribution model is five internal modules plus the single public package declared in distribution.json.`,
      })
    }
  }

  for (const entry of config.internalModules) {
    const manifest = readManifest(repoRoot, entry.path)
    const file = `${entry.path}/package.json`

    if (!manifest) {
      violations.push({
        file,
        rule: 'missing-internal-module',
        message: `Internal module ${entry.name} has no manifest.`,
      })
      continue
    }

    if (manifest.__parseError) {
      violations.push({
        file,
        rule: 'unreadable-manifest',
        message: `Cannot parse ${file}: ${manifest.__parseError}`,
      })
      continue
    }

    if (manifest.name !== entry.name) {
      violations.push({
        file,
        rule: 'module-name-mismatch',
        message: `Expected ${entry.path} to be named ${entry.name}, found ${manifest.name ?? '(no name)'}.`,
      })
    }

    if (manifest.private !== true) {
      violations.push({
        file,
        rule: 'internal-module-published',
        message: `${entry.name} must stay private. Only ${publicPackage?.name ?? 'the public package'} is published.`,
      })
    }

    const allowed = new Set(entry.mayDependOn ?? [])
    for (const dependency of dependencyNames(manifest)) {
      if (!internalNames.has(dependency)) continue
      if (dependency === manifest.name) {
        violations.push({
          file,
          rule: 'self-dependency',
          message: `${entry.name} must not depend on itself.`,
        })
        continue
      }
      if (!allowed.has(dependency)) {
        violations.push({
          file,
          rule: 'internal-dependency-not-allowed',
          message: `${entry.name} may not depend on ${dependency}. Allowed internal dependencies: ${
            [...allowed].join(', ') || '(none)'
          }.`,
        })
      }
    }

    if (publicPackage && dependencyNames(manifest).includes(publicPackage.name)) {
      violations.push({
        file,
        rule: 'internal-depends-on-public',
        message: `${entry.name} must not depend on the public package ${publicPackage.name}. Dependencies point from the facade to the modules, never the other way.`,
      })
    }
  }

  if (publicManifest?.__parseError) {
    violations.push({
      file: `${publicPackage.path}/package.json`,
      rule: 'unreadable-manifest',
      message: `Cannot parse the public package manifest: ${publicManifest.__parseError}`,
    })
  } else if (publicManifest) {
    const file = `${publicPackage.path}/package.json`

    if (publicManifest.name !== publicPackage.name) {
      violations.push({
        file,
        rule: 'public-name-mismatch',
        message: `Expected the public package to be named ${publicPackage.name}, found ${
          publicManifest.name ?? '(no name)'
        }.`,
      })
    }

    for (const dependency of dependencyNames(publicManifest)) {
      if (internalNames.has(dependency)) {
        violations.push({
          file,
          rule: 'public-depends-on-internal',
          message: `The public package must bundle the internal modules, not depend on ${dependency} at runtime.`,
        })
      }
    }

    const exportsField = publicManifest.exports
    for (const prefix of publicPackage.requiredExportPrefixes ?? []) {
      if (!hasExportPrefix(exportsField, prefix)) {
        violations.push({
          file,
          rule: 'public-export-missing',
          message: `The public package must expose an export matching "${prefix}".`,
        })
      }
    }

    const peers = new Set(Object.keys(publicManifest.peerDependencies ?? {}))
    for (const peer of publicPackage.requiredPeers ?? []) {
      if (!peers.has(peer)) {
        violations.push({
          file,
          rule: 'public-peer-missing',
          message: `The public package must declare ${peer} as a peer dependency.`,
        })
      }
    }
  }

  const nonPrivate = discovered
    .map((packagePath) => ({ packagePath, manifest: readManifest(repoRoot, packagePath) }))
    .filter(
      ({ manifest }) =>
        manifest && manifest.__parseError === undefined && manifest.private !== true,
    )

  for (const { packagePath, manifest } of nonPrivate) {
    if (!publicPackage || manifest.name !== publicPackage.name) {
      violations.push({
        file: `${packagePath}/package.json`,
        rule: 'unexpected-public-package',
        message: `${manifest.name ?? packagePath} is not the single public package ${publicPackage?.name ?? '(not configured)'}.`,
      })
    }
  }

  if (nonPrivate.length > 1) {
    violations.push({
      file: 'distribution.json',
      rule: 'multiple-public-packages',
      message: `Only one package may be public. Found ${nonPrivate.length}: ${nonPrivate
        .map(({ manifest }) => manifest.name)
        .join(', ')}.`,
    })
  }

  return {
    moduleCount: config.internalModules.length,
    publicPackagePresent: publicPresent,
    publicPackageName: publicPackage?.name ?? null,
    violations,
  }
}

export function formatDistributionViolations(violations) {
  return violations
    .map((violation) => `${violation.file}  [${violation.rule}]\n    ${violation.message}`)
    .join('\n')
}
