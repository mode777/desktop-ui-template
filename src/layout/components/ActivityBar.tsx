import { runWorkbenchCommand } from '../../commands/commands'
import { IconButton } from '../../components/IconButton'
import { useWorkbenchStore } from '../../store/workbench-store'
import type { WorkbenchConfig } from '../types'

interface ActivityBarProps {
  config: WorkbenchConfig
}

export function ActivityBar({ config }: ActivityBarProps) {
  const activeView = useWorkbenchStore((state) => state.activePrimaryView)
  const visible = useWorkbenchStore((state) => state.primarySideBarVisible)
  const togglePrimary = useWorkbenchStore((state) => state.togglePrimarySideBar)

  return (
    <nav className="activitybar" aria-label="Activity bar">
      <div className="activitybar-group">
        {config.activityBar.items.map((item) => {
          const active = visible && activeView === item.id
          return (
            <div className="activitybar-item-wrap" key={item.id}>
              {active ? <span className="activitybar-indicator" aria-hidden="true" /> : null}
              <IconButton
                icon={item.icon}
                label={item.title}
                variant="activity"
                active={active}
                badge={item.badge}
                onClick={() => togglePrimary(item.id)}
              />
            </div>
          )
        })}
      </div>

      <div className="activitybar-group activitybar-group--bottom">
        {config.activityBar.bottomItems.map((item) => (
          <IconButton
            key={item.id}
            icon={item.icon}
            label={item.title}
            variant="activity"
            onClick={() => runWorkbenchCommand(item.commandId)}
          />
        ))}
      </div>
    </nav>
  )
}
