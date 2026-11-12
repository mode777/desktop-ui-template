import {
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { cycleTab } from '@workbench-kit/core'

export interface TabStripItem {
  id: string
  title: string
  /**
   * Node rendered before the title. Custom elements should carry
   * `slot="content-before"`; the template passes its existing `vscode-icon`.
   */
  icon?: ReactNode
  dirty?: boolean
  /** Defaults to true. */
  closable?: boolean
}

export interface TabStripProps {
  tabs: TabStripItem[]
  activeId: string | null
  onActivate: (id: string) => void
  onClose: (id: string) => void
  onReorder: (sourceId: string, targetId: string) => void
  label: string
  actions?: ReactNode
  onTabContextMenu?: (id: string, position: { x: number; y: number }) => void
  onTabDoubleClick?: (id: string) => void
  className?: string
}

/**
 * Controlled tab strip.
 *
 * The consumer owns the tab list and the active id; this component reports
 * selection, close and reorder requests and only keeps transient drag state.
 * Markup and class names are the styling contract shared with the template's
 * stylesheet.
 */
export function TabStrip({
  tabs,
  activeId,
  onActivate,
  onClose,
  onReorder,
  label,
  actions,
  onTabContextMenu,
  onTabDoubleClick,
  className,
}: TabStripProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const focusTab = (index: number) => {
    const headers = stripRef.current?.querySelectorAll('vscode-tab-header')
    const header = headers?.[index] as HTMLElement | undefined
    header?.focus()
  }

  const focusTabById = (id: string) => {
    const index = tabs.findIndex((tab) => tab.id === id)
    if (index !== -1) requestAnimationFrame(() => focusTab(index))
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeId)
    if (currentIndex === -1) return

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const direction = event.key === 'ArrowLeft' ? -1 : 1
      const next = cycleTab({ tabs, activeTabId: activeId }, direction)
      if (!next.activeTabId) return
      onActivate(next.activeTabId)
      focusTabById(next.activeTabId)
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const index = event.key === 'Home' ? 0 : tabs.length - 1
      const next = tabs[index]
      onActivate(next.id)
      focusTabById(next.id)
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      onClose(tabs[currentIndex].id)
      requestAnimationFrame(() => focusTab(Math.max(0, currentIndex - 1)))
    }
  }

  const handleDragStart = (event: ReactDragEvent<HTMLDivElement>, id: string) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
    setDraggingId(id)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverId(null)
  }

  const handleDragOver = (event: ReactDragEvent<HTMLDivElement>, id: string) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    if (dragOverId !== id) setDragOverId(id)
  }

  const handleDragLeave = (id: string) => {
    if (dragOverId === id) setDragOverId(null)
  }

  const handleDrop = (event: ReactDragEvent<HTMLDivElement>, id: string) => {
    event.preventDefault()
    const sourceId = event.dataTransfer.getData('text/plain')
    if (!sourceId) return
    if (sourceId !== id) onReorder(sourceId, id)
    setDraggingId(null)
    setDragOverId(null)
  }

  const rootClassName = ['editor-tabs', className ?? ''].filter(Boolean).join(' ')

  return (
    <div
      className={rootClassName}
      role="tablist"
      aria-label={label}
      ref={stripRef}
      onKeyDown={handleKeyDown}
    >
      <div className="editor-tabs-scroll">
        {tabs.map((tab) => {
          const active = tab.id === activeId
          const closable = tab.closable !== false
          return (
            <div
              key={tab.id}
              className={`editor-tab ${active ? 'is-active' : ''} ${
                tab.id === draggingId ? 'is-dragging' : ''
              } ${tab.id === dragOverId ? 'is-drag-over' : ''}`.trim()}
              draggable
              onDragStart={(event) => handleDragStart(event, tab.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(event) => handleDragOver(event, tab.id)}
              onDragLeave={() => handleDragLeave(tab.id)}
              onDrop={(event) => handleDrop(event, tab.id)}
              onAuxClick={(event) => {
                if (event.button !== 1) return
                event.preventDefault()
                if (closable) onClose(tab.id)
              }}
              onContextMenu={(event) => {
                if (!onTabContextMenu) return
                event.preventDefault()
                onTabContextMenu(tab.id, { x: event.clientX, y: event.clientY })
              }}
            >
              <vscode-tab-header
                active={active}
                aria-selected={active ? 'true' : 'false'}
                onClick={() => onActivate(tab.id)}
                onDoubleClick={() => onTabDoubleClick?.(tab.id)}
              >
                {tab.icon}
                <span className="tab-title">{tab.title}</span>
                {closable ? (
                  <span
                    className={`tab-close ${tab.dirty ? 'is-dirty' : ''}`}
                    slot="content-after"
                    role="button"
                    tabIndex={-1}
                    aria-label={`Close ${tab.title}`}
                    title={tab.dirty ? 'Unsaved changes — close' : 'Close'}
                    onClick={(event) => {
                      event.stopPropagation()
                      onClose(tab.id)
                    }}
                  >
                    {tab.dirty ? (
                      <>
                        <vscode-icon name="close" size={14} />
                        <span className="tab-dirty-dot" />
                      </>
                    ) : (
                      <vscode-icon name="close" size={14} />
                    )}
                  </span>
                ) : null}
              </vscode-tab-header>
            </div>
          )
        })}
      </div>

      {actions ? <div className="editor-tabs-actions">{actions}</div> : null}
    </div>
  )
}
