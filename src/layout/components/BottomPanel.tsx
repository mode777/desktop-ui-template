import { useEffect, useMemo, useRef } from 'react'
import type { VscodeTabs } from '@vscode-elements/elements'
import { useWorkbenchStore } from '../../store/workbench-store'
import { panelViews } from '../../views/registry'
import type { PanelViewId, WorkbenchConfig } from '../types'

interface BottomPanelProps {
  config: WorkbenchConfig
}

export function BottomPanel({ config }: BottomPanelProps) {
  const activeView = useWorkbenchStore((state) => state.activePanelView) as PanelViewId
  const setActiveView = useWorkbenchStore((state) => state.showPanelView)
  const togglePanel = useWorkbenchStore((state) => state.toggleBottomPanel)
  const maximized = useWorkbenchStore((state) => state.panelMaximized)
  const toggleMaximized = useWorkbenchStore((state) => state.togglePanelMaximized)
  const tabsRef = useRef<VscodeTabs | null>(null)

  const views = config.bottomPanel.views
  const selectedIndex = Math.max(
    0,
    views.findIndex((view) => view === activeView),
  )

  useEffect(() => {
    const tabs = tabsRef.current
    if (!tabs) return

    const handleSelect = (event: Event) => {
      const detail = (event as CustomEvent<{ selectedIndex: number }>).detail
      const next = views[detail.selectedIndex]
      if (next) setActiveView(next)
    }

    tabs.addEventListener('vsc-tabs-select', handleSelect)
    return () => tabs.removeEventListener('vsc-tabs-select', handleSelect)
  }, [setActiveView, views])

  const panelContent = useMemo(
    () =>
      views.map((view) => {
        const definition = panelViews[view]
        const Component = definition.component
        return { view, definition, Component }
      }),
    [views],
  )

  return (
    <section className="panel" aria-label="Panel">
      <vscode-tabs ref={tabsRef} panel selected-index={selectedIndex} className="panel-tabs">
        <vscode-icon
          slot="addons"
          name={maximized ? 'chevron-down' : 'chevron-up'}
          action-icon
          label={maximized ? 'Restore Panel Size' : 'Maximize Panel Size'}
          title={maximized ? 'Restore Panel Size' : 'Maximize Panel Size'}
          size={14}
          onClick={toggleMaximized}
        />
        <vscode-icon
          slot="addons"
          name="close"
          action-icon
          label="Close Panel"
          title="Close Panel"
          size={14}
          onClick={() => togglePanel()}
        />

        {panelContent.map(({ view, definition }) => (
          <vscode-tab-header key={`header-${view}`} slot="header" panel>
            {definition.title}
            {view === 'problems' ? (
              <vscode-badge slot="content-after" variant="counter">
                2
              </vscode-badge>
            ) : null}
            {view === 'terminal' ? (
              <vscode-badge slot="content-after" variant="counter">
                1
              </vscode-badge>
            ) : null}
          </vscode-tab-header>
        ))}

        {panelContent.map(({ view, Component }) => (
          <vscode-tab-panel key={`panel-${view}`} className="panel-pane">
            <Component />
          </vscode-tab-panel>
        ))}
      </vscode-tabs>
    </section>
  )
}
