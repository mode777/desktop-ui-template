import 'vscode-workbench/elements/icon'
import 'vscode-workbench/elements/tab-header'
import 'vscode-workbench/styles/tokens.css'
import 'vscode-workbench/styles/global.css'
import 'vscode-workbench/styles/shell.css'
import 'vscode-workbench/styles/tab-strip.css'
import { TabStrip, WorkbenchShell } from 'vscode-workbench/react'

const tabs = [{ id: 'readme', title: 'README.md' }]

export function App() {
  return (
    <WorkbenchShell>
      <TabStrip
        tabs={tabs}
        activeId="readme"
        onActivate={() => {}}
        onClose={() => {}}
        onReorder={() => {}}
        label="Open editors"
        actions={<vscode-icon name="add" label="New file" />}
      />
    </WorkbenchShell>
  )
}
