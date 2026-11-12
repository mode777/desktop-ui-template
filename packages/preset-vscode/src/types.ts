import type { ComponentType } from 'react'

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
  /** Optional counter badge rendered next to a panel tab. */
  badge?: number | string
}

export interface WorkbenchViewRegistry {
  primary: Record<string, ViewDefinition>
  secondary: Record<string, ViewDefinition>
  panel: Record<string, ViewDefinition>
}

/** Minimal contract a region needs to dispatch an action by id. */
export interface CommandRunner {
  run(id: string): boolean
}

export interface CommandListItem {
  id: string
  title: string
  category: string
  keybinding?: string
  run: () => void
}

/** Command contract used by quick open: list what can run and run it. */
export interface CommandRegistry extends CommandRunner {
  list(): CommandListItem[]
}

export interface FileIconResolver {
  icon(path: string): string
  iconClass?(path: string): string
}

export interface QuickOpenFile {
  name: string
  path: string
  language?: string
}

export interface QuickOpenProvider {
  files: QuickOpenFile[]
  openFile(path: string): void
}

export interface WorkbenchBranding {
  /** Brand label shown in the title bar and used for its accessible name. */
  title: string
  /** Codicon name for the app mark. */
  icon?: string
  onActivate?: () => void
}

export interface MenuEntryDefinition {
  label?: string
  commandId?: string
  keybinding?: string
  separator?: boolean
}

export interface MenuDefinition {
  id: string
  label: string
  entries: MenuEntryDefinition[]
}

export interface ActivityItem {
  id: string
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
    views: string[]
  }
  secondarySideBar: {
    enabled: boolean
    initialWidth: number
    minWidth: number
    maxWidth: number
    views: string[]
  }
  bottomPanel: {
    enabled: boolean
    initialHeight: number
    minHeight: number
    maxHeight: number
    views: string[]
  }
  statusBar: {
    enabled: boolean
  }
}
