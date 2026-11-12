import type { ViewDefinition } from '@workbench-kit/preset-vscode'
import { ChatView } from './ChatView'
import { ExplorerView } from './ExplorerView'
import { ExtensionsView } from './ExtensionsView'
import { OutputView } from './OutputView'
import { ProblemsView } from './ProblemsView'
import { RunView } from './RunView'
import { SearchView } from './SearchView'
import { SourceControlView } from './SourceControlView'
import { TerminalView } from './TerminalView'

export type PrimaryViewId = 'explorer' | 'search' | 'source-control' | 'run' | 'extensions'

export type SecondaryViewId = 'chat'

export type PanelViewId = 'problems' | 'output' | 'terminal'

export const primaryViews: Record<PrimaryViewId, ViewDefinition> = {
  explorer: {
    id: 'explorer',
    title: 'Explorer',
    icon: 'files',
    component: ExplorerView,
    actions: [
      { icon: 'new-file', label: 'New File', commandId: 'explorer.newFile' },
      { icon: 'new-folder', label: 'New Folder', commandId: 'explorer.newFolder' },
      { icon: 'refresh', label: 'Refresh Explorer', commandId: 'explorer.refresh' },
      { icon: 'collapse-all', label: 'Collapse Folders', commandId: 'explorer.collapseAll' },
    ],
  },
  search: {
    id: 'search',
    title: 'Search',
    icon: 'search',
    component: SearchView,
    actions: [
      { icon: 'refresh', label: 'Refresh Search', commandId: 'search.refresh' },
      { icon: 'clear-all', label: 'Clear Search', commandId: 'search.clear' },
    ],
  },
  'source-control': {
    id: 'source-control',
    title: 'Source Control',
    icon: 'source-control',
    component: SourceControlView,
    actions: [{ icon: 'refresh', label: 'Refresh Source Control', commandId: 'scm.refresh' }],
  },
  run: {
    id: 'run',
    title: 'Run and Debug',
    icon: 'debug-alt',
    component: RunView,
    actions: [{ icon: 'settings-gear', label: 'Open launch.json', commandId: 'run.configure' }],
  },
  extensions: {
    id: 'extensions',
    title: 'Extensions',
    icon: 'extensions',
    component: ExtensionsView,
    actions: [
      { icon: 'refresh', label: 'Refresh Extensions', commandId: 'extensions.refresh' },
      { icon: 'filter', label: 'Filter Extensions', commandId: 'extensions.filter' },
    ],
  },
}

export const secondaryViews: Record<SecondaryViewId, ViewDefinition> = {
  chat: {
    id: 'chat',
    title: 'Chat',
    icon: 'comment-discussion',
    component: ChatView,
    actions: [
      { icon: 'new-session', label: 'New Chat Session', commandId: 'chat.newSession' },
      { icon: 'history', label: 'Chat History', commandId: 'chat.history' },
      { icon: 'filter', label: 'Filter Sessions', commandId: 'chat.filter' },
    ],
  },
}

export const panelViews: Record<PanelViewId, ViewDefinition> = {
  problems: {
    id: 'problems',
    title: 'Problems',
    icon: 'error',
    component: ProblemsView,
    badge: 2,
  },
  output: {
    id: 'output',
    title: 'Output',
    icon: 'output',
    component: OutputView,
  },
  terminal: {
    id: 'terminal',
    title: 'Terminal',
    icon: 'terminal',
    component: TerminalView,
    badge: 1,
  },
}
