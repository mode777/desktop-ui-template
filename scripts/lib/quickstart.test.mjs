// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { extractQuickstartFiles } from './quickstart.mjs'

describe('extractQuickstartFiles', () => {
  it('extracts marked fenced files in order', () => {
    const markdown = [
      '<!-- quickstart-file: vite.config.ts -->',
      '```ts',
      'export default 1',
      '```',
      '<!-- quickstart-file: src/main.tsx -->',
      '```tsx',
      'export const App = () => null',
      '```',
    ].join('\n')

    expect(extractQuickstartFiles(markdown)).toEqual([
      { path: 'vite.config.ts', content: 'export default 1\n' },
      { path: 'src/main.tsx', content: 'export const App = () => null\n' },
    ])
  })

  it('rejects duplicate and unmarked files', () => {
    expect(() =>
      extractQuickstartFiles(
        '<!-- quickstart-file: a.ts -->\n```ts\na\n```\n<!-- quickstart-file: a.ts -->\n```ts\na\n```',
      ),
    ).toThrow('appears more than once')

    expect(() => extractQuickstartFiles('# No files')).toThrow('no quickstart-file markers')
  })

  it('rejects a marker without a fenced block', () => {
    expect(() => extractQuickstartFiles('<!-- quickstart-file: a.ts -->\n\nText')).toThrow(
      'not followed by a fenced code block',
    )
  })
})
