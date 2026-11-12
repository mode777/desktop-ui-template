import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  activateTabIn,
  closeAllIn,
  closeOthersIn,
  closeTabIn,
  cycleTab,
  openTabIn,
  reopenTabIn,
  reorderTabIn,
} from '@workbench-kit/core'
import type { Theme } from '../types'
import type {
  NotificationKind,
  QuickOpenMode,
  WorkbenchData,
  WorkbenchNotification,
  WorkbenchTab,
} from './workbench-types'

export const DEFAULT_PRIMARY_SIDE_BAR_WIDTH = 300
export const DEFAULT_SECONDARY_SIDE_BAR_WIDTH = 330
export const DEFAULT_BOTTOM_PANEL_HEIGHT = 230

export function createLayoutDefaults() {
  return {
    primarySideBarVisible: true,
    secondarySideBarVisible: true,
    bottomPanelVisible: true,
    activityBarVisible: true,
    statusBarVisible: true,
    titleBarVisible: true,
    panelMaximized: false,
    primarySideBarWidth: DEFAULT_PRIMARY_SIDE_BAR_WIDTH,
    secondarySideBarWidth: DEFAULT_SECONDARY_SIDE_BAR_WIDTH,
    bottomPanelHeight: DEFAULT_BOTTOM_PANEL_HEIGHT,
    activePrimaryView: 'explorer',
    activeSecondaryView: 'chat',
    activePanelView: 'problems',
  }
}

export function createInitialData(): WorkbenchData {
  return {
    theme: 'dark',
    ...createLayoutDefaults(),
    tabs: [],
    activeTabId: null,
    closedTabs: [],
    quickOpenOpen: false,
    quickOpenMode: 'files',
    outputLines: ['[info] Workbench initialized'],
    notifications: [],
  }
}

export interface WorkbenchState extends WorkbenchData {
  // tabs
  openTab: (tab: WorkbenchTab) => void
  activateTab: (id: string) => void
  closeTab: (id: string) => void
  closeOtherTabs: (id: string) => void
  closeAllTabs: () => void
  reopenClosedTab: () => void
  reorderTab: (sourceId: string, targetId: string) => void
  activateNextTab: (direction: 1 | -1) => void
  markTabClean: (id: string) => void
  newUntitledTab: () => void

  // regions
  togglePrimarySideBar: (view?: string) => void
  showPrimaryView: (view: string) => void
  setPrimarySideBarWidth: (width: number) => void
  toggleSecondarySideBar: (view?: string) => void
  showSecondaryView: (view: string) => void
  setSecondarySideBarWidth: (width: number) => void
  toggleBottomPanel: () => void
  showPanelView: (view: string) => void
  setBottomPanelHeight: (height: number) => void
  togglePanelMaximized: () => void
  toggleActivityBar: () => void
  toggleStatusBar: () => void
  toggleTitleBar: () => void
  resetLayout: () => void

  // app
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setQuickOpen: (open: boolean, mode?: QuickOpenMode) => void
  appendOutput: (line: string) => void
  notify: (message: string, kind?: NotificationKind) => void
  dismissNotification: (id: number) => void
}

const PERSIST_KEY = 'desktop-ui-template:v1'

export interface InitialWorkbenchSession {
  tabs: WorkbenchTab[]
  activeTabId: string | null
  outputLines: string[]
}

/**
 * Applies the consumer's first-run tabs, active tab and output lines.
 *
 * It only runs when no session is stored, so a user who closed every tab keeps
 * an empty workbench after reload. Call it before the first state change of the
 * session (the composition root does this while mounting).
 */
export function seedInitialSession(session: InitialWorkbenchSession): boolean {
  if (typeof localStorage !== 'undefined' && localStorage.getItem(PERSIST_KEY) !== null) {
    return false
  }

  useWorkbenchStore.setState({
    tabs: session.tabs,
    activeTabId: session.activeTabId,
    outputLines: session.outputLines,
  })
  return true
}

let notificationSequence = 0

export const useWorkbenchStore = create<WorkbenchState>()(
  persist(
    (set, get) => ({
      ...createInitialData(),

      openTab: (tab) => set((state) => openTabIn(state, tab)),

      activateTab: (id) => {
        const state = get()
        const next = activateTabIn(state, id)
        if (next !== state) set(next)
      },

      closeTab: (id) =>
        set((state) => {
          const next = closeTabIn(state, id)
          if (next.tabs === state.tabs) return state

          return {
            tabs: next.tabs,
            activeTabId: next.activeTabId,
            closedTabs: [...next.removed, ...state.closedTabs].slice(0, 20),
          }
        }),

      closeOtherTabs: (id) =>
        set((state) => {
          const next = closeOthersIn(state, id)
          return {
            tabs: next.tabs,
            activeTabId: next.activeTabId,
            closedTabs: [...next.removed, ...state.closedTabs].slice(0, 20),
          }
        }),

      closeAllTabs: () =>
        set((state) => {
          const next = closeAllIn(state)
          return {
            tabs: next.tabs,
            activeTabId: next.activeTabId,
            closedTabs: [...next.removed, ...state.closedTabs].slice(0, 20),
          }
        }),

      reopenClosedTab: () => {
        const state = get()
        const next = reopenTabIn(state, state.closedTabs)
        if (next.closedTabs === state.closedTabs) return

        set({
          tabs: next.tabs,
          activeTabId: next.activeTabId,
          closedTabs: next.closedTabs,
        })
      },

      reorderTab: (sourceId, targetId) =>
        set((state) => {
          const next = reorderTabIn(state, sourceId, targetId)
          return next === state ? state : { tabs: next.tabs }
        }),

      activateNextTab: (direction) =>
        set((state) => {
          const next = cycleTab(state, direction)
          return next === state ? state : { activeTabId: next.activeTabId }
        }),

      markTabClean: (id) =>
        set((state) => ({
          tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, dirty: false } : tab)),
        })),

      newUntitledTab: () => {
        const state = get()
        const untitledCount = state.tabs.filter((tab) => tab.kind === 'untitled').length + 1
        const id = `untitled:${Date.now()}`
        const tab: WorkbenchTab = {
          id,
          title: `Untitled-${untitledCount}`,
          kind: 'untitled',
          language: 'plaintext',
          dirty: true,
        }
        set({ tabs: [...state.tabs, tab], activeTabId: id })
      },

      togglePrimarySideBar: (view) =>
        set((state) => {
          if (view) {
            if (state.primarySideBarVisible && state.activePrimaryView === view) {
              return { primarySideBarVisible: false }
            }
            return { primarySideBarVisible: true, activePrimaryView: view }
          }
          return { primarySideBarVisible: !state.primarySideBarVisible }
        }),

      showPrimaryView: (view) => set({ activePrimaryView: view, primarySideBarVisible: true }),

      setPrimarySideBarWidth: (width) => set({ primarySideBarWidth: width }),

      toggleSecondarySideBar: (view) =>
        set((state) => ({
          secondarySideBarVisible: view
            ? !(state.secondarySideBarVisible && state.activeSecondaryView === view)
            : !state.secondarySideBarVisible,
          activeSecondaryView: view ?? state.activeSecondaryView,
        })),

      showSecondaryView: (view) =>
        set({ activeSecondaryView: view, secondarySideBarVisible: true }),

      setSecondarySideBarWidth: (width) => set({ secondarySideBarWidth: width }),

      toggleBottomPanel: () =>
        set((state) => ({
          bottomPanelVisible: !state.bottomPanelVisible,
          panelMaximized: state.bottomPanelVisible ? false : state.panelMaximized,
        })),

      showPanelView: (view) =>
        set({ activePanelView: view, bottomPanelVisible: true, panelMaximized: false }),

      setBottomPanelHeight: (height) => set({ bottomPanelHeight: height }),

      togglePanelMaximized: () =>
        set((state) => ({ panelMaximized: !state.panelMaximized, bottomPanelVisible: true })),

      toggleActivityBar: () => set((state) => ({ activityBarVisible: !state.activityBarVisible })),
      toggleStatusBar: () => set((state) => ({ statusBarVisible: !state.statusBarVisible })),
      toggleTitleBar: () => set((state) => ({ titleBarVisible: !state.titleBarVisible })),

      resetLayout: () =>
        set({
          ...createLayoutDefaults(),
          quickOpenOpen: false,
        }),

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      setQuickOpen: (open, mode = 'files') => set({ quickOpenOpen: open, quickOpenMode: mode }),

      appendOutput: (line) =>
        set((state) => ({ outputLines: [...state.outputLines.slice(-199), line] })),

      notify: (message, kind = 'info') => {
        const id = ++notificationSequence
        const notification: WorkbenchNotification = { id, message, kind }
        set((state) => ({ notifications: [...state.notifications.slice(-3), notification] }))
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.filter((entry) => entry.id !== id),
          }))
        }, 4200)
      },

      dismissNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((entry) => entry.id !== id),
        })),
    }),
    {
      name: PERSIST_KEY,
      version: 1,
      partialize: (state) => ({
        theme: state.theme,
        primarySideBarVisible: state.primarySideBarVisible,
        secondarySideBarVisible: state.secondarySideBarVisible,
        bottomPanelVisible: state.bottomPanelVisible,
        activityBarVisible: state.activityBarVisible,
        statusBarVisible: state.statusBarVisible,
        titleBarVisible: state.titleBarVisible,
        panelMaximized: state.panelMaximized,
        primarySideBarWidth: state.primarySideBarWidth,
        secondarySideBarWidth: state.secondarySideBarWidth,
        bottomPanelHeight: state.bottomPanelHeight,
        activePrimaryView: state.activePrimaryView,
        activeSecondaryView: state.activeSecondaryView,
        activePanelView: state.activePanelView,
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        closedTabs: state.closedTabs,
      }),
    },
  ),
)
