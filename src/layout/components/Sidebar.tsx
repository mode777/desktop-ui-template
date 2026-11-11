import { runWorkbenchCommand } from '../../commands/commands'
import { IconButton } from '../../components/IconButton'
import { useWorkbenchStore } from '../../store/workbench-store'
import type { PrimaryViewId, WorkbenchConfig } from '../types'
import { primaryViews } from '../../views/registry'

interface SidebarProps {
  config: WorkbenchConfig
}

export function Sidebar({ config }: SidebarProps) {
  const activeView = useWorkbenchStore((state) => state.activePrimaryView) as PrimaryViewId
  const fallbackView = config.primarySideBar.views[0] ?? 'explorer'
  const definition = primaryViews[activeView] ?? primaryViews[fallbackView]
  const View = definition.component
  const toggle = useWorkbenchStore((state) => state.togglePrimarySideBar)

  return (
    <aside className="sidebar" aria-label="Primary side bar">
      <div className="view-header">
        <div className="view-header-title">
          <vscode-icon name={definition.icon} size={14} />
          <span>{definition.title}</span>
        </div>
        <div className="view-header-actions">
          {definition.actions?.map((action) => (
            <IconButton
              key={action.commandId}
              icon={action.icon}
              label={action.label}
              variant="toolbar"
              onClick={() => runWorkbenchCommand(action.commandId)}
            />
          ))}
          <IconButton
            icon="close"
            label="Close Primary Side Bar"
            variant="toolbar"
            onClick={() => toggle()}
          />
        </div>
      </div>
      <div className="view-body">
        <View />
      </div>
    </aside>
  )
}
