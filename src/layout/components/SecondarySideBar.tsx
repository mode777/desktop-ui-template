import { runWorkbenchCommand } from '../../commands/commands'
import { IconButton } from '../../components/IconButton'
import { useWorkbenchStore } from '../../store/workbench-store'
import { secondaryViews } from '../../views/registry'
import type { SecondaryViewId, WorkbenchConfig } from '../types'

interface SecondarySideBarProps {
  config: WorkbenchConfig
}

export function SecondarySideBar({ config }: SecondarySideBarProps) {
  const activeView = useWorkbenchStore((state) => state.activeSecondaryView) as SecondaryViewId
  const fallbackView = config.secondarySideBar.views[0] ?? 'chat'
  const definition = secondaryViews[activeView] ?? secondaryViews[fallbackView]
  const View = definition.component
  const toggle = useWorkbenchStore((state) => state.toggleSecondarySideBar)

  return (
    <aside className="sidebar secondary-sidebar" aria-label="Secondary side bar">
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
            label="Close Secondary Side Bar"
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
