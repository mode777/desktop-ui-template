import { builtinModules } from 'node:module'
import { relative, isAbsolute, sep } from 'node:path'

import {
  extractImports,
  isAssetPath,
  isRelative,
  packageNameOf,
  resolveRelativeImport,
} from './import-graph.mjs'

const BUILTINS = new Set(builtinModules)

function escapeRegExp(value) {
  return value.replace(/[.+^${}()|[\]\\]/g, '\\$&')
}

export function globToRegExp(glob) {
  let pattern = '^'

  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index]

    if (char === '*') {
      if (glob[index + 1] === '*' && glob[index + 2] === '/') {
        pattern += '(?:.*/)?'
        index += 2
      } else if (glob[index + 1] === '*') {
        pattern += '.*'
        index += 1
      } else {
        pattern += '[^/]*'
      }
      continue
    }

    if (char === '?') {
      pattern += '[^/]'
      continue
    }

    pattern += escapeRegExp(char)
  }

  return new RegExp(`${pattern}$`)
}

export function specificityOf(glob) {
  return glob.split('/').filter((segment) => segment.length > 0 && !segment.includes('*')).length
}

/**
 * Resolves the layer for a repo-relative path. Higher `priority` wins, then the
 * most specific glob, then declaration order. `test` uses priority so test
 * files stay exempt inside kit directories.
 */
export function layerFor(file, config) {
  const normalised = file.split(sep).join('/')
  const matches = []

  config.layers.forEach((layer, index) => {
    for (const glob of layer.include ?? []) {
      if (globToRegExp(glob).test(normalised)) {
        matches.push({
          layer,
          index,
          priority: layer.priority ?? 0,
          specificity: specificityOf(glob),
        })
      }
    }
  })

  matches.sort(
    (a, b) => b.priority - a.priority || b.specificity - a.specificity || a.index - b.index,
  )

  return matches[0]?.layer ?? null
}

function allowedExternally(layer, packageName) {
  const allowed = layer.allowedExternals ?? []
  return allowed.includes('*') || allowed.includes(packageName)
}

/**
 * Finds the workspace package that owns a repo-relative path. The declaration
 * supplies both the layer a package name resolves to and the source root that
 * must not be reached by a relative import from outside the package.
 */
export function workspacePackageForPath(file, config) {
  const normalised = file.split(sep).join('/')

  for (const [name, entry] of Object.entries(config.workspacePackages ?? {})) {
    const root = String(entry?.root ?? '').replace(/\/+$/, '')
    if (!root) continue
    if (normalised === root || normalised.startsWith(`${root}/`)) {
      return { name, layer: entry.layer, root }
    }
  }

  return null
}

function isBuiltin(specifier, packageName) {
  return specifier.startsWith('node:') || BUILTINS.has(packageName)
}

function toRepoRelative(target, repoRoot) {
  const path = relative(repoRoot, target)
  if (path.startsWith('..') || isAbsolute(path)) return null
  return path.split(sep).join('/')
}

/**
 * Checks a set of parsed sources against the declared layer model.
 *
 * sources: [{ path, absolutePath, code }] where path is repo-relative POSIX.
 * Returns every violation with the importing file, line and rule so the CLI can
 * print an actionable location.
 */
export function checkBoundaries(sources, config, options = {}) {
  const repoRoot = options.repoRoot ?? process.cwd()
  const resolveImport = options.resolve ?? resolveRelativeImport
  const violations = []
  let importCount = 0

  for (const source of sources) {
    const file = source.path.split(sep).join('/')
    const layer = layerFor(file, config)
    const imports = extractImports(source.code, file)
    importCount += imports.length

    if (!layer) {
      if (imports.length === 0) continue
      violations.push({
        file,
        line: 1,
        rule: 'unclassified-path',
        message: `No layer is declared for ${file}. Add a layer to boundaries.json instead of letting the path inherit permissions.`,
      })
      continue
    }

    for (const { specifier, line } of imports) {
      if (isRelative(specifier)) {
        const target = resolveImport(source.absolutePath, specifier)

        if (!target) {
          violations.push({
            file,
            line,
            specifier,
            rule: 'unresolved-relative-import',
            message: `Cannot resolve "${specifier}" to a file in the repository.`,
          })
          continue
        }

        const targetPath = toRepoRelative(target, repoRoot)
        if (!targetPath) {
          violations.push({
            file,
            line,
            specifier,
            rule: 'outside-repo-import',
            message: `"${specifier}" resolves outside the repository.`,
          })
          continue
        }

        const sourcePackage = workspacePackageForPath(file, config)
        const targetPackage = workspacePackageForPath(targetPath, config)

        if (targetPackage && sourcePackage?.name !== targetPackage.name) {
          violations.push({
            file,
            line,
            specifier,
            target: targetPath,
            rule: 'package-relative-import',
            message: `Import ${targetPackage.name} by its package name instead of the relative path "${specifier}".`,
          })
          continue
        }

        if (isAssetPath(target)) continue

        const targetLayer = layerFor(targetPath, config)
        const allowed =
          layer.mayImport.includes('*') ||
          (targetLayer !== null && layer.mayImport.includes(targetLayer.name))

        if (!allowed) {
          violations.push({
            file,
            line,
            specifier,
            target: targetPath,
            rule: 'layer-not-allowed',
            message: `${layer.name} may not import ${targetLayer?.name ?? '(unclassified)'}.`,
          })
        }
        continue
      }

      const packageName = packageNameOf(specifier)

      if (isBuiltin(specifier, packageName)) {
        violations.push({
          file,
          line,
          specifier,
          rule: 'builtin-import',
          message: `Node built-ins are not allowed in browser source: "${specifier}".`,
        })
        continue
      }

      const workspace = config.workspacePackages?.[packageName]
      const workspaceLayer = typeof workspace === 'string' ? workspace : workspace?.layer

      if (workspaceLayer) {
        const allowed = layer.mayImport.includes('*') || layer.mayImport.includes(workspaceLayer)

        if (!allowed) {
          violations.push({
            file,
            line,
            specifier,
            target: packageName,
            rule: 'layer-not-allowed',
            message: `${layer.name} may not import the workspace package ${packageName} (${workspaceLayer}).`,
          })
        }
        continue
      }

      if (!allowedExternally(layer, packageName)) {
        violations.push({
          file,
          line,
          specifier,
          rule: 'external-not-allowed',
          message: `${layer.name} may not import the external package ${packageName}.`,
        })
      }
    }
  }

  return { fileCount: sources.length, importCount, violations }
}

export function formatViolations(violations) {
  return violations
    .map((violation) => {
      const location = `${violation.file}:${violation.line}`
      const target = violation.target ? ` → ${violation.target}` : ''
      return `${location}${target}  [${violation.rule}]\n    ${violation.message}`
    })
    .join('\n')
}
