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

export const menuDefinitions: MenuDefinition[] = [
  {
    id: 'file',
    label: 'File',
    entries: [
      { label: 'New File', commandId: 'file.new', keybinding: 'Ctrl+N' },
      { label: 'Open File…', commandId: 'file.open', keybinding: 'Ctrl+O' },
      { separator: true },
      { label: 'Save', commandId: 'file.save', keybinding: 'Ctrl+S' },
      { label: 'Save All', commandId: 'file.saveAll', keybinding: 'Ctrl+K S' },
      { separator: true },
      { label: 'Close Editor', commandId: 'file.close', keybinding: 'Ctrl+W' },
      { label: 'Close All Editors', commandId: 'file.closeAll', keybinding: 'Ctrl+Shift+W' },
      { label: 'Reopen Closed Editor', commandId: 'file.reopen', keybinding: 'Ctrl+Shift+T' },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    entries: [
      { label: 'Undo', commandId: 'edit.undo', keybinding: 'Ctrl+Z' },
      { label: 'Redo', commandId: 'edit.redo', keybinding: 'Ctrl+Y' },
      { separator: true },
      { label: 'Find', commandId: 'edit.find', keybinding: 'Ctrl+F' },
      { label: 'Replace', commandId: 'edit.replace', keybinding: 'Ctrl+H' },
    ],
  },
  {
    id: 'selection',
    label: 'Selection',
    entries: [
      { label: 'Select All', commandId: 'selection.selectAll', keybinding: 'Ctrl+A' },
      { label: 'Expand Selection', commandId: 'selection.expand', keybinding: 'Shift+Alt+Right' },
      { label: 'Shrink Selection', commandId: 'selection.shrink', keybinding: 'Shift+Alt+Left' },
    ],
  },
  {
    id: 'view',
    label: 'View',
    entries: [
      { label: 'Command Palette…', commandId: 'view.commandPalette', keybinding: 'Ctrl+Shift+P' },
      { label: 'Open View: Explorer', commandId: 'view.explorer', keybinding: 'Ctrl+Shift+E' },
      { label: 'Open View: Search', commandId: 'view.search', keybinding: 'Ctrl+Shift+F' },
      {
        label: 'Open View: Source Control',
        commandId: 'view.sourceControl',
        keybinding: 'Ctrl+Shift+G',
      },
      { label: 'Open View: Extensions', commandId: 'view.extensions', keybinding: 'Ctrl+Shift+X' },
      { label: 'Open View: Chat', commandId: 'view.chat', keybinding: 'Ctrl+Alt+I' },
      { separator: true },
      { label: 'Toggle Primary Side Bar', commandId: 'view.togglePrimary', keybinding: 'Ctrl+B' },
      {
        label: 'Toggle Secondary Side Bar',
        commandId: 'view.toggleSecondary',
        keybinding: 'Ctrl+Alt+B',
      },
      { label: 'Toggle Panel', commandId: 'view.togglePanel', keybinding: 'Ctrl+J' },
      { separator: true },
      { label: 'Toggle Activity Bar', commandId: 'view.toggleActivityBar' },
      { label: 'Toggle Status Bar', commandId: 'view.toggleStatusBar' },
      { label: 'Toggle Title Bar', commandId: 'view.toggleTitleBar' },
      { label: 'Toggle Color Theme', commandId: 'view.toggleTheme' },
      { separator: true },
      { label: 'Reset Workbench Layout', commandId: 'view.resetLayout' },
    ],
  },
  {
    id: 'go',
    label: 'Go',
    entries: [
      { label: 'Back', commandId: 'go.back', keybinding: 'Alt+Left' },
      { label: 'Forward', commandId: 'go.forward', keybinding: 'Alt+Right' },
      { separator: true },
      { label: 'Welcome', commandId: 'go.welcome' },
      { label: 'Template Guide', commandId: 'go.readme', keybinding: 'Ctrl+Shift+H' },
      { separator: true },
      { label: 'Problems', commandId: 'view.problems', keybinding: 'Ctrl+Shift+M' },
      { label: 'Terminal', commandId: 'view.terminal', keybinding: 'Ctrl+`' },
    ],
  },
  {
    id: 'run',
    label: 'Run',
    entries: [
      { label: 'Start Debugging', commandId: 'run.start', keybinding: 'F5' },
      { label: 'Run Without Debugging', commandId: 'run.startNoDebug', keybinding: 'Ctrl+F5' },
      { label: 'Stop', commandId: 'run.stop', keybinding: 'Shift+F5' },
      { separator: true },
      { label: 'Open launch.json', commandId: 'run.configure' },
      { label: 'Toggle Terminal', commandId: 'run.toggleTerminal', keybinding: 'Ctrl+`' },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    entries: [
      { label: 'Welcome', commandId: 'help.welcome' },
      { label: 'GitHub Repository', commandId: 'help.github' },
      { label: 'vscode-elements Documentation', commandId: 'help.elements' },
      { separator: true },
      { label: 'About vscode-workbench', commandId: 'help.about' },
    ],
  },
]

export const overflowMenu: MenuEntryDefinition[] = [
  { label: 'Go to File…', commandId: 'view.quickOpen', keybinding: 'Ctrl+P' },
  { label: 'Command Palette…', commandId: 'view.commandPalette', keybinding: 'Ctrl+Shift+P' },
  { separator: true },
  { label: 'Toggle Primary Side Bar', commandId: 'view.togglePrimary', keybinding: 'Ctrl+B' },
  {
    label: 'Toggle Secondary Side Bar',
    commandId: 'view.toggleSecondary',
    keybinding: 'Ctrl+Alt+B',
  },
  { label: 'Toggle Panel', commandId: 'view.togglePanel', keybinding: 'Ctrl+J' },
  { separator: true },
  { label: 'Toggle Color Theme', commandId: 'view.toggleTheme' },
  { label: 'Reset Workbench Layout', commandId: 'view.resetLayout' },
]
