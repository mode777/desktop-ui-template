import { describe, expect, it } from 'vitest'
import type { TabLike } from '@workbench-kit/core'
import type { WorkbenchTab } from './workbench-types'

const readId = (entry: TabLike) => entry.id

describe('workbench tab types', () => {
  it('keeps the preset tab assignable to the core tab contract', () => {
    const tab: WorkbenchTab = {
      id: 'example',
      title: 'Example',
      kind: 'file',
      path: 'src/example.ts',
      language: 'typescript',
    }

    expect(readId(tab)).toBe('example')
  })
})
