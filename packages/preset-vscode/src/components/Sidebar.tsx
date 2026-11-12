import { Sidebar as SidebarPrimitive, type SidebarAction } from '@workbench-kit/react'
import { useWorkbenchStore } from '../store/workbench-store'
import type { CommandRunner, ViewDefinition, WorkbenchConfig } from '../types'
import { resolveActiveView } from './view-resolution'

interface SidebarProps {
  config: WorkbenchConfig
  views: Record<string, ViewDefinition>
  run: CommandRunner
}

export function Sidebar({ config, views, run }: SidebarProps) {
  const activeView = useWorkbenchStore((state) => state.activePrimaryView)
  const definition = resolveActiveView(views, config.primarySideBar.views, activeView)
  const toggle = useWorkbenchStore((state) => state.togglePrimarySideBar)
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
      closeLabel="Close Primary Side Bar"
      label="Primary side bar"
    >
      {definition ? <definition.component /> : null}
    </SidebarPrimitive>
  )
}
