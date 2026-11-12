import { useReducer } from 'react'
import { ResizablePane, WorkbenchShell } from '@workbench-kit/react'
import {
  activities,
  consoleLines,
  detailsRows,
  initialTabs,
  panelTabs,
  type CustomShellTab,
} from './data'
import {
  createInitialState,
  customShellReducer,
  PANEL_HEIGHT,
  PANEL_MAX,
  PANEL_MIN,
  PRIMARY_MAX,
  PRIMARY_MIN,
  PRIMARY_WIDTH,
  SECONDARY_MAX,
  SECONDARY_MIN,
  SECONDARY_WIDTH,
} from './state'
import { ActivityBar } from './regions/ActivityBar'
import { BottomPanel } from './regions/BottomPanel'
import { EditorArea } from './regions/EditorArea'
import { SecondarySideBar } from './regions/SecondarySideBar'
import { Sidebar } from './regions/Sidebar'
import { StatusBar } from './regions/StatusBar'
import { TitleBar } from './regions/TitleBar'

export function App() {
  const [state, dispatch] = useReducer(customShellReducer, undefined, createInitialState)
  const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId) ?? null

  const openTab = (tab: CustomShellTab) => dispatch({ type: 'tab/open', tab })

  return (
    <WorkbenchShell
      titleBar={
        <TitleBar
          secondaryVisible={state.secondaryVisible}
          panelVisible={state.panelVisible}
          panelMaximized={state.panelMaximized}
          onToggleSecondary={() => dispatch({ type: 'secondary/toggle' })}
          onTogglePanel={() => dispatch({ type: 'panel/toggle' })}
          onTogglePanelMaximized={() => dispatch({ type: 'panel/toggle-maximized' })}
        />
      }
      activityBar={
        <ActivityBar
          items={activities}
          activeId={state.activityId}
          primaryVisible={state.primaryVisible}
          onSelect={(id) => dispatch({ type: 'activity/select', id })}
          onShowAbout={() => openTab(initialTabs[3])}
        />
      }
      primarySideBar={
        state.primaryVisible ? (
          <ResizablePane
            side="left"
            size={state.primaryWidth}
            min={PRIMARY_MIN}
            max={PRIMARY_MAX}
            onSizeChange={(width) => dispatch({ type: 'primary/resize', width })}
            onReset={() => dispatch({ type: 'primary/resize', width: PRIMARY_WIDTH })}
            label="Resize primary side bar"
          >
            <Sidebar
              activityId={state.activityId}
              activeTab={activeTab}
              tabs={state.tabs}
              panelVisible={state.panelVisible}
              panelMaximized={state.panelMaximized}
              secondaryVisible={state.secondaryVisible}
              onOpenTab={openTab}
              onClose={() => dispatch({ type: 'primary/toggle' })}
              onToggleSecondary={() => dispatch({ type: 'secondary/toggle' })}
              onTogglePanel={() => dispatch({ type: 'panel/toggle' })}
              onTogglePanelMaximized={() => dispatch({ type: 'panel/toggle-maximized' })}
            />
          </ResizablePane>
        ) : null
      }
      secondarySideBar={
        state.secondaryVisible ? (
          <ResizablePane
            side="right"
            size={state.secondaryWidth}
            min={SECONDARY_MIN}
            max={SECONDARY_MAX}
            onSizeChange={(width) => dispatch({ type: 'secondary/resize', width })}
            onReset={() => dispatch({ type: 'secondary/resize', width: SECONDARY_WIDTH })}
            label="Resize secondary side bar"
          >
            <SecondarySideBar
              activeTab={activeTab}
              tabsCount={state.tabs.length}
              primaryWidth={state.primaryWidth}
              secondaryWidth={state.secondaryWidth}
              panelVisible={state.panelVisible}
              panelMaximized={state.panelMaximized}
              panelTabId={state.panelTabId}
              onClose={() => dispatch({ type: 'secondary/toggle' })}
            />
          </ResizablePane>
        ) : null
      }
      panel={
        state.panelVisible ? (
          <ResizablePane
            side="bottom"
            size={state.panelHeight}
            min={PANEL_MIN}
            max={PANEL_MAX}
            onSizeChange={(height) => dispatch({ type: 'panel/resize', height })}
            onReset={() => dispatch({ type: 'panel/resize', height: PANEL_HEIGHT })}
            label="Resize bottom panel"
            maximized={state.panelMaximized}
          >
            <BottomPanel
              tabs={panelTabs}
              activeId={state.panelTabId}
              maximized={state.panelMaximized}
              activeTab={activeTab}
              consoleLines={consoleLines}
              detailsRows={detailsRows}
              onSelect={(id) => dispatch({ type: 'panel/select-tab', id })}
              onToggleMaximized={() => dispatch({ type: 'panel/toggle-maximized' })}
              onClose={() => dispatch({ type: 'panel/toggle' })}
            />
          </ResizablePane>
        ) : null
      }
      panelMaximized={state.panelMaximized}
      statusBar={
        <StatusBar
          activeTab={activeTab}
          tabsCount={state.tabs.length}
          primaryVisible={state.primaryVisible}
          primaryWidth={state.primaryWidth}
          secondaryVisible={state.secondaryVisible}
          secondaryWidth={state.secondaryWidth}
          panelVisible={state.panelVisible}
          panelMaximized={state.panelMaximized}
          panelTabId={state.panelTabId}
        />
      }
    >
      <EditorArea
        tabs={state.tabs}
        activeTab={activeTab}
        onActivate={(id) => dispatch({ type: 'tab/activate', id })}
        onClose={(id) => dispatch({ type: 'tab/close', id })}
        onReorder={(sourceId, targetId) => dispatch({ type: 'tab/reorder', sourceId, targetId })}
        onReopen={() => openTab(initialTabs[0])}
      />
    </WorkbenchShell>
  )
}
