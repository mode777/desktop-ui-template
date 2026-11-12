import { Panel, type PanelTab } from '@workbench-kit/react'
import { useWorkbenchStore } from '../store/workbench-store'
import type { CommandRunner, ViewDefinition, WorkbenchConfig } from '../types'
import { configuredViews, resolveActiveView } from './view-resolution'

interface BottomPanelProps {
  config: WorkbenchConfig
  views: Record<string, ViewDefinition>
  run: CommandRunner
}

export function BottomPanel({ config, views, run }: BottomPanelProps) {
  const activeView = useWorkbenchStore((state) => state.activePanelView)
  const setActiveView = useWorkbenchStore((state) => state.showPanelView)
  const maximized = useWorkbenchStore((state) => state.panelMaximized)

  const definitions = configuredViews(views, config.bottomPanel.views)
  const active = resolveActiveView(views, config.bottomPanel.views, activeView)
  const tabs: PanelTab[] = definitions.map((definition) => {
    const Component = definition.component
    return {
      id: definition.id,
      title: definition.title,
      badge: definition.badge,
      content: <Component />,
    }
  })

  return (
    <Panel
      tabs={tabs}
      activeId={active?.id ?? null}
      onSelect={setActiveView}
      maximized={maximized}
      onToggleMaximized={() => run.run('view.togglePanelMaximized')}
      onClose={() => run.run('view.togglePanel')}
    />
  )
}
