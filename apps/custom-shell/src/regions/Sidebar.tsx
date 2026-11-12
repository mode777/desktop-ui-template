import { Sidebar as SidebarPrimitive } from '@workbench-kit/react'
import type { ActivityId, CustomShellTab } from '../data'

interface SidebarProps {
  activityId: ActivityId
  activeTab: CustomShellTab | null
  tabs: CustomShellTab[]
  panelVisible: boolean
  panelMaximized: boolean
  secondaryVisible: boolean
  onOpenTab: (tab: CustomShellTab) => void
  onClose: () => void
  onToggleSecondary: () => void
  onTogglePanel: () => void
  onTogglePanelMaximized: () => void
}

const titles: Record<ActivityId, { title: string; icon: string }> = {
  workspace: { title: 'Workspace', icon: 'files' },
  outline: { title: 'Outline', icon: 'list-unordered' },
  settings: { title: 'Settings', icon: 'settings-gear' },
}

export function Sidebar({
  activityId,
  activeTab,
  tabs,
  panelVisible,
  panelMaximized,
  secondaryVisible,
  onOpenTab,
  onClose,
  onToggleSecondary,
  onTogglePanel,
  onTogglePanelMaximized,
}: SidebarProps) {
  const header = titles[activityId]

  return (
    <SidebarPrimitive
      title={header.title}
      icon={header.icon}
      label="Primary side bar"
      closeLabel="Close Primary Side Bar"
      onClose={onClose}
      className="custom-shell-sidebar"
    >
      {activityId === 'workspace' ? (
        <div className="custom-shell-file-list" aria-label="Example files">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={`custom-shell-file ${tab.id === activeTab?.id ? 'is-active' : ''}`}
              onClick={() => onOpenTab(tab)}
            >
              <vscode-icon name={tab.icon} size={14} />
              <span>{tab.title}</span>
              <small>{tab.language}</small>
            </button>
          ))}
        </div>
      ) : null}

      {activityId === 'outline' ? (
        <div className="custom-shell-outline">
          <p className="custom-shell-section-label">
            {activeTab ? activeTab.title : 'No active editor'}
          </p>
          {activeTab ? (
            <ul>
              {activeTab.sections.map((section) => (
                <li key={section.title}>{section.title}</li>
              ))}
            </ul>
          ) : (
            <p className="custom-shell-muted">Open an editor to see its outline.</p>
          )}
        </div>
      ) : null}

      {activityId === 'settings' ? (
        <div className="custom-shell-settings">
          <p className="custom-shell-section-label">Region controls</p>
          <button type="button" className="custom-shell-setting" onClick={onToggleSecondary}>
            <span>{secondaryVisible ? 'Hide' : 'Show'} secondary side bar</span>
            <small>{secondaryVisible ? 'visible' : 'hidden'}</small>
          </button>
          <button type="button" className="custom-shell-setting" onClick={onTogglePanel}>
            <span>{panelVisible ? 'Hide' : 'Show'} bottom panel</span>
            <small>{panelVisible ? 'visible' : 'hidden'}</small>
          </button>
          <button type="button" className="custom-shell-setting" onClick={onTogglePanelMaximized}>
            <span>{panelMaximized ? 'Restore' : 'Maximize'} bottom panel</span>
            <small>{panelMaximized ? 'maximized' : 'normal'}</small>
          </button>
          <p className="custom-shell-sidebar-note">
            Every control writes to the example&apos;s reducer. The preset store is not part of this
            application.
          </p>
        </div>
      ) : null}
    </SidebarPrimitive>
  )
}
