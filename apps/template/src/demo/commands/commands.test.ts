import { describe, expect, it } from 'vitest'
import { commandList, commandRegistry } from './registry'
import { demoCommands } from './commands'
import { menuDefinitions, overflowMenu } from './menus'

describe('composed command registry', () => {
  it('keeps every demo command id unique', () => {
    expect(new Set(demoCommands.map((command) => command.id)).size).toBe(demoCommands.length)
  })

  it('registers every command referenced by a menu', () => {
    const referenced = [...menuDefinitions.flatMap((menu) => menu.entries), ...overflowMenu]
      .map((entry) => entry.commandId)
      .filter((id): id is string => Boolean(id))

    for (const id of referenced) {
      expect(commandList.some((command) => command.id === id)).toBe(true)
    }
  })

  it('runs commands from both the preset defaults and the demo layer', () => {
    expect(commandRegistry.run('view.toggleActivityBar')).toBe(true)
    expect(commandRegistry.run('app.settings')).toBe(true)
  })
})
