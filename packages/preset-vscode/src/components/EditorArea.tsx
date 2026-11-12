import { useMemo, useState, type ReactNode } from 'react'
import { ContextMenu, IconButton, TabStrip } from '@workbench-kit/react'
import type { ContextMenuItem, TabStripItem } from '@workbench-kit/react'
import { useWorkbenchStore } from '../store/workbench-store'
import type { WorkbenchTab } from '../store/workbench-types'
import type { CommandRunner, FileIconResolver } from '../types'

interface TabContextMenu {
  x: number
  y: number
  tabId: string
}

interface ActionsMenu {
  x: number
  y: number
}

interface EditorAreaProps {
  /** Renders the document for the active tab. */
  renderDocument?: (tab: WorkbenchTab) => ReactNode
  /** Maps a file path to a codicon name and an optional icon class. */
  fileIcons?: FileIconResolver
  /** Replaces the default "no editors" message. */
  emptyEditor?: ReactNode
  /** Adds a "Reveal" entry to the tab context menu when supplied. */
  onRevealFile?: (path: string) => void
  run: CommandRunner
}

function tabIcon(tab: WorkbenchTab, fileIcons?: FileIconResolver): string {
  if (tab.kind === 'welcome') return 'code'
  if (tab.kind === 'readme') return 'markdown'
  if (tab.kind === 'untitled') return 'file'
  return fileIcons?.icon(tab.path ?? tab.title) ?? 'file'
}

function tabIconClass(tab: WorkbenchTab, fileIcons?: FileIconResolver): string {
  if (tab.kind === 'welcome') return 'file-icon file-icon--welcome'
  if (tab.kind === 'readme') return 'file-icon file-icon--md'
  if (tab.kind === 'untitled') return 'file-icon'
  return fileIcons?.iconClass?.(tab.path ?? tab.title) ?? 'file-icon'
}

export function EditorArea({
  renderDocument,
  fileIcons,
  emptyEditor,
  onRevealFile,
  run,
}: EditorAreaProps) {
  const tabs = useWorkbenchStore((state) => state.tabs)
  const activeTabId = useWorkbenchStore((state) => state.activeTabId)
  const activateTab = useWorkbenchStore((state) => state.activateTab)
  const closeTab = useWorkbenchStore((state) => state.closeTab)
  const closeOtherTabs = useWorkbenchStore((state) => state.closeOtherTabs)
  const closeAllTabs = useWorkbenchStore((state) => state.closeAllTabs)
  const reorderTab = useWorkbenchStore((state) => state.reorderTab)
  const notify = useWorkbenchStore((state) => state.notify)
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0] ?? null
  const [tabMenu, setTabMenu] = useState<TabContextMenu | null>(null)
  const [actionsMenu, setActionsMenu] = useState<ActionsMenu | null>(null)

  const tabMenuItems = useMemo<ContextMenuItem[]>(() => {
    const items: ContextMenuItem[] = [
      { label: 'Close', value: 'close', keybinding: 'Ctrl+W' },
      { label: 'Close Others', value: 'close-others' },
      { label: 'Close All', value: 'close-all', keybinding: 'Ctrl+Shift+W' },
      { separator: true },
      { label: 'Copy Path', value: 'copy-path' },
    ]
    if (onRevealFile) {
      items.push({ label: 'Reveal in Explorer', value: 'reveal' })
    }
    items.push(
      { separator: true },
      { label: 'Toggle Panel', value: 'toggle-panel', keybinding: 'Ctrl+J' },
    )
    return items
  }, [onRevealFile])

  const actionsMenuItems: ContextMenuItem[] = [
    { label: 'Command Palette…', value: 'command-palette', keybinding: 'Ctrl+Shift+P' },
    { label: 'Go to File…', value: 'quick-open', keybinding: 'Ctrl+P' },
    { separator: true },
    { label: 'Close All Editors', value: 'close-all' },
    { label: 'Toggle Panel', value: 'toggle-panel' },
    { label: 'Reset Layout', value: 'reset-layout' },
  ]

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
        if (tab?.path && onRevealFile) onRevealFile(tab.path)
        break
      case 'toggle-panel':
        run.run('view.togglePanel')
        break
      default:
        break
    }
    setTabMenu(null)
  }

  const handleActionsMenuSelect = (value: string) => {
    switch (value) {
      case 'command-palette':
        run.run('view.commandPalette')
        break
      case 'quick-open':
        run.run('view.quickOpen')
        break
      case 'close-all':
        closeAllTabs()
        break
      case 'toggle-panel':
        run.run('view.togglePanel')
        break
      case 'reset-layout':
        run.run('view.resetLayout')
        break
      default:
        break
    }
    setActionsMenu(null)
  }

  const tabItems: TabStripItem[] = tabs.map((tab) => ({
    id: tab.id,
    title: tab.title,
    dirty: tab.dirty,
    icon: (
      <vscode-icon
        name={tabIcon(tab, fileIcons)}
        size={16}
        className={tabIconClass(tab, fileIcons)}
        slot="content-before"
      />
    ),
  }))

  const pathSegments = activeTab?.path?.split('/').filter(Boolean) ?? []

  return (
    <section className="editor-area" aria-label="Editor area">
      <TabStrip
        tabs={tabItems}
        activeId={activeTab?.id ?? null}
        onActivate={activateTab}
        onClose={closeTab}
        onReorder={reorderTab}
        label="Open editors"
        onTabContextMenu={(id, position) => setTabMenu({ ...position, tabId: id })}
        onTabDoubleClick={() => notify('Double-click on a tab is free for your own action')}
        actions={
          <>
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
          </>
        }
      />

      {activeTab ? (
        <>
          <div className="editor-breadcrumbs" aria-label="Breadcrumbs">
            {pathSegments.length > 0 ? (
              pathSegments.map((segment, index) => (
                <span className="breadcrumb-segment" key={`${segment}-${index}`}>
                  {index > 0 ? <vscode-icon name="chevron-right" size={12} /> : null}
                  {index === pathSegments.length - 1 ? (
                    <vscode-icon
                      name={tabIcon(activeTab, fileIcons)}
                      size={13}
                      className={tabIconClass(activeTab, fileIcons)}
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
          <div className="editor-content">{renderDocument ? renderDocument(activeTab) : null}</div>
        </>
      ) : (
        (emptyEditor ?? (
          <div className="empty-editor">
            <vscode-icon name="editor-layout" size={44} />
            <h2>No editors are open</h2>
            <p>Open a file with Quick Open.</p>
            <div className="empty-editor-actions">
              <vscode-button onClick={() => run.run('view.quickOpen')}>Open File…</vscode-button>
            </div>
          </div>
        ))
      )}

      <ContextMenu
        open={tabMenu !== null}
        x={tabMenu?.x ?? 0}
        y={tabMenu?.y ?? 0}
        items={tabMenuItems}
        onSelect={handleTabMenuSelect}
        onClose={() => setTabMenu(null)}
      />
      <ContextMenu
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
