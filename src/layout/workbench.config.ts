import type { WorkbenchConfig } from './types'

/**
 * The single source of truth for the workbench shell.
 *
 * Try removing a region by flipping its `enabled` flag, or rearrange the
 * activity bar / views arrays. The layout adapts and the remaining regions
 * reclaim the space. Runtime visibility is stored separately, so you can also
 * toggle a region while the app is running (View menu, shortcuts, or title bar
 * layout controls).
 */
export const workbenchConfig: WorkbenchConfig = {
  titleBar: {
    enabled: true,
    menuBar: true,
    commandCenter: true,
    layoutControls: true,
    windowControls: true,
  },
  activityBar: {
    enabled: true,
    items: [
      { id: 'explorer', title: 'Explorer', icon: 'files' },
      { id: 'search', title: 'Search', icon: 'search' },
      { id: 'source-control', title: 'Source Control', icon: 'source-control', badge: 3 },
      { id: 'run', title: 'Run and Debug', icon: 'debug-alt' },
      { id: 'extensions', title: 'Extensions', icon: 'extensions' },
    ],
    bottomItems: [
      { id: 'accounts', title: 'Accounts', icon: 'account', commandId: 'app.accounts' },
      { id: 'settings', title: 'Manage', icon: 'settings-gear', commandId: 'app.settings' },
    ],
  },
  primarySideBar: {
    enabled: true,
    initialWidth: 300,
    minWidth: 180,
    maxWidth: 640,
    views: ['explorer', 'search', 'source-control', 'run', 'extensions'],
  },
  secondarySideBar: {
    enabled: true,
    initialWidth: 330,
    minWidth: 240,
    maxWidth: 640,
    views: ['chat'],
  },
  bottomPanel: {
    enabled: true,
    initialHeight: 230,
    minHeight: 100,
    maxHeight: 620,
    views: ['problems', 'output', 'terminal'],
  },
  statusBar: {
    enabled: true,
  },
}
