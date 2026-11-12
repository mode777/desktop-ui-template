import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialData, seedInitialSession, useWorkbenchStore } from './workbench-store'
import type { WorkbenchTab } from './workbench-types'

const tab = (id: string): WorkbenchTab => ({
  id,
  title: id,
  kind: 'file',
  path: `src/${id}.ts`,
  language: 'typescript',
})

const welcomeTab = tab('welcome')
const configTab = tab('config')
const initialTabs = [welcomeTab, configTab]
const initialOutputLines = ['[test] ready']

describe('workbench store', () => {
  beforeEach(() => {
    useWorkbenchStore.setState(createInitialData())
  })

  it('opens a new tab and activates it', () => {
    const state = useWorkbenchStore.getState()
    state.openTab(tab('a'))

    const next = useWorkbenchStore.getState()
    expect(next.tabs.at(-1)?.id).toBe('a')
    expect(next.activeTabId).toBe('a')
  })

  it('does not duplicate an existing tab', () => {
    const state = useWorkbenchStore.getState()
    state.openTab(tab('a'))
    state.openTab(tab('a'))

    expect(useWorkbenchStore.getState().tabs.filter((entry) => entry.id === 'a')).toHaveLength(1)
  })

  it('selects the next tab when the active tab is closed', () => {
    useWorkbenchStore.setState({ tabs: initialTabs, activeTabId: welcomeTab.id })

    useWorkbenchStore.getState().closeTab(welcomeTab.id)
    expect(useWorkbenchStore.getState().activeTabId).toBe(configTab.id)
  })

  it('reorders tabs', () => {
    useWorkbenchStore.setState({
      tabs: [tab('a'), tab('b'), tab('c')],
      activeTabId: 'a',
    })

    useWorkbenchStore.getState().reorderTab('c', 'a')
    expect(useWorkbenchStore.getState().tabs.map((entry) => entry.id)).toEqual(['c', 'a', 'b'])
  })

  it('reopens the most recently closed tab', () => {
    useWorkbenchStore.setState({ tabs: [tab('a')], activeTabId: 'a' })
    useWorkbenchStore.getState().closeTab('a')
    useWorkbenchStore.getState().reopenClosedTab()

    expect(useWorkbenchStore.getState().tabs.map((entry) => entry.id)).toEqual(['a'])
  })

  it('toggles a primary view off when it is already active', () => {
    useWorkbenchStore.setState({ activePrimaryView: 'explorer', primarySideBarVisible: true })
    useWorkbenchStore.getState().togglePrimarySideBar('explorer')

    expect(useWorkbenchStore.getState().primarySideBarVisible).toBe(false)
  })

  it('switches view and opens the sidebar when another view is selected', () => {
    useWorkbenchStore.setState({ activePrimaryView: 'explorer', primarySideBarVisible: false })
    useWorkbenchStore.getState().togglePrimarySideBar('search')

    expect(useWorkbenchStore.getState().primarySideBarVisible).toBe(true)
    expect(useWorkbenchStore.getState().activePrimaryView).toBe('search')
  })

  it('stores the reported region sizes without clamping them itself', () => {
    useWorkbenchStore.getState().setBottomPanelHeight(5)
    expect(useWorkbenchStore.getState().bottomPanelHeight).toBe(5)

    useWorkbenchStore.getState().setBottomPanelHeight(10_000)
    expect(useWorkbenchStore.getState().bottomPanelHeight).toBe(10_000)
  })

  it('resets layout but keeps open tabs', () => {
    useWorkbenchStore.setState({ tabs: [tab('a')], activeTabId: 'a', bottomPanelHeight: 120 })
    useWorkbenchStore.getState().resetLayout()

    expect(useWorkbenchStore.getState().tabs.map((entry) => entry.id)).toEqual(['a'])
    expect(useWorkbenchStore.getState().bottomPanelHeight).toBe(230)
  })

  it('cycles tabs forward and backward', () => {
    useWorkbenchStore.setState({
      tabs: [tab('a'), tab('b'), tab('c')],
      activeTabId: 'b',
    })

    useWorkbenchStore.getState().activateNextTab(1)
    expect(useWorkbenchStore.getState().activeTabId).toBe('c')

    useWorkbenchStore.getState().activateNextTab(1)
    expect(useWorkbenchStore.getState().activeTabId).toBe('a')

    useWorkbenchStore.getState().activateNextTab(-1)
    expect(useWorkbenchStore.getState().activeTabId).toBe('c')
  })
})

describe('first-run session seeding', () => {
  const session = {
    tabs: initialTabs,
    activeTabId: welcomeTab.id,
    outputLines: initialOutputLines,
  }

  beforeEach(() => {
    useWorkbenchStore.setState(createInitialData())
    localStorage.clear()
  })

  it('applies supplied tabs, active tab and output when nothing is stored', () => {
    expect(seedInitialSession(session)).toBe(true)

    const state = useWorkbenchStore.getState()
    expect(state.tabs.map((entry) => entry.id)).toEqual(session.tabs.map((entry) => entry.id))
    expect(state.activeTabId).toBe(welcomeTab.id)
    expect(state.outputLines).toEqual(session.outputLines)
  })

  it('restores a previously persisted session instead of seeding', async () => {
    localStorage.setItem(
      'desktop-ui-template:v1',
      JSON.stringify({
        state: { primarySideBarWidth: 410, primarySideBarVisible: false },
        version: 1,
      }),
    )
    await useWorkbenchStore.persist.rehydrate()

    expect(seedInitialSession(session)).toBe(false)
    const state = useWorkbenchStore.getState()
    expect(state.primarySideBarWidth).toBe(410)
    expect(state.primarySideBarVisible).toBe(false)
    expect(state.tabs).toEqual([])
  })

  it('keeps a closed-all-tabs session empty', async () => {
    localStorage.setItem(
      'desktop-ui-template:v1',
      JSON.stringify({ state: { tabs: [], activeTabId: null }, version: 1 }),
    )
    await useWorkbenchStore.persist.rehydrate()

    expect(seedInitialSession(session)).toBe(false)
    expect(useWorkbenchStore.getState().tabs).toEqual([])
  })
})
