import { IconButton, TitleBar as TitleBarPrimitive } from '@workbench-kit/react'

interface TitleBarProps {
  secondaryVisible: boolean
  panelVisible: boolean
  panelMaximized: boolean
  onToggleSecondary: () => void
  onTogglePanel: () => void
  onTogglePanelMaximized: () => void
}

export function TitleBar({
  secondaryVisible,
  panelVisible,
  panelMaximized,
  onToggleSecondary,
  onTogglePanel,
  onTogglePanelMaximized,
}: TitleBarProps) {
  return (
    <TitleBarPrimitive
      left={
        <>
          <span className="app-mark" aria-hidden="true">
            <vscode-icon name="layout" size={18} />
          </span>
          <span className="custom-shell-title">Custom Shell</span>
        </>
      }
      center={
        <div className="command-center custom-shell-command-center" aria-hidden="true">
          <vscode-icon name="symbol-ruler" size={13} />
          <span className="command-center-title">Composition without the preset</span>
          <span className="command-center-hint">local state</span>
        </div>
      }
      right={
        <div className="layout-controls" role="group" aria-label="Layout controls">
          <IconButton
            icon="layout-sidebar-right"
            label={secondaryVisible ? 'Hide Secondary Side Bar' : 'Show Secondary Side Bar'}
            variant="toolbar"
            active={secondaryVisible}
            onClick={onToggleSecondary}
          />
          <IconButton
            icon="layout-panel"
            label={panelVisible ? 'Hide Panel' : 'Show Panel'}
            variant="toolbar"
            active={panelVisible}
            onClick={onTogglePanel}
          />
          <IconButton
            icon={panelMaximized ? 'chevron-down' : 'chevron-up'}
            label={panelMaximized ? 'Restore Panel Size' : 'Maximize Panel Size'}
            variant="toolbar"
            active={panelMaximized}
            onClick={onTogglePanelMaximized}
          />
        </div>
      }
    />
  )
}
