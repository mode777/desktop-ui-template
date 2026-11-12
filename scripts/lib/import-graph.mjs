import { existsSync, statSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'

import { parseAst } from 'vite'

const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.json']
const ASSET_EXTENSIONS = new Set(['.css', '.json'])
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx'])

export function isSourceFile(name) {
  return SOURCE_EXTENSIONS.has(extname(name)) && !name.endsWith('.d.ts')
}

export function isAssetPath(path) {
  return ASSET_EXTENSIONS.has(extname(path))
}

function isFile(path) {
  return existsSync(path) && statSync(path).isFile()
}

export function lineForOffset(code, offset) {
  let line = 1
  for (let index = 0; index < offset && index < code.length; index += 1) {
    if (code.charCodeAt(index) === 10) line += 1
  }
  return line
}

function languageFor(file) {
  return file.endsWith('.tsx') || file.endsWith('.jsx') ? 'tsx' : 'ts'
}

/**
 * Parses a source file and returns every module specifier it depends on.
 * Uses Vite's oxc-backed parser so imports inside strings, comments or JSX text
 * (the mock documents in apps/template/src/demo/data/workspace.ts contain such strings) are not
 * mistaken for real dependencies.
 */
export function extractImports(code, file = 'module.tsx') {
  const ast = parseAst(code, { lang: languageFor(file) })
  const imports = []

  const visit = (node) => {
    if (!node || typeof node !== 'object') return

    if (Array.isArray(node)) {
      for (const child of node) visit(child)
      return
    }

    if (
      node.type === 'ImportDeclaration' ||
      node.type === 'ExportAllDeclaration' ||
      (node.type === 'ExportNamedDeclaration' && node.source)
    ) {
      imports.push({
        specifier: node.source.value,
        line: lineForOffset(code, node.source.start),
        kind: 'static',
      })
      return
    }

    if (node.type === 'ImportExpression' && node.source?.type === 'Literal') {
      imports.push({
        specifier: node.source.value,
        line: lineForOffset(code, node.source.start),
        kind: 'dynamic',
      })
      return
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === 'start' || key === 'end' || key === 'loc') continue
      if (value && typeof value === 'object') visit(value)
    }
  }

  visit(ast)
  return imports
}

export function resolveRelativeImport(fromFile, specifier) {
  const base = resolve(dirname(fromFile), specifier)
  const candidates = [
    base,
    ...RESOLVE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...RESOLVE_EXTENSIONS.map((extension) => join(base, `index${extension}`)),
  ]

  return candidates.find(isFile) ?? null
}

export function isRelative(specifier) {
  return (
    specifier.startsWith('./') ||
    specifier.startsWith('../') ||
    specifier === '.' ||
    specifier === '..'
  )
}

/**
 * Reduces a module specifier to the package that owns it: '@scope/pkg/deep'
 * becomes '@scope/pkg', 'zustand/middleware' becomes 'zustand'.
 */
export function packageNameOf(specifier) {
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}
