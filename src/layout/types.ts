import type { ComponentType } from 'react'

export type PrimaryViewId = 'explorer' | 'search' | 'source-control' | 'run' | 'extensions'

export type SecondaryViewId = 'chat'

export type PanelViewId = 'problems' | 'output' | 'terminal'

export type Theme = 'dark' | 'light'

export interface ViewAction {
  /** Codicon name, e.g. "new-file". */
  icon: string
  label: string
  commandId: string
}

export interface ViewDefinition {
  id: string
  title: string
  icon: string
  component: ComponentType
  actions?: ViewAction[]
}

export interface ActivityItem {
  id: PrimaryViewId
  title: string
  icon: string
  badge?: number
}

export interface ActivityAction {
  id: string
  title: string
  icon: string
  commandId: string
}

export interface WorkbenchConfig {
  titleBar: {
    /** Remove the entire title bar by setting this to false. */
    enabled: boolean
    menuBar: boolean
    commandCenter: boolean
    layoutControls: boolean
    windowControls: boolean
  }
  activityBar: {
    enabled: boolean
    items: ActivityItem[]
    bottomItems: ActivityAction[]
  }
  primarySideBar: {
    enabled: boolean
    initialWidth: number
    minWidth: number
    maxWidth: number
    views: PrimaryViewId[]
  }
  secondarySideBar: {
    enabled: boolean
    initialWidth: number
    minWidth: number
    maxWidth: number
    views: SecondaryViewId[]
  }
  bottomPanel: {
    enabled: boolean
    initialHeight: number
    minHeight: number
    maxHeight: number
    views: PanelViewId[]
  }
  statusBar: {
    enabled: boolean
  }
}
