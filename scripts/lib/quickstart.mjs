const MARKER = /<!--\s*quickstart-file:\s*([^\s]+)\s*-->/g
const FENCE = /```[^\n]*\n([\s\S]*?)```/

export function extractQuickstartFiles(markdown) {
  const files = []
  const seen = new Set()

  for (const marker of markdown.matchAll(MARKER)) {
    const path = marker[1]
    if (seen.has(path)) throw new Error(`Quickstart marker "${path}" appears more than once.`)
    seen.add(path)

    const afterMarker = markdown.slice(marker.index + marker[0].length)
    const fence = FENCE.exec(afterMarker)
    if (!fence)
      throw new Error(`Quickstart marker "${path}" is not followed by a fenced code block.`)

    files.push({ path, content: fence[1].endsWith('\n') ? fence[1] : `${fence[1]}\n` })
  }

  if (files.length === 0) throw new Error('Quickstart contains no quickstart-file markers.')
  return files
}
