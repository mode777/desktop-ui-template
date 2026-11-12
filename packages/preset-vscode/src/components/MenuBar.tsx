import { MenuBar as MenuBarPrimitive } from '@workbench-kit/react'
import type { CommandRunner, MenuDefinition, MenuEntryDefinition } from '../types'

interface MenuBarProps {
  menus: MenuDefinition[]
  /** Entries shown by the overflow button; the button is hidden when omitted. */
  overflowMenu?: MenuEntryDefinition[]
  run: CommandRunner
}

export function MenuBar({ menus, overflowMenu, run }: MenuBarProps) {
  return <MenuBarPrimitive menus={menus} overflowItems={overflowMenu} onCommand={run.run} />
}
