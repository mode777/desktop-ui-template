import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const source = resolve(repoRoot, 'packages/workbench/docs')
const content = resolve(repoRoot, 'docs-site/content')
const raw = resolve(content, 'public/raw')

if (!existsSync(source)) {
  console.error(`Missing consumer docs directory: ${source}`)
  process.exit(1)
}

rmSync(content, { recursive: true, force: true })

function copyMarkdown(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      copyMarkdown(path)
      continue
    }
    if (!entry.name.endsWith('.md')) continue

    const relativePath = relative(source, path)
    const siteDestination = join(content, relativePath)
    const rawDestination = join(raw, relativePath)
    mkdirSync(dirname(siteDestination), { recursive: true })
    mkdirSync(dirname(rawDestination), { recursive: true })
    cpSync(path, siteDestination)
    cpSync(path, rawDestination)
  }
}

copyMarkdown(source)
console.log(`Synced consumer docs to ${relative(repoRoot, content)}/ and raw/`)
