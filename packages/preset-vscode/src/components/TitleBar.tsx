import { IconButton, TitleBar as TitleBarPrimitive } from '@workbench-kit/react'
import { useWorkbenchStore } from '../store/workbench-store'
import { MenuBar } from './MenuBar'
import type {
  CommandRunner,
  MenuDefinition,
  MenuEntryDefinition,
  WorkbenchBranding,
  WorkbenchConfig,
} from '../types'

interface TitleBarProps {
  config: WorkbenchConfig
  menus: MenuDefinition[]
  overflowMenu?: MenuEntryDefinition[]
  branding?: WorkbenchBranding
  commandCenterLabel?: string
  run: CommandRunner
}

export function TitleBar({
  config,
  menus,
  overflowMenu,
  branding,
  commandCenterLabel,
  run,
}: TitleBarProps) {
  const primaryVisible = useWorkbenchStore((state) => state.primarySideBarVisible)
  const secondaryVisible = useWorkbenchStore((state) => state.secondarySideBarVisible)
  const panelVisible = useWorkbenchStore((state) => state.bottomPanelVisible)
  const togglePrimary = useWorkbenchStore((state) => state.togglePrimarySideBar)
  const toggleSecondary = useWorkbenchStore((state) => state.toggleSecondarySideBar)
  const togglePanel = useWorkbenchStore((state) => state.toggleBottomPanel)
  const notify = useWorkbenchStore((state) => state.notify)
  const brandTitle = branding?.title ?? commandCenterLabel ?? ''

  return (
    <TitleBarPrimitive
      left={
        <>
          {branding ? (
            <button
              type="button"
              className="app-mark"
              onClick={branding.onActivate}
              aria-label={branding.title}
              title={branding.title}
            >
              <vscode-icon name={branding.icon ?? 'code'} size={18} />
            </button>
          ) : null}
          {config.titleBar.menuBar ? (
            <MenuBar menus={menus} overflowMenu={overflowMenu} run={run} />
          ) : null}
        </>
      }
      center={
        config.titleBar.commandCenter ? (
          <button
            type="button"
            className="command-center"
            onClick={() => run.run('view.quickOpen')}
            title="Search files (Ctrl+P)"
          >
            <vscode-icon name="search" size={13} />
            <span className="command-center-title">{commandCenterLabel ?? brandTitle}</span>
            <span className="command-center-hint">Ctrl+P</span>
          </button>
        ) : undefined
      }
      right={
        <>
          {config.titleBar.layoutControls ? (
            <div className="layout-controls" role="group" aria-label="Layout controls">
              <IconButton
                icon="layout-sidebar-left"
                label="Toggle Primary Side Bar (Ctrl+B)"
                variant="toolbar"
                active={primaryVisible}
                onClick={() => togglePrimary()}
              />
              <IconButton
                icon="layout-panel"
                label="Toggle Panel (Ctrl+J)"
                variant="toolbar"
                active={panelVisible}
                onClick={() => togglePanel()}
              />
              <IconButton
                icon="layout-sidebar-right"
                label="Toggle Secondary Side Bar (Ctrl+Alt+B)"
                variant="toolbar"
                active={secondaryVisible}
                onClick={() => toggleSecondary()}
              />
            </div>
          ) : null}

          {config.titleBar.windowControls ? (
            <div className="window-controls" aria-label="Window controls">
              <button
                type="button"
                className="window-control"
                aria-label="Minimize (illustrative)"
                title="Minimize"
                onClick={() => notify('Minimize is illustrative in the browser')}
              >
                <vscode-icon name="chrome-minimize" size={14} />
              </button>
              <button
                type="button"
                className="window-control"
                aria-label="Maximize (illustrative)"
                title="Maximize"
                onClick={() => notify('Maximize is illustrative in the browser')}
              >
                <vscode-icon name="chrome-maximize" size={14} />
              </button>
              <button
                type="button"
                className="window-control window-control--close"
                aria-label="Close (illustrative)"
                title="Close"
                onClick={() => notify('Close is illustrative in the browser')}
              >
                <vscode-icon name="chrome-close" size={14} />
              </button>
            </div>
          ) : null}
        </>
      }
      onDoubleClick={() => notify('Window controls are illustrative in the web build')}
    />
  )
}
