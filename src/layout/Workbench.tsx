import { useWorkbenchHotkeys } from '../hooks/use-workbench-hotkeys'
import { useWorkbenchStore } from '../store/workbench-store'
import { workbenchConfig } from './workbench.config'
import type { WorkbenchConfig } from './types'
import { ActivityBar } from './components/ActivityBar'
import { BottomPanel } from './components/BottomPanel'
import { EditorArea } from './components/EditorArea'
import { Notifications } from './components/Notifications'
import { QuickOpen } from './components/QuickOpen'
import { ResizablePane } from './components/ResizablePane'
import { SecondarySideBar } from './components/SecondarySideBar'
import { Sidebar } from './components/Sidebar'
import { StatusBar } from './components/StatusBar'
import { TitleBar } from './components/TitleBar'

interface WorkbenchProps {
  config?: WorkbenchConfig
}

export function Workbench({ config = workbenchConfig }: WorkbenchProps) {
  useWorkbenchHotkeys()

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
    <div className={`workbench ${panelMaximized ? 'panel-is-maximized' : ''}`.trim()}>
      {showTitleBar ? <TitleBar config={config} /> : null}

      <div className="workbench-body">
        {showActivityBar ? <ActivityBar config={config} /> : null}

        {showPrimary ? (
          <ResizablePane
            side="left"
            size={primaryWidth}
            min={config.primarySideBar.minWidth}
            max={config.primarySideBar.maxWidth}
            onResize={setPrimaryWidth}
            onReset={() => setPrimaryWidth(config.primarySideBar.initialWidth)}
            label="Resize primary side bar"
          >
            <Sidebar config={config} />
          </ResizablePane>
        ) : null}

        <div className="workbench-center">
          {!panelMaximized ? <EditorArea /> : null}
          {showPanel ? (
            <ResizablePane
              side="bottom"
              size={panelHeight}
              min={config.bottomPanel.minHeight}
              max={config.bottomPanel.maxHeight}
              onResize={setPanelHeight}
              onReset={() => setPanelHeight(config.bottomPanel.initialHeight)}
              label="Resize panel"
              maximized={panelMaximized}
            >
              <BottomPanel config={config} />
            </ResizablePane>
          ) : null}
        </div>

        {showSecondary ? (
          <ResizablePane
            side="right"
            size={secondaryWidth}
            min={config.secondarySideBar.minWidth}
            max={config.secondarySideBar.maxWidth}
            onResize={setSecondaryWidth}
            onReset={() => setSecondaryWidth(config.secondarySideBar.initialWidth)}
            label="Resize secondary side bar"
          >
            <SecondarySideBar config={config} />
          </ResizablePane>
        ) : null}
      </div>

      {showStatusBar ? <StatusBar /> : null}
      <QuickOpen />
      <Notifications />
    </div>
  )
}
