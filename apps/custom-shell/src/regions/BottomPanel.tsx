import { Panel, type PanelTab as WorkbenchPanelTab } from '@workbench-kit/react'
import type { CustomShellTab, PanelTab, PanelTabId } from '../data'

interface BottomPanelProps {
  tabs: PanelTab[]
  activeId: PanelTabId
  maximized: boolean
  activeTab: CustomShellTab | null
  consoleLines: string[]
  detailsRows: { label: string; value: string }[]
  onSelect: (id: PanelTabId) => void
  onToggleMaximized: () => void
  onClose: () => void
}

export function BottomPanel({
  tabs,
  activeId,
  maximized,
  activeTab,
  consoleLines,
  detailsRows,
  onSelect,
  onToggleMaximized,
  onClose,
}: BottomPanelProps) {
  const panelTabs: WorkbenchPanelTab[] = tabs.map((tab) => ({
    id: tab.id,
    title: tab.title,
    content:
      tab.id === 'console' ? (
        <div className="custom-shell-console" aria-label="Console output">
          {consoleLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : (
        <div className="custom-shell-details" aria-label="Example details">
          <dl>
            <div>
              <dt>Active editor</dt>
              <dd>{activeTab ? activeTab.title : 'None'}</dd>
            </div>
            {detailsRows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ),
  }))

  return (
    <Panel
      tabs={panelTabs}
      activeId={activeId}
      onSelect={(id) => onSelect(id as PanelTabId)}
      maximized={maximized}
      onToggleMaximized={onToggleMaximized}
      onClose={onClose}
    />
  )
}
