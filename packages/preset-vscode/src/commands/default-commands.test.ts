import { beforeEach, describe, expect, it } from 'vitest'
import { createCommandRegistry, defaultCommands } from './default-commands'
import { useWorkbenchStore } from '../store/workbench-store'

const ids = defaultCommands.map((command) => command.id)
const registry = createCommandRegistry(defaultCommands)

beforeEach(() => {
  useWorkbenchStore.setState({
    bottomPanelVisible: true,
    primarySideBarVisible: true,
    secondarySideBarVisible: true,
    theme: 'dark',
    quickOpenOpen: false,
  })
})

describe('default workbench commands', () => {
  it('covers the generic file, view and tab commands', () => {
    expect(ids).toEqual(
      expect.arrayContaining([
        'file.new',
        'file.open',
        'file.save',
        'file.saveAll',
        'file.close',
        'file.closeAll',
        'file.reopen',
        'view.commandPalette',
        'view.quickOpen',
        'view.togglePrimary',
        'view.toggleSecondary',
        'view.togglePanel',
        'view.toggleActivityBar',
        'view.toggleStatusBar',
        'view.toggleTitleBar',
        'view.toggleTheme',
        'view.resetLayout',
        'tab.close',
        'tab.closeOthers',
        'tab.closeAll',
      ]),
    )
  })

  it('lists every command once', () => {
    expect(registry.list()).toHaveLength(defaultCommands.length)
    expect(new Set(registry.list().map((command) => command.id)).size).toBe(defaultCommands.length)
  })

  it('dispatches a registered command', () => {
    expect(registry.run('view.quickOpen')).toBe(true)
    expect(useWorkbenchStore.getState().quickOpenOpen).toBe(true)
    expect(useWorkbenchStore.getState().quickOpenMode).toBe('files')
  })

  it('reports an unknown command without running anything', () => {
    expect(registry.run('missing.command')).toBe(false)
  })

  it('toggles the primary side bar', () => {
    expect(registry.run('view.togglePrimary')).toBe(true)
    expect(useWorkbenchStore.getState().primarySideBarVisible).toBe(false)
  })
})
