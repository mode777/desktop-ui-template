import '@workbench-kit/workbench/elements/icon'
import '@workbench-kit/workbench/elements/tab-header'
import '@workbench-kit/workbench/styles/tokens.css'
import '@workbench-kit/workbench/styles/global.css'
import '@workbench-kit/workbench/styles/shell.css'
import '@workbench-kit/workbench/styles/tab-strip.css'
import { TabStrip, WorkbenchShell } from '@workbench-kit/workbench/react'

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
