import type { Theme } from '../layout/types'

export type TabKind = 'welcome' | 'file' | 'readme' | 'untitled'

export interface WorkbenchTab {
  id: string
  title: string
  kind: TabKind
  path?: string
  language?: string
  dirty?: boolean
}

export type QuickOpenMode = 'files' | 'commands'

export type NotificationKind = 'info' | 'success' | 'warning' | 'error'

export interface WorkbenchNotification {
  id: number
  message: string
  kind: NotificationKind
}

/**
 * Serializable workbench state. Everything in this interface is persisted to
 * localStorage; kept separate from actions so tests and the persist middleware
 * can reason about it independently.
 */
export interface WorkbenchData {
  theme: Theme
  primarySideBarVisible: boolean
  secondarySideBarVisible: boolean
  bottomPanelVisible: boolean
  activityBarVisible: boolean
  statusBarVisible: boolean
  titleBarVisible: boolean
  panelMaximized: boolean
  primarySideBarWidth: number
  secondarySideBarWidth: number
  bottomPanelHeight: number
  activePrimaryView: string
  activeSecondaryView: string
  activePanelView: string
  tabs: WorkbenchTab[]
  activeTabId: string | null
  closedTabs: WorkbenchTab[]
  quickOpenOpen: boolean
  quickOpenMode: QuickOpenMode
  outputLines: string[]
  notifications: WorkbenchNotification[]
}
