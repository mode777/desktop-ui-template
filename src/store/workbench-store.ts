import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { workbenchConfig } from '../layout/workbench.config'
import type { PrimaryViewId, SecondaryViewId, PanelViewId, Theme } from '../layout/types'
import type {
  NotificationKind,
  QuickOpenMode,
  WorkbenchData,
  WorkbenchNotification,
  WorkbenchTab,
} from './workbench-types'

const config = workbenchConfig

export const WELCOME_TAB: WorkbenchTab = {
  id: 'welcome',
  title: 'Welcome',
  kind: 'welcome',
}

export const README_TAB: WorkbenchTab = {
  id: 'readme',
  title: 'README.md',
  kind: 'readme',
  path: 'README.md',
  language: 'markdown',
}

const CONFIG_TAB: WorkbenchTab = {
  id: 'file:src/layout/workbench.config.ts',
  title: 'workbench.config.ts',
  kind: 'file',
  path: 'src/layout/workbench.config.ts',
  language: 'typescript',
}

export function createInitialTabs(): WorkbenchTab[] {
  return [WELCOME_TAB, CONFIG_TAB, README_TAB]
}

export function createLayoutDefaults() {
  return {
    primarySideBarVisible: true,
    secondarySideBarVisible: true,
    bottomPanelVisible: true,
    activityBarVisible: true,
    statusBarVisible: true,
    titleBarVisible: true,
    panelMaximized: false,
    primarySideBarWidth: config.primarySideBar.initialWidth,
    secondarySideBarWidth: config.secondarySideBar.initialWidth,
    bottomPanelHeight: config.bottomPanel.initialHeight,
    activePrimaryView: 'explorer' as PrimaryViewId,
    activeSecondaryView: 'chat' as SecondaryViewId,
    activePanelView: 'problems' as PanelViewId,
  }
}

export function createInitialData(): WorkbenchData {
  return {
    theme: 'dark',
    ...createLayoutDefaults(),
    tabs: createInitialTabs(),
    activeTabId: WELCOME_TAB.id,
    closedTabs: [],
    quickOpenOpen: false,
    quickOpenMode: 'files',
    outputLines: [
      '[info] Desktop UI Template 0.1.0',
      '[info] Workbench shell initialized',
      '[info] vscode-elements registered',
      '[info] Waiting for a task…',
    ],
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
  togglePrimarySideBar: (view?: PrimaryViewId) => void
  showPrimaryView: (view: PrimaryViewId) => void
  setPrimarySideBarWidth: (width: number) => void
  toggleSecondarySideBar: (view?: SecondaryViewId) => void
  showSecondaryView: (view: SecondaryViewId) => void
  setSecondarySideBarWidth: (width: number) => void
  toggleBottomPanel: () => void
  showPanelView: (view: PanelViewId) => void
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

let notificationSequence = 0

export const useWorkbenchStore = create<WorkbenchState>()(
  persist(
    (set, get) => ({
      ...createInitialData(),

      openTab: (tab) =>
        set((state) => ({
          tabs: state.tabs.some((entry) => entry.id === tab.id) ? state.tabs : [...state.tabs, tab],
          activeTabId: tab.id,
        })),

      activateTab: (id) => {
        if (get().tabs.some((tab) => tab.id === id)) {
          set({ activeTabId: id })
        }
      },

      closeTab: (id) =>
        set((state) => {
          const index = state.tabs.findIndex((tab) => tab.id === id)
          if (index === -1) return state

          const closed = state.tabs[index]
          const tabs = state.tabs.filter((tab) => tab.id !== id)
          const nextActive =
            state.activeTabId === id
              ? ((tabs[index] ?? tabs[index - 1] ?? null)?.id ?? null)
              : state.activeTabId

          return {
            tabs,
            activeTabId: nextActive,
            closedTabs: closed ? [closed, ...state.closedTabs].slice(0, 20) : state.closedTabs,
          }
        }),

      closeOtherTabs: (id) =>
        set((state) => {
          const kept = state.tabs.filter((tab) => tab.id === id)
          const closed = state.tabs.filter((tab) => tab.id !== id)
          return {
            tabs: kept,
            activeTabId: kept[0]?.id ?? null,
            closedTabs: [...closed.reverse(), ...state.closedTabs].slice(0, 20),
          }
        }),

      closeAllTabs: () =>
        set((state) => ({
          tabs: [],
          activeTabId: null,
          closedTabs: [...state.tabs].reverse().concat(state.closedTabs).slice(0, 20),
        })),

      reopenClosedTab: () => {
        const [tab, ...rest] = get().closedTabs
        if (!tab) return
        set((state) => ({
          closedTabs: rest,
          tabs: state.tabs.some((entry) => entry.id === tab.id) ? state.tabs : [...state.tabs, tab],
          activeTabId: tab.id,
        }))
      },

      reorderTab: (sourceId, targetId) =>
        set((state) => {
          if (sourceId === targetId) return state
          const sourceIndex = state.tabs.findIndex((tab) => tab.id === sourceId)
          const targetIndex = state.tabs.findIndex((tab) => tab.id === targetId)
          if (sourceIndex === -1 || targetIndex === -1) return state

          const tabs = [...state.tabs]
          const [moved] = tabs.splice(sourceIndex, 1)
          tabs.splice(targetIndex, 0, moved)
          return { tabs }
        }),

      activateNextTab: (direction) =>
        set((state) => {
          if (state.tabs.length === 0) return state
          const current = state.tabs.findIndex((tab) => tab.id === state.activeTabId)
          const next = (current + direction + state.tabs.length) % state.tabs.length
          return { activeTabId: state.tabs[next].id }
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

      setPrimarySideBarWidth: (width) =>
        set({
          primarySideBarWidth: clamp(
            width,
            config.primarySideBar.minWidth,
            config.primarySideBar.maxWidth,
          ),
        }),

      toggleSecondarySideBar: (view) =>
        set((state) => ({
          secondarySideBarVisible: view
            ? !(state.secondarySideBarVisible && state.activeSecondaryView === view)
            : !state.secondarySideBarVisible,
          activeSecondaryView: view ?? state.activeSecondaryView,
        })),

      showSecondaryView: (view) =>
        set({ activeSecondaryView: view, secondarySideBarVisible: true }),

      setSecondarySideBarWidth: (width) =>
        set({
          secondarySideBarWidth: clamp(
            width,
            config.secondarySideBar.minWidth,
            config.secondarySideBar.maxWidth,
          ),
        }),

      toggleBottomPanel: () =>
        set((state) => ({
          bottomPanelVisible: !state.bottomPanelVisible,
          panelMaximized: state.bottomPanelVisible ? false : state.panelMaximized,
        })),

      showPanelView: (view) =>
        set({ activePanelView: view, bottomPanelVisible: true, panelMaximized: false }),

      setBottomPanelHeight: (height) =>
        set({
          bottomPanelHeight: clamp(
            height,
            config.bottomPanel.minHeight,
            config.bottomPanel.maxHeight,
          ),
        }),

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
      name: 'desktop-ui-template:v1',
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
