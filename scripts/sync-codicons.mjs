import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// vscode-elements needs the Codicon stylesheet as a real <link> with the id
// "vscode-codicon-stylesheet" (see index.html). Vite serves public/ verbatim,
// so copy the font assets there before dev/build instead of vendoring them.
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const source = join(root, 'node_modules', '@vscode', 'codicons', 'dist')
const target = join(root, 'public', 'codicons')

mkdirSync(target, { recursive: true })

for (const file of ['codicon.css', 'codicon.ttf']) {
  copyFileSync(join(source, file), join(target, file))
}

console.log(`[codicons] synced ${target}`)
