import { createCommandRegistry, defaultCommands } from '@workbench-kit/preset-vscode'
import type { WorkbenchCommand } from '@workbench-kit/preset-vscode'
import { demoCommands } from './commands'

/**
 * The template's command registry: the preset's generic workbench commands plus
 * the app's demo commands. Views, menus, the status bar and the hotkey hook all
 * dispatch through this one registry.
 */
export const commandList: WorkbenchCommand[] = [...defaultCommands, ...demoCommands]

export const commandRegistry = createCommandRegistry(commandList)

export function runWorkbenchCommand(id: string): boolean {
  return commandRegistry.run(id)
}
