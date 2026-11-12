import { Sidebar as SidebarPrimitive } from '@workbench-kit/react'
import type { CustomShellTab, PanelTabId } from '../data'

interface SecondarySideBarProps {
  activeTab: CustomShellTab | null
  tabsCount: number
  primaryWidth: number
  secondaryWidth: number
  panelVisible: boolean
  panelMaximized: boolean
  panelTabId: PanelTabId
  onClose: () => void
}

export function SecondarySideBar({
  activeTab,
  tabsCount,
  primaryWidth,
  secondaryWidth,
  panelVisible,
  panelMaximized,
  panelTabId,
  onClose,
}: SecondarySideBarProps) {
  return (
    <SidebarPrimitive
      title="Inspector"
      icon="info"
      label="Secondary side bar"
      closeLabel="Close Secondary Side Bar"
      onClose={onClose}
      className="secondary-sidebar custom-shell-inspector"
    >
      <dl className="custom-shell-details">
        <div>
          <dt>Active editor</dt>
          <dd>{activeTab ? activeTab.title : 'None'}</dd>
        </div>
        <div>
          <dt>Open tabs</dt>
          <dd>{tabsCount}</dd>
        </div>
        <div>
          <dt>Primary width</dt>
          <dd>{primaryWidth}px</dd>
        </div>
        <div>
          <dt>Secondary width</dt>
          <dd>{secondaryWidth}px</dd>
        </div>
        <div>
          <dt>Panel</dt>
          <dd>
            {panelVisible ? panelTabId : 'hidden'}
            {panelMaximized ? ' (maximized)' : ''}
          </dd>
        </div>
      </dl>
      <p className="custom-shell-sidebar-note">
        This region is supplied by the application. The shell does not render it unless the slot is
        present.
      </p>
    </SidebarPrimitive>
  )
}
