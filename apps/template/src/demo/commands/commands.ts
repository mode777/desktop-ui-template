import { getFile, workspaceFiles } from '../data/workspace'
import { README_TAB, WELCOME_TAB } from '../data/initial-session'
import { useWorkbenchStore } from '@workbench-kit/preset-vscode'
import type { NotificationKind, WorkbenchCommand, WorkbenchTab } from '@workbench-kit/preset-vscode'

const state = () => useWorkbenchStore.getState()

export function openFileTab(path: string) {
  const file = getFile(path)
  if (!file) return

  if (path === 'README.md') {
    state().openTab(README_TAB)
    return
  }

  const tab: WorkbenchTab = {
    id: `file:${path}`,
    title: file.name,
    kind: 'file',
    path,
    language: file.language,
  }
  state().openTab(tab)
}

const notify = (message: string, kind: NotificationKind = 'info') => state().notify(message, kind)

/**
 * Template-specific commands. Anything that names a demo view, mock file, menu
 * or brand lives here and is composed into the registry the application
 * supplies to the workbench.
 */
export const demoCommands: WorkbenchCommand[] = [
  {
    id: 'edit.undo',
    title: 'Undo',
    category: 'Edit',
    keybinding: 'Ctrl+Z',
    run: () => notify('Undo is not wired up in this UI-only template'),
  },
  {
    id: 'edit.redo',
    title: 'Redo',
    category: 'Edit',
    keybinding: 'Ctrl+Y',
    run: () => notify('Redo is not wired up in this UI-only template'),
  },
  {
    id: 'edit.find',
    title: 'Find',
    category: 'Edit',
    keybinding: 'Ctrl+F',
    run: () => state().showPanelView('problems'),
  },
  {
    id: 'edit.replace',
    title: 'Replace',
    category: 'Edit',
    keybinding: 'Ctrl+H',
    run: () => state().showPrimaryView('search'),
  },
  {
    id: 'selection.selectAll',
    title: 'Select All',
    category: 'Selection',
    keybinding: 'Ctrl+A',
    run: () => notify('Text selection belongs to your editor implementation'),
  },
  {
    id: 'selection.expand',
    title: 'Expand Selection',
    category: 'Selection',
    keybinding: 'Shift+Alt+Right',
    run: () => notify('Text selection belongs to your editor implementation'),
  },
  {
    id: 'selection.shrink',
    title: 'Shrink Selection',
    category: 'Selection',
    keybinding: 'Shift+Alt+Left',
    run: () => notify('Text selection belongs to your editor implementation'),
  },
  {
    id: 'view.explorer',
    title: 'Explorer',
    category: 'View',
    keybinding: 'Ctrl+Shift+E',
    run: () => state().showPrimaryView('explorer'),
  },
  {
    id: 'view.search',
    title: 'Search',
    category: 'View',
    keybinding: 'Ctrl+Shift+F',
    run: () => state().showPrimaryView('search'),
  },
  {
    id: 'view.sourceControl',
    title: 'Source Control',
    category: 'View',
    keybinding: 'Ctrl+Shift+G',
    run: () => state().showPrimaryView('source-control'),
  },
  {
    id: 'view.run',
    title: 'Run and Debug',
    category: 'View',
    keybinding: 'Ctrl+Shift+D',
    run: () => state().showPrimaryView('run'),
  },
  {
    id: 'view.extensions',
    title: 'Extensions',
    category: 'View',
    keybinding: 'Ctrl+Shift+X',
    run: () => state().showPrimaryView('extensions'),
  },
  {
    id: 'view.chat',
    title: 'Chat',
    category: 'View',
    keybinding: 'Ctrl+Alt+I',
    run: () => state().showSecondaryView('chat'),
  },
  {
    id: 'view.problems',
    title: 'Problems',
    category: 'View',
    keybinding: 'Ctrl+Shift+M',
    run: () => state().showPanelView('problems'),
  },
  {
    id: 'view.output',
    title: 'Output',
    category: 'View',
    keybinding: 'Ctrl+Shift+U',
    run: () => state().showPanelView('output'),
  },
  {
    id: 'view.terminal',
    title: 'Terminal',
    category: 'View',
    keybinding: 'Ctrl+`',
    run: () => state().showPanelView('terminal'),
  },
  {
    id: 'go.welcome',
    title: 'Welcome',
    category: 'Go',
    run: () => state().openTab(WELCOME_TAB),
  },
  {
    id: 'go.readme',
    title: 'Template Guide',
    category: 'Go',
    keybinding: 'Ctrl+Shift+H',
    run: () => state().openTab(README_TAB),
  },
  {
    id: 'go.back',
    title: 'Go Back',
    category: 'Go',
    keybinding: 'Alt+Left',
    run: () => notify('Navigation history is not implemented in the template'),
  },
  {
    id: 'go.forward',
    title: 'Go Forward',
    category: 'Go',
    keybinding: 'Alt+Right',
    run: () => notify('Navigation history is not implemented in the template'),
  },
  {
    id: 'run.start',
    title: 'Start Debugging',
    category: 'Run',
    keybinding: 'F5',
    run: () => {
      state().showPanelView('output')
      state().appendOutput('[debug] Starting mock debug session…')
      state().appendOutput('[debug] Attached to vscode-workbench')
      notify('Mock debug session started', 'success')
    },
  },
  {
    id: 'run.startNoDebug',
    title: 'Run Without Debugging',
    category: 'Run',
    keybinding: 'Ctrl+F5',
    run: () => {
      state().showPanelView('output')
      state().appendOutput('[run] npm run dev -- --host')
      state().appendOutput('[run] Local: http://localhost:5173/')
      notify('Mock app started', 'success')
    },
  },
  {
    id: 'run.stop',
    title: 'Stop',
    category: 'Run',
    keybinding: 'Shift+F5',
    run: () => {
      state().appendOutput('[debug] Session stopped')
      notify('Mock debug session stopped')
    },
  },
  {
    id: 'run.toggleTerminal',
    title: 'Toggle Terminal',
    category: 'Run',
    keybinding: 'Ctrl+`',
    run: () => {
      const current = state()
      if (current.bottomPanelVisible && current.activePanelView === 'terminal') {
        current.toggleBottomPanel()
      } else {
        current.showPanelView('terminal')
      }
    },
  },
  {
    id: 'help.welcome',
    title: 'Show Welcome',
    category: 'Help',
    run: () => state().openTab(WELCOME_TAB),
  },
  {
    id: 'help.github',
    title: 'GitHub Repository',
    category: 'Help',
    run: () =>
      window.open('https://github.com/mode777/vscode-workbench', '_blank', 'noopener,noreferrer'),
  },
  {
    id: 'help.elements',
    title: 'vscode-elements Documentation',
    category: 'Help',
    run: () => window.open('https://vscode-elements.github.io', '_blank', 'noopener,noreferrer'),
  },
  {
    id: 'help.about',
    title: 'About Desktop UI Template',
    category: 'Help',
    run: () => notify('Desktop UI Template 0.1.0 — React, Vite and vscode-elements', 'info'),
  },
  {
    id: 'app.accounts',
    title: 'Accounts',
    category: 'App',
    run: () => notify('Accounts is a placeholder for your identity provider'),
  },
  {
    id: 'app.settings',
    title: 'Settings',
    category: 'App',
    keybinding: 'Ctrl+,',
    run: () => notify('Settings view is a placeholder — add your own provider'),
  },
  {
    id: 'explorer.newFile',
    title: 'New File',
    category: 'Explorer',
    run: () => state().newUntitledTab(),
  },
  {
    id: 'explorer.newFolder',
    title: 'New Folder',
    category: 'Explorer',
    run: () => notify('New Folder is a mock action'),
  },
  {
    id: 'explorer.refresh',
    title: 'Refresh Explorer',
    category: 'Explorer',
    run: () => notify(`Explorer refreshed — ${workspaceFiles.length} mock files`),
  },
  {
    id: 'explorer.collapseAll',
    title: 'Collapse Folders',
    category: 'Explorer',
    run: () => notify('Collapse all is handled by the tree component'),
  },
  {
    id: 'search.refresh',
    title: 'Refresh Search',
    category: 'Search',
    run: () => notify('Search index refreshed'),
  },
  {
    id: 'search.clear',
    title: 'Clear Search',
    category: 'Search',
    run: () => notify('Clear the search field to reset results'),
  },
  {
    id: 'scm.refresh',
    title: 'Refresh Source Control',
    category: 'Source Control',
    run: () => notify('Source control refreshed'),
  },
  {
    id: 'scm.commit',
    title: 'Commit',
    category: 'Source Control',
    keybinding: 'Ctrl+Enter',
    run: () => notify('Committed 3 changes (mock)', 'success'),
  },
  {
    id: 'extensions.refresh',
    title: 'Refresh Extensions',
    category: 'Extensions',
    run: () => notify('Marketplace request simulated'),
  },
  {
    id: 'extensions.filter',
    title: 'Filter Extensions',
    category: 'Extensions',
    run: () => notify('Use the search field to filter extensions'),
  },
  {
    id: 'run.configure',
    title: 'Open launch.json',
    category: 'Run',
    run: () => notify('launch.json is not part of this template'),
  },
  {
    id: 'chat.newSession',
    title: 'New Chat Session',
    category: 'Chat',
    run: () => notify('New chat session created (mock)', 'success'),
  },
  {
    id: 'chat.history',
    title: 'Chat History',
    category: 'Chat',
    run: () => notify('Chat history is a mock surface'),
  },
  {
    id: 'chat.filter',
    title: 'Filter Sessions',
    category: 'Chat',
    run: () => notify('Session filter is a mock action'),
  },
]
