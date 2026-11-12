import { StatusBar as StatusBarPrimitive } from '@workbench-kit/react'
import type { CustomShellTab, PanelTabId } from '../data'

interface StatusBarProps {
  activeTab: CustomShellTab | null
  tabsCount: number
  primaryVisible: boolean
  primaryWidth: number
  secondaryVisible: boolean
  secondaryWidth: number
  panelVisible: boolean
  panelMaximized: boolean
  panelTabId: PanelTabId
}

export function StatusBar({
  activeTab,
  tabsCount,
  primaryVisible,
  primaryWidth,
  secondaryVisible,
  secondaryWidth,
  panelVisible,
  panelMaximized,
  panelTabId,
}: StatusBarProps) {
  return (
    <StatusBarPrimitive
      left={
        <>
          <span className="status-item status-item--brand">
            <vscode-icon name="layout" size={13} />
            <span>Custom Shell</span>
          </span>
          <span className="status-item">{activeTab ? activeTab.title : 'No editor'}</span>
        </>
      }
      right={
        <>
          <span className="status-item">{tabsCount} tabs</span>
          <span className="status-item">
            Primary: {primaryVisible ? `${primaryWidth}px` : 'hidden'}
          </span>
          <span className="status-item">
            Secondary: {secondaryVisible ? `${secondaryWidth}px` : 'hidden'}
          </span>
          <span className="status-item">
            Panel: {panelVisible ? panelTabId : 'hidden'}
            {panelMaximized ? ' (max)' : ''}
          </span>
        </>
      }
    />
  )
}
