import { useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { runWorkbenchCommand } from '../../commands/commands'
import { IconButton } from '../../components/IconButton'
import { VsContextMenu } from '../../components/VsContextMenu'
import type { ContextMenuItem } from '../../components/VsContextMenu'
import { iconClassForFile, iconForFile } from '../../data/workspace'
import { useWorkbenchStore } from '../../store/workbench-store'
import type { WorkbenchTab } from '../../store/workbench-types'
import { DocumentView } from '../../views/DocumentView'

interface TabContextMenu {
  x: number
  y: number
  tabId: string
}

interface ActionsMenu {
  x: number
  y: number
}

function tabIcon(tab: WorkbenchTab): string {
  if (tab.kind === 'welcome') return 'code'
  if (tab.kind === 'readme') return 'markdown'
  if (tab.kind === 'untitled') return 'file'
  return iconForFile(tab.path ?? tab.title)
}

function tabIconClass(tab: WorkbenchTab): string {
  if (tab.kind === 'welcome') return 'file-icon file-icon--welcome'
  if (tab.kind === 'readme') return 'file-icon file-icon--md'
  if (tab.kind === 'untitled') return 'file-icon'
  return iconClassForFile(tab.path ?? tab.title)
}

export function EditorArea() {
  const tabs = useWorkbenchStore((state) => state.tabs)
  const activeTabId = useWorkbenchStore((state) => state.activeTabId)
  const activateTab = useWorkbenchStore((state) => state.activateTab)
  const closeTab = useWorkbenchStore((state) => state.closeTab)
  const closeOtherTabs = useWorkbenchStore((state) => state.closeOtherTabs)
  const closeAllTabs = useWorkbenchStore((state) => state.closeAllTabs)
  const reorderTab = useWorkbenchStore((state) => state.reorderTab)
  const notify = useWorkbenchStore((state) => state.notify)
  const togglePanel = useWorkbenchStore((state) => state.toggleBottomPanel)
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0] ?? null
  const stripRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [tabMenu, setTabMenu] = useState<TabContextMenu | null>(null)
  const [actionsMenu, setActionsMenu] = useState<ActionsMenu | null>(null)

  const tabMenuItems = useMemo<ContextMenuItem[]>(
    () => [
      { label: 'Close', value: 'close', keybinding: 'Ctrl+W' },
      { label: 'Close Others', value: 'close-others' },
      { label: 'Close All', value: 'close-all', keybinding: 'Ctrl+Shift+W' },
      { separator: true },
      { label: 'Copy Path', value: 'copy-path' },
      { label: 'Reveal in Explorer', value: 'reveal' },
      { separator: true },
      { label: 'Toggle Panel', value: 'toggle-panel', keybinding: 'Ctrl+J' },
    ],
    [],
  )

  const actionsMenuItems: ContextMenuItem[] = [
    { label: 'Command Palette…', value: 'command-palette', keybinding: 'Ctrl+Shift+P' },
    { label: 'Go to File…', value: 'quick-open', keybinding: 'Ctrl+P' },
    { separator: true },
    { label: 'Close All Editors', value: 'close-all' },
    { label: 'Toggle Panel', value: 'toggle-panel' },
    { label: 'Reset Layout', value: 'reset-layout' },
  ]

  const focusTab = (index: number) => {
    const headers = stripRef.current?.querySelectorAll('vscode-tab-header')
    const header = headers?.[index] as HTMLElement | undefined
    header?.focus()
  }

  const handleTabKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId)
    if (currentIndex === -1) return

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const direction = event.key === 'ArrowLeft' ? -1 : 1
      const next = (currentIndex + direction + tabs.length) % tabs.length
      activateTab(tabs[next].id)
      requestAnimationFrame(() => focusTab(next))
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const next = event.key === 'Home' ? 0 : tabs.length - 1
      activateTab(tabs[next].id)
      requestAnimationFrame(() => focusTab(next))
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      closeTab(tabs[currentIndex].id)
      requestAnimationFrame(() => focusTab(Math.max(0, currentIndex - 1)))
    }
  }

  const handleTabMenuSelect = (value: string) => {
    const target = tabMenu
    if (!target) return
    const tab = tabs.find((entry) => entry.id === target.tabId)
    switch (value) {
      case 'close':
        closeTab(target.tabId)
        break
      case 'close-others':
        closeOtherTabs(target.tabId)
        break
      case 'close-all':
        closeAllTabs()
        break
      case 'copy-path':
        if (tab?.path) {
          void navigator.clipboard?.writeText(tab.path)
          notify(`Copied ${tab.path}`)
        }
        break
      case 'reveal':
        if (tab?.path) {
          runWorkbenchCommand('view.explorer')
          notify(`Revealed ${tab.path} in the Explorer mock`)
        }
        break
      case 'toggle-panel':
        togglePanel()
        break
      default:
        break
    }
    setTabMenu(null)
  }

  const handleActionsMenuSelect = (value: string) => {
    switch (value) {
      case 'command-palette':
        runWorkbenchCommand('view.commandPalette')
        break
      case 'quick-open':
        runWorkbenchCommand('view.quickOpen')
        break
      case 'close-all':
        closeAllTabs()
        break
      case 'toggle-panel':
        togglePanel()
        break
      case 'reset-layout':
        runWorkbenchCommand('view.resetLayout')
        break
      default:
        break
    }
    setActionsMenu(null)
  }

  const pathSegments = activeTab?.path?.split('/').filter(Boolean) ?? []

  return (
    <section className="editor-area" aria-label="Editor area">
      <div
        className="editor-tabs"
        role="tablist"
        aria-label="Open editors"
        ref={stripRef}
        onKeyDown={handleTabKeyDown}
      >
        <div className="editor-tabs-scroll">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`editor-tab ${tab.id === activeTab?.id ? 'is-active' : ''} ${
                tab.id === draggingId ? 'is-dragging' : ''
              } ${tab.id === dragOverId ? 'is-drag-over' : ''}`.trim()}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', tab.id)
                setDraggingId(tab.id)
              }}
              onDragEnd={() => {
                setDraggingId(null)
                setDragOverId(null)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                if (dragOverId !== tab.id) setDragOverId(tab.id)
              }}
              onDragLeave={() => {
                if (dragOverId === tab.id) setDragOverId(null)
              }}
              onDrop={(event) => {
                event.preventDefault()
                const sourceId = event.dataTransfer.getData('text/plain')
                if (sourceId) reorderTab(sourceId, tab.id)
                setDraggingId(null)
                setDragOverId(null)
              }}
              onAuxClick={(event) => {
                if (event.button === 1) {
                  event.preventDefault()
                  closeTab(tab.id)
                }
              }}
              onContextMenu={(event) => {
                event.preventDefault()
                setTabMenu({ x: event.clientX, y: event.clientY, tabId: tab.id })
              }}
            >
              <vscode-tab-header
                active={tab.id === activeTab?.id}
                onClick={() => activateTab(tab.id)}
                onDoubleClick={() => notify('Double-click on a tab is free for your own action')}
              >
                <vscode-icon
                  name={tabIcon(tab)}
                  size={14}
                  className={tabIconClass(tab)}
                  slot="content-before"
                />
                <span className="tab-title">{tab.title}</span>
                <span
                  className={`tab-close ${tab.dirty ? 'is-dirty' : ''}`}
                  role="button"
                  tabIndex={-1}
                  aria-label={`Close ${tab.title}`}
                  title={tab.dirty ? 'Unsaved changes — close' : 'Close'}
                  onClick={(event) => {
                    event.stopPropagation()
                    closeTab(tab.id)
                  }}
                >
                  {tab.dirty ? (
                    <>
                      <vscode-icon name="close" size={13} />
                      <span className="tab-dirty-dot" />
                    </>
                  ) : (
                    <vscode-icon name="close" size={13} />
                  )}
                </span>
              </vscode-tab-header>
            </div>
          ))}
        </div>

        <div className="editor-tabs-actions">
          <IconButton
            icon="split-horizontal"
            label="Split Editor"
            variant="toolbar"
            onClick={() => notify('Split editor is a placeholder for your editor implementation')}
          />
          <IconButton
            icon="ellipsis"
            label="More Editor Actions"
            variant="toolbar"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              setActionsMenu({ x: rect.right - 240, y: rect.bottom })
            }}
          />
        </div>
      </div>

      {activeTab ? (
        <>
          <div className="editor-breadcrumbs" aria-label="Breadcrumbs">
            {pathSegments.length > 0 ? (
              pathSegments.map((segment, index) => (
                <span className="breadcrumb-segment" key={`${segment}-${index}`}>
                  {index > 0 ? <vscode-icon name="chevron-right" size={12} /> : null}
                  {index === pathSegments.length - 1 ? (
                    <vscode-icon
                      name={tabIcon(activeTab)}
                      size={13}
                      className={tabIconClass(activeTab)}
                    />
                  ) : (
                    <vscode-icon name="folder" size={13} />
                  )}
                  <span>{segment}</span>
                </span>
              ))
            ) : (
              <span className="breadcrumb-segment">
                <vscode-icon name="code" size={13} />
                <span>{activeTab.title}</span>
              </span>
            )}
            <span className="editor-preview-badge">preview</span>
          </div>
          <div className="editor-content">
            <DocumentView tab={activeTab} />
          </div>
        </>
      ) : (
        <div className="empty-editor">
          <vscode-icon name="editor-layout" size={44} />
          <h2>No editors are open</h2>
          <p>Open a file from the Explorer, or use the Quick Open dialog.</p>
          <div className="empty-editor-actions">
            <vscode-button onClick={() => runWorkbenchCommand('view.quickOpen')}>
              Open File…
            </vscode-button>
            <vscode-button secondary onClick={() => runWorkbenchCommand('go.welcome')}>
              Show Welcome
            </vscode-button>
          </div>
        </div>
      )}

      <VsContextMenu
        open={tabMenu !== null}
        x={tabMenu?.x ?? 0}
        y={tabMenu?.y ?? 0}
        items={tabMenuItems}
        onSelect={handleTabMenuSelect}
        onClose={() => setTabMenu(null)}
      />
      <VsContextMenu
        open={actionsMenu !== null}
        x={actionsMenu?.x ?? 0}
        y={actionsMenu?.y ?? 0}
        items={actionsMenuItems}
        onSelect={handleActionsMenuSelect}
        onClose={() => setActionsMenu(null)}
      />
    </section>
  )
}
