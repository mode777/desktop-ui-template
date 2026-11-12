import { ActivityBar as ActivityBarPrimitive } from '@workbench-kit/react'
import { useWorkbenchStore } from '../store/workbench-store'
import type { CommandRunner, WorkbenchConfig } from '../types'

interface ActivityBarProps {
  config: WorkbenchConfig
  run: CommandRunner
}

export function ActivityBar({ config, run }: ActivityBarProps) {
  const activeView = useWorkbenchStore((state) => state.activePrimaryView)
  const visible = useWorkbenchStore((state) => state.primarySideBarVisible)
  const togglePrimary = useWorkbenchStore((state) => state.togglePrimarySideBar)
  const commandByActionId = new Map(
    config.activityBar.bottomItems.map((item) => [item.id, item.commandId]),
  )

  return (
    <ActivityBarPrimitive
      items={config.activityBar.items}
      activeId={visible ? activeView : null}
      bottomItems={config.activityBar.bottomItems}
      onActivate={togglePrimary}
      onAction={(id) => {
        const commandId = commandByActionId.get(id)
        if (commandId) run.run(commandId)
      }}
    />
  )
}
