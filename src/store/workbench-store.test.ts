import { beforeEach, describe, expect, it } from 'vitest'
import {
  createInitialData,
  createInitialTabs,
  useWorkbenchStore,
  WELCOME_TAB,
} from './workbench-store'
import type { WorkbenchTab } from './workbench-types'

const tab = (id: string): WorkbenchTab => ({
  id,
  title: id,
  kind: 'file',
  path: `src/${id}.ts`,
  language: 'typescript',
})

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
    useWorkbenchStore.setState({ tabs: createInitialTabs(), activeTabId: WELCOME_TAB.id })
    const [, configTab] = createInitialTabs()

    useWorkbenchStore.getState().closeTab(WELCOME_TAB.id)
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

  it('clamps panel height to the configured bounds', () => {
    useWorkbenchStore.getState().setBottomPanelHeight(5)
    expect(useWorkbenchStore.getState().bottomPanelHeight).toBe(100)

    useWorkbenchStore.getState().setBottomPanelHeight(10_000)
    expect(useWorkbenchStore.getState().bottomPanelHeight).toBe(620)
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
