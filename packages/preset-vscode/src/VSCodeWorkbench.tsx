import { useState, type ReactNode } from 'react'
import { useWorkbenchStore, seedInitialSession } from './store/workbench-store'
import type { InitialWorkbenchSession } from './store/workbench-store'
import type { WorkbenchTab } from './store/workbench-types'
import { ResizablePane, WorkbenchShell } from '@workbench-kit/react'
import type {
  CommandRegistry,
  FileIconResolver,
  MenuDefinition,
  MenuEntryDefinition,
  QuickOpenProvider,
  WorkbenchBranding,
  WorkbenchConfig,
  WorkbenchViewRegistry,
} from './types'
import { ActivityBar } from './components/ActivityBar'
import { BottomPanel } from './components/BottomPanel'
import { EditorArea } from './components/EditorArea'
import { Notifications } from './components/Notifications'
import { QuickOpen } from './components/QuickOpen'
import { SecondarySideBar } from './components/SecondarySideBar'
import { Sidebar } from './components/Sidebar'
import { TitleBar } from './components/TitleBar'

export interface VSCodeWorkbenchProps {
  config: WorkbenchConfig
  views: WorkbenchViewRegistry
  commands: CommandRegistry
  menus: MenuDefinition[]
  overflowMenu?: MenuEntryDefinition[]
  quickOpen?: QuickOpenProvider
  fileIcons?: FileIconResolver
  renderDocument?: (tab: WorkbenchTab) => ReactNode
  emptyEditor?: ReactNode
  branding?: WorkbenchBranding
  commandCenterLabel?: string
  statusBar?: ReactNode
  initialSession?: InitialWorkbenchSession
  onRevealFile?: (path: string) => void
}

export function VSCodeWorkbench({
  config,
  views,
  commands,
  menus,
  overflowMenu,
  quickOpen,
  fileIcons,
  renderDocument,
  emptyEditor,
  branding,
  commandCenterLabel,
  statusBar,
  initialSession,
  onRevealFile,
}: VSCodeWorkbenchProps) {
  useState(() => {
    if (initialSession) seedInitialSession(initialSession)
    return true
  })

  const primaryVisible = useWorkbenchStore((state) => state.primarySideBarVisible)
  const secondaryVisible = useWorkbenchStore((state) => state.secondarySideBarVisible)
  const panelVisible = useWorkbenchStore((state) => state.bottomPanelVisible)
  const activityBarVisible = useWorkbenchStore((state) => state.activityBarVisible)
  const statusBarVisible = useWorkbenchStore((state) => state.statusBarVisible)
  const titleBarVisible = useWorkbenchStore((state) => state.titleBarVisible)
  const panelMaximized = useWorkbenchStore((state) => state.panelMaximized)

  const primaryWidth = useWorkbenchStore((state) => state.primarySideBarWidth)
  const secondaryWidth = useWorkbenchStore((state) => state.secondarySideBarWidth)
  const panelHeight = useWorkbenchStore((state) => state.bottomPanelHeight)
  const setPrimaryWidth = useWorkbenchStore((state) => state.setPrimarySideBarWidth)
  const setSecondaryWidth = useWorkbenchStore((state) => state.setSecondarySideBarWidth)
  const setPanelHeight = useWorkbenchStore((state) => state.setBottomPanelHeight)

  const showTitleBar = config.titleBar.enabled && titleBarVisible
  const showActivityBar = config.activityBar.enabled && activityBarVisible
  const showPrimary = config.primarySideBar.enabled && primaryVisible
  const showSecondary = config.secondarySideBar.enabled && secondaryVisible
  const showPanel = config.bottomPanel.enabled && panelVisible
  const showStatusBar = config.statusBar.enabled && statusBarVisible

  return (
    <WorkbenchShell
      titleBar={
        showTitleBar ? (
          <TitleBar
            config={config}
            menus={menus}
            overflowMenu={overflowMenu}
            branding={branding}
            commandCenterLabel={commandCenterLabel}
            run={commands}
          />
        ) : null
      }
      activityBar={showActivityBar ? <ActivityBar config={config} run={commands} /> : null}
      primarySideBar={
        showPrimary ? (
          <ResizablePane
            side="left"
            size={primaryWidth}
            min={config.primarySideBar.minWidth}
            max={config.primarySideBar.maxWidth}
            onSizeChange={setPrimaryWidth}
            onReset={() => setPrimaryWidth(config.primarySideBar.initialWidth)}
            label="Resize primary side bar"
          >
            <Sidebar config={config} views={views.primary} run={commands} />
          </ResizablePane>
        ) : null
      }
      panel={
        showPanel ? (
          <ResizablePane
            side="bottom"
            size={panelHeight}
            min={config.bottomPanel.minHeight}
            max={config.bottomPanel.maxHeight}
            onSizeChange={setPanelHeight}
            onReset={() => setPanelHeight(config.bottomPanel.initialHeight)}
            label="Resize panel"
            maximized={panelMaximized}
          >
            <BottomPanel config={config} views={views.panel} run={commands} />
          </ResizablePane>
        ) : null
      }
      secondarySideBar={
        showSecondary ? (
          <ResizablePane
            side="right"
            size={secondaryWidth}
            min={config.secondarySideBar.minWidth}
            max={config.secondarySideBar.maxWidth}
            onSizeChange={setSecondaryWidth}
            onReset={() => setSecondaryWidth(config.secondarySideBar.initialWidth)}
            label="Resize secondary side bar"
          >
            <SecondarySideBar config={config} views={views.secondary} run={commands} />
          </ResizablePane>
        ) : null
      }
      statusBar={showStatusBar ? statusBar : null}
      overlays={
        <>
          <QuickOpen
            files={quickOpen?.files ?? []}
            openFile={quickOpen?.openFile ?? (() => undefined)}
            commands={commands}
            fileIcons={fileIcons}
          />
          <Notifications />
        </>
      }
      panelMaximized={panelMaximized}
    >
      <EditorArea
        run={commands}
        renderDocument={renderDocument}
        fileIcons={fileIcons}
        emptyEditor={emptyEditor}
        onRevealFile={onRevealFile}
      />
    </WorkbenchShell>
  )
}
