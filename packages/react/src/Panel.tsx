import { useEffect, useRef, type ReactNode } from 'react'

export interface PanelTab {
  id: string
  title: string
  badge?: number | string
  content: ReactNode
}

export interface PanelProps {
  /** Tabs, rendered in order. */
  tabs: PanelTab[]
  /** Id of the selected tab, or null when no tab is selected. */
  activeId: string | null
  /** Called when the user selects another tab. */
  onSelect: (id: string) => void
  /** Accessible label for the panel region. */
  label?: string
  /** Marks the panel as maximized and changes the maximize control label. */
  maximized?: boolean
  /** Called when the maximize/restore control is activated. Omit to hide it. */
  onToggleMaximized?: () => void
  /** Called when the close control is activated. Omit to hide it. */
  onClose?: () => void
  /** Appended to the structural root classes. */
  className?: string
}

/**
 * Controlled tabbed panel.
 *
 * The consumer owns the tab list and selected id. The primitive reports
 * selection, maximize and close requests and only wires the tabs event.
 */
export function Panel({
  tabs,
  activeId,
  onSelect,
  label = 'Panel',
  maximized = false,
  onToggleMaximized,
  onClose,
  className,
}: PanelProps) {
  const tabsRef = useRef<HTMLElement | null>(null)
  const selectedIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeId),
  )
  const maximizeLabel = maximized ? 'Restore Panel Size' : 'Maximize Panel Size'

  useEffect(() => {
    const element = tabsRef.current
    if (!element) return

    const handleSelect = (event: Event) => {
      const detail = (event as CustomEvent<{ selectedIndex: number }>).detail
      const next = tabs[detail?.selectedIndex]
      if (next) onSelect(next.id)
    }

    element.addEventListener('vsc-tabs-select', handleSelect)
    return () => element.removeEventListener('vsc-tabs-select', handleSelect)
  }, [tabs, onSelect])

  const rootClassName = ['panel', className ?? ''].filter(Boolean).join(' ')

  return (
    <section className={rootClassName} aria-label={label}>
      <vscode-tabs
        ref={(element) => {
          tabsRef.current = element
        }}
        panel
        selected-index={selectedIndex}
        className="panel-tabs"
        aria-label={`${label} tabs`}
      >
        {onToggleMaximized ? (
          <vscode-icon
            slot="addons"
            name={maximized ? 'chevron-down' : 'chevron-up'}
            action-icon
            label={maximizeLabel}
            title={maximizeLabel}
            size={14}
            onClick={onToggleMaximized}
          />
        ) : null}
        {onClose ? (
          <vscode-icon
            slot="addons"
            name="close"
            action-icon
            label="Close Panel"
            title="Close Panel"
            size={14}
            onClick={onClose}
          />
        ) : null}

        {tabs.map((tab) => (
          <vscode-tab-header key={`header-${tab.id}`} slot="header" panel>
            {tab.title}
            {tab.badge !== undefined ? (
              <vscode-badge slot="content-after" variant="counter">
                {tab.badge}
              </vscode-badge>
            ) : null}
          </vscode-tab-header>
        ))}

        {tabs.map((tab) => (
          <vscode-tab-panel key={`panel-${tab.id}`} className="panel-pane">
            {tab.content}
          </vscode-tab-panel>
        ))}
      </vscode-tabs>
    </section>
  )
}
