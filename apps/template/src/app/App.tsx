import { useEffect } from 'react'
import { VSCodeWorkbench } from '@workbench-kit/preset-vscode'
import { workbenchConfig } from './workbench.config'
import { StatusBar } from './components/StatusBar'
import { openFileTab } from '../demo/commands/commands'
import { commandRegistry, runWorkbenchCommand } from '../demo/commands/registry'
import { menuDefinitions, overflowMenu } from '../demo/commands/menus'
import { iconClassForFile, iconForFile, workspaceFiles } from '../demo/data/workspace'
import {
  createInitialOutputLines,
  createInitialTabs,
  WELCOME_TAB,
} from '../demo/data/initial-session'
import { useWorkbenchHotkeys } from './use-workbench-hotkeys'
import { useWorkbenchStore } from '@workbench-kit/preset-vscode'
import { DocumentView } from '../demo/views/DocumentView'
import { panelViews, primaryViews, secondaryViews } from '../demo/views/registry'

function TemplateEmptyEditor() {
  return (
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
  )
}

export function App() {
  useWorkbenchHotkeys()
  const theme = useWorkbenchStore((state) => state.theme)
  const notify = useWorkbenchStore((state) => state.notify)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#181818' : '#f8f8f8')
  }, [theme])

  return (
    <VSCodeWorkbench
      config={workbenchConfig}
      views={{ primary: primaryViews, secondary: secondaryViews, panel: panelViews }}
      commands={commandRegistry}
      menus={menuDefinitions}
      overflowMenu={overflowMenu}
      quickOpen={{ files: workspaceFiles, openFile: openFileTab }}
      fileIcons={{ icon: iconForFile, iconClass: iconClassForFile }}
      renderDocument={(tab) => <DocumentView tab={tab} />}
      onRevealFile={(path) => {
        runWorkbenchCommand('view.explorer')
        notify(`Revealed ${path} in the Explorer mock`)
      }}
      emptyEditor={<TemplateEmptyEditor />}
      branding={{
        title: 'vscode-workbench',
        icon: 'code',
        onActivate: () => runWorkbenchCommand('go.welcome'),
      }}
      commandCenterLabel="vscode-workbench"
      statusBar={<StatusBar />}
      initialSession={{
        tabs: createInitialTabs(),
        activeTabId: WELCOME_TAB.id,
        outputLines: createInitialOutputLines(),
      }}
    />
  )
}
