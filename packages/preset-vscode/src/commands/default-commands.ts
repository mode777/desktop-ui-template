import { useWorkbenchStore } from '../store/workbench-store'
import type { NotificationKind } from '../store/workbench-types'

export interface WorkbenchCommand {
  id: string
  title: string
  category: string
  keybinding?: string
  run: () => void
}

export interface WorkbenchCommandRegistry {
  list(): WorkbenchCommand[]
  run(id: string): boolean
}

const state = () => useWorkbenchStore.getState()

const notify = (message: string, kind: NotificationKind = 'info') => state().notify(message, kind)

/**
 * Generic workbench commands: tabs, quick open, region toggles and the theme.
 * They only depend on the workbench store, so they ship with the preset and
 * never reference demo views, files or brands.
 */
export const defaultCommands: WorkbenchCommand[] = [
  {
    id: 'file.new',
    title: 'New File',
    category: 'File',
    keybinding: 'Ctrl+N',
    run: () => {
      state().newUntitledTab()
    },
  },
  {
    id: 'file.open',
    title: 'Open File…',
    category: 'File',
    keybinding: 'Ctrl+O',
    run: () => state().setQuickOpen(true, 'files'),
  },
  {
    id: 'file.save',
    title: 'Save',
    category: 'File',
    keybinding: 'Ctrl+S',
    run: () => {
      const current = state()
      const tab = current.tabs.find((entry) => entry.id === current.activeTabId)
      if (!tab) return
      current.markTabClean(tab.id)
      notify(`Saved ${tab.title}`)
    },
  },
  {
    id: 'file.saveAll',
    title: 'Save All',
    category: 'File',
    keybinding: 'Ctrl+K S',
    run: () => {
      const current = state()
      current.tabs.forEach((tab) => current.markTabClean(tab.id))
      notify('Saved all editors')
    },
  },
  {
    id: 'file.close',
    title: 'Close Editor',
    category: 'File',
    keybinding: 'Ctrl+W',
    run: () => {
      const current = state()
      if (current.activeTabId) current.closeTab(current.activeTabId)
    },
  },
  {
    id: 'file.closeAll',
    title: 'Close All Editors',
    category: 'File',
    keybinding: 'Ctrl+Shift+W',
    run: () => state().closeAllTabs(),
  },
  {
    id: 'file.reopen',
    title: 'Reopen Closed Editor',
    category: 'File',
    keybinding: 'Ctrl+Shift+T',
    run: () => state().reopenClosedTab(),
  },
  {
    id: 'view.commandPalette',
    title: 'Command Palette…',
    category: 'View',
    keybinding: 'Ctrl+Shift+P',
    run: () => state().setQuickOpen(true, 'commands'),
  },
  {
    id: 'view.quickOpen',
    title: 'Go to File…',
    category: 'View',
    keybinding: 'Ctrl+P',
    run: () => state().setQuickOpen(true, 'files'),
  },
  {
    id: 'view.togglePrimary',
    title: 'Toggle Primary Side Bar',
    category: 'View',
    keybinding: 'Ctrl+B',
    run: () => state().togglePrimarySideBar(),
  },
  {
    id: 'view.toggleSecondary',
    title: 'Toggle Secondary Side Bar',
    category: 'View',
    keybinding: 'Ctrl+Alt+B',
    run: () => state().toggleSecondarySideBar(),
  },
  {
    id: 'view.togglePanel',
    title: 'Toggle Panel',
    category: 'View',
    keybinding: 'Ctrl+J',
    run: () => state().toggleBottomPanel(),
  },
  {
    id: 'view.togglePanelMaximized',
    title: 'Toggle Maximized Panel',
    category: 'View',
    run: () => state().togglePanelMaximized(),
  },
  {
    id: 'view.toggleActivityBar',
    title: 'Toggle Activity Bar',
    category: 'View',
    run: () => state().toggleActivityBar(),
  },
  {
    id: 'view.toggleStatusBar',
    title: 'Toggle Status Bar',
    category: 'View',
    run: () => state().toggleStatusBar(),
  },
  {
    id: 'view.toggleTitleBar',
    title: 'Toggle Title Bar',
    category: 'View',
    run: () => state().toggleTitleBar(),
  },
  {
    id: 'view.toggleTheme',
    title: 'Toggle Color Theme',
    category: 'View',
    run: () => state().toggleTheme(),
  },
  {
    id: 'view.resetLayout',
    title: 'Reset Workbench Layout',
    category: 'View',
    run: () => {
      state().resetLayout()
      notify('Workbench layout reset')
    },
  },
  {
    id: 'tab.close',
    title: 'Close',
    category: 'Tab',
    run: () => {
      const current = state()
      if (current.activeTabId) current.closeTab(current.activeTabId)
    },
  },
  {
    id: 'tab.closeOthers',
    title: 'Close Others',
    category: 'Tab',
    run: () => {
      const current = state()
      if (current.activeTabId) current.closeOtherTabs(current.activeTabId)
    },
  },
  {
    id: 'tab.closeAll',
    title: 'Close All',
    category: 'Tab',
    run: () => state().closeAllTabs(),
  },
]

export function createCommandRegistry(commands: WorkbenchCommand[]): WorkbenchCommandRegistry {
  return {
    list: () => commands,
    run: (id) => {
      const command = commands.find((entry) => entry.id === id)
      if (!command) return false
      command.run()
      return true
    },
  }
}
