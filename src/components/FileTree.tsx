import { runWorkbenchCommand } from '../commands/commands'
import { openFileTab } from '../commands/commands'
import { iconClassForFile, iconForFile, workspaceTree } from '../data/workspace'
import type { WorkspaceNode } from '../data/workspace'
import type { MouseEvent } from 'react'
import { useWorkbenchStore } from '../store/workbench-store'

function Node({ node, activePath }: { node: WorkspaceNode; activePath?: string }) {
  if (node.kind === 'folder') {
    return (
      <vscode-tree-item open={node.open} data-path={node.path} data-kind="folder" branch>
        <vscode-icon
          slot="icon-branch"
          name="folder"
          size={15}
          className="file-icon file-icon--folder"
        />
        <vscode-icon
          slot="icon-branch-opened"
          name="folder-opened"
          size={15}
          className="file-icon file-icon--folder"
        />
        {node.name}
        {node.children?.map((child) => (
          <Node key={child.path || child.name} node={child} activePath={activePath} />
        ))}
      </vscode-tree-item>
    )
  }

  return (
    <vscode-tree-item
      data-path={node.path}
      data-kind="file"
      selected={node.path === activePath}
      className={node.path === activePath ? 'is-active-file' : undefined}
    >
      <vscode-icon
        slot="icon-leaf"
        name={iconForFile(node.path)}
        size={15}
        className={iconClassForFile(node.path)}
      />
      {node.name}
    </vscode-tree-item>
  )
}

export function FileTree() {
  const tabs = useWorkbenchStore((state) => state.tabs)
  const activeTabId = useWorkbenchStore((state) => state.activeTabId)
  const activeTab = tabs.find((tab) => tab.id === activeTabId)
  const activePath = activeTab?.kind === 'file' ? activeTab.path : undefined

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const item = target.closest('vscode-tree-item')
    if (!item) return
    const path = item.getAttribute('data-path')
    const kind = item.getAttribute('data-kind')
    if (!path || kind !== 'file') return

    if (path === 'README.md') runWorkbenchCommand('go.readme')
    else openFileTab(path)
  }

  return (
    <div className="file-tree" onClick={handleClick}>
      <vscode-tree
        expand-mode="singleClick"
        indent={8}
        indent-guides="onHover"
        aria-label="Project files"
      >
        <Node node={workspaceTree} activePath={activePath} />
      </vscode-tree>
    </div>
  )
}
