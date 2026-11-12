// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  activateTabIn,
  closeAllIn,
  closeOthersIn,
  closeTabIn,
  cycleTab,
  openTabIn,
  reopenTabIn,
  reorderTabIn,
} from './collection'
import type { TabCollection, TabLike } from './types'

interface WorkbenchTab extends TabLike {
  title: string
  kind: 'file'
  path: string
  language: string
}

const tab = (id: string): WorkbenchTab => ({
  id,
  title: id,
  kind: 'file',
  path: `src/${id}.ts`,
  language: 'typescript',
})

const collection = (...ids: string[]): TabCollection<WorkbenchTab> => ({
  tabs: ids.map(tab),
  activeTabId: ids[0] ?? null,
})

const ids = (tabs: readonly TabLike[]) => tabs.map((entry) => entry.id)

// Compile-time check: the app's tab type must stay assignable to TabLike.
const readId = (entry: TabLike) => entry.id
const readWorkbenchTabId = (entry: WorkbenchTab) => readId(entry)

describe('openTabIn', () => {
  it('appends a new tab and activates it', () => {
    const next = openTabIn(collection('a'), tab('b'))
    expect(ids(next.tabs)).toEqual(['a', 'b'])
    expect(next.activeTabId).toBe('b')
  })

  it('does not duplicate an existing tab but still activates it', () => {
    const state = collection('a', 'b')
    const next = openTabIn(state, tab('a'))
    expect(ids(next.tabs)).toEqual(['a', 'b'])
    expect(next.activeTabId).toBe('a')
  })

  it('keeps a WorkbenchTab readable through the TabLike contract', () => {
    expect(readWorkbenchTabId(tab('a'))).toBe('a')
  })
})

describe('activateTabIn', () => {
  it('activates an existing tab', () => {
    expect(activateTabIn(collection('a', 'b'), 'b').activeTabId).toBe('b')
  })

  it('changes nothing for an unknown id', () => {
    const state = collection('a', 'b')
    const next = activateTabIn(state, 'zzz')
    expect(next).toBe(state)
    expect(next.activeTabId).toBe('a')
  })
})

describe('closeTabIn', () => {
  it('selects the neighbour to the right when the active tab closes', () => {
    const next = closeTabIn(collection('a', 'b', 'c'), 'a')
    expect(ids(next.tabs)).toEqual(['b', 'c'])
    expect(next.activeTabId).toBe('b')
    expect(ids(next.removed)).toEqual(['a'])
  })

  it('falls back to the left when the active last tab closes', () => {
    const state: TabCollection<WorkbenchTab> = {
      tabs: [tab('a'), tab('b'), tab('c')],
      activeTabId: 'c',
    }
    const next = closeTabIn(state, 'c')
    expect(ids(next.tabs)).toEqual(['a', 'b'])
    expect(next.activeTabId).toBe('b')
  })

  it('empties the collection and clears the active tab when the last tab closes', () => {
    const next = closeTabIn(collection('a'), 'a')
    expect(next.tabs).toEqual([])
    expect(next.activeTabId).toBeNull()
    expect(ids(next.removed)).toEqual(['a'])
  })

  it('keeps the active tab when an inactive tab closes', () => {
    const next = closeTabIn(collection('a', 'b', 'c'), 'b')
    expect(ids(next.tabs)).toEqual(['a', 'c'])
    expect(next.activeTabId).toBe('a')
  })

  it('changes nothing for an unknown id', () => {
    const state = collection('a', 'b')
    const next = closeTabIn(state, 'zzz')
    expect(next.tabs).toBe(state.tabs)
    expect(next.activeTabId).toBe('a')
    expect(next.removed).toEqual([])
  })
})

describe('bulk closing', () => {
  it('closeOthersIn keeps the target and reports the rest most recent first', () => {
    const next = closeOthersIn(collection('a', 'b', 'c'), 'b')
    expect(ids(next.tabs)).toEqual(['b'])
    expect(next.activeTabId).toBe('b')
    expect(ids(next.removed)).toEqual(['c', 'a'])
  })

  it('closeAllIn empties the collection and reports every tab most recent first', () => {
    const next = closeAllIn(collection('a', 'b', 'c'))
    expect(next.tabs).toEqual([])
    expect(next.activeTabId).toBeNull()
    expect(ids(next.removed)).toEqual(['c', 'b', 'a'])
  })
})

describe('reopenTabIn', () => {
  it('appends the most recent closed tab, activates it and drops it from history', () => {
    const next = reopenTabIn(collection('a'), [tab('b'), tab('c')])
    expect(ids(next.tabs)).toEqual(['a', 'b'])
    expect(next.activeTabId).toBe('b')
    expect(ids(next.closedTabs)).toEqual(['c'])
  })

  it('does not duplicate a tab that is already open', () => {
    const next = reopenTabIn(collection('a'), [tab('a')])
    expect(ids(next.tabs)).toEqual(['a'])
    expect(next.closedTabs).toEqual([])
  })

  it('changes nothing when history is empty', () => {
    const state = collection('a')
    const next = reopenTabIn(state, [])
    expect(next.tabs).toBe(state.tabs)
    expect(next.activeTabId).toBe('a')
    expect(next.closedTabs).toEqual([])
  })
})

describe('reorderTabIn', () => {
  it('places a tab moved toward the start before the target', () => {
    const next = reorderTabIn(collection('a', 'b', 'c'), 'c', 'a')
    expect(ids(next.tabs)).toEqual(['c', 'a', 'b'])
  })

  it('places a tab moved toward the end after the target', () => {
    const next = reorderTabIn(collection('a', 'b', 'c'), 'a', 'c')
    expect(ids(next.tabs)).toEqual(['b', 'c', 'a'])
  })

  it('changes nothing for unknown or identical ids', () => {
    const state = collection('a', 'b', 'c')
    expect(reorderTabIn(state, 'a', 'a')).toBe(state)
    expect(reorderTabIn(state, 'zzz', 'a')).toBe(state)
    expect(reorderTabIn(state, 'a', 'zzz')).toBe(state)
  })
})

describe('cycleTab', () => {
  it('moves forward and wraps to the first tab', () => {
    const state: TabCollection<WorkbenchTab> = {
      tabs: [tab('a'), tab('b'), tab('c')],
      activeTabId: 'c',
    }
    expect(cycleTab(state, 1).activeTabId).toBe('a')
  })

  it('moves backward and wraps to the last tab', () => {
    const state: TabCollection<WorkbenchTab> = {
      tabs: [tab('a'), tab('b'), tab('c')],
      activeTabId: 'a',
    }
    expect(cycleTab(state, -1).activeTabId).toBe('c')
  })

  it('selects the first or last tab when none is active', () => {
    const state: TabCollection<WorkbenchTab> = {
      tabs: [tab('a'), tab('b'), tab('c')],
      activeTabId: null,
    }
    expect(cycleTab(state, 1).activeTabId).toBe('a')
    expect(cycleTab(state, -1).activeTabId).toBe('c')
  })

  it('leaves an empty collection unchanged', () => {
    const state: TabCollection<WorkbenchTab> = { tabs: [], activeTabId: null }
    expect(cycleTab(state, 1)).toBe(state)
    expect(cycleTab(state, -1)).toBe(state)
  })
})
