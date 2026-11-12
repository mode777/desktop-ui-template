import { Sidebar as SidebarPrimitive, type SidebarAction } from '@workbench-kit/react'
import { useWorkbenchStore } from '../store/workbench-store'
import type { CommandRunner, ViewDefinition, WorkbenchConfig } from '../types'
import { resolveActiveView } from './view-resolution'

interface SecondarySideBarProps {
  config: WorkbenchConfig
  views: Record<string, ViewDefinition>
  run: CommandRunner
}

export function SecondarySideBar({ config, views, run }: SecondarySideBarProps) {
  const activeView = useWorkbenchStore((state) => state.activeSecondaryView)
  const definition = resolveActiveView(views, config.secondarySideBar.views, activeView)
  const toggle = useWorkbenchStore((state) => state.toggleSecondarySideBar)
  const actions: SidebarAction[] =
    definition?.actions?.map((action) => ({
      id: action.commandId,
      icon: action.icon,
      label: action.label,
    })) ?? []

  return (
    <SidebarPrimitive
      title={definition?.title}
      icon={definition?.icon}
      actions={actions}
      onAction={(id) => run.run(id)}
      onClose={() => toggle()}
      closeLabel="Close Secondary Side Bar"
      label="Secondary side bar"
      className="secondary-sidebar"
    >
      {definition ? <definition.component /> : null}
    </SidebarPrimitive>
  )
}
