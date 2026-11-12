import { StatusBar as StatusBarPrimitive } from '@workbench-kit/react'
import { runWorkbenchCommand } from '../../demo/commands/registry'
import { useWorkbenchStore } from '@workbench-kit/preset-vscode'

const languageLabels: Record<string, string> = {
  typescript: 'TypeScript',
  typescriptreact: 'TypeScript React',
  css: 'CSS',
  json: 'JSON',
  markdown: 'Markdown',
  html: 'HTML',
  yaml: 'YAML',
  xml: 'XML',
  plaintext: 'Plain Text',
}

export function StatusBar() {
  const tabs = useWorkbenchStore((state) => state.tabs)
  const activeTabId = useWorkbenchStore((state) => state.activeTabId)
  const theme = useWorkbenchStore((state) => state.theme)
  const notify = useWorkbenchStore((state) => state.notify)
  const toggleTheme = useWorkbenchStore((state) => state.toggleTheme)
  const showPanelView = useWorkbenchStore((state) => state.showPanelView)
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
  const language = activeTab?.language ?? 'plaintext'

  return (
    <StatusBarPrimitive
      left={
        <>
          <button
            type="button"
            className="status-item status-item--brand"
            title="Remote workspace"
            onClick={() => notify('Connected to the mock workspace')}
          >
            <vscode-icon name="remote" size={13} />
            <span>Desktop UI Template</span>
          </button>
          <button
            type="button"
            className="status-item"
            title="Git branch"
            onClick={() => notify('Branch: main — 0 ahead, 0 behind')}
          >
            <vscode-icon name="git-branch" size={13} />
            <span>main*</span>
          </button>
          <button
            type="button"
            className="status-item"
            title="Synchronize changes"
            onClick={() => notify('No remote changes to synchronize')}
          >
            <vscode-icon name="sync" size={13} />
          </button>
          <button
            type="button"
            className="status-item"
            title="Problems"
            onClick={() => showPanelView('problems')}
          >
            <vscode-icon name="error" size={13} />
            <span>2</span>
            <vscode-icon name="warning" size={13} />
            <span>1</span>
          </button>
        </>
      }
      right={
        <>
          <button
            type="button"
            className="status-item"
            title="Go to line/column"
            onClick={() => notify('Cursor position is a mock value')}
          >
            Ln 1, Col 1
          </button>
          <button
            type="button"
            className="status-item"
            title="Select indentation"
            onClick={() => notify('Indentation: 2 spaces')}
          >
            Spaces: 2
          </button>
          <button
            type="button"
            className="status-item"
            title="Select encoding"
            onClick={() => notify('Encoding: UTF-8')}
          >
            UTF-8
          </button>
          <button
            type="button"
            className="status-item"
            title="Select end of line sequence"
            onClick={() => notify('Line endings: LF')}
          >
            LF
          </button>
          <button
            type="button"
            className="status-item"
            title="Language mode"
            onClick={() => runWorkbenchCommand('view.commandPalette')}
          >
            <vscode-icon name="code" size={13} />
            <span>{languageLabels[language] ?? language}</span>
          </button>
          <button
            type="button"
            className="status-item"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            onClick={toggleTheme}
          >
            <vscode-icon name={theme === 'dark' ? 'lightbulb' : 'lightbulb-empty'} size={13} />
          </button>
          <button
            type="button"
            className="status-item"
            title="Notifications"
            onClick={() => notify('You are all caught up', 'success')}
          >
            <vscode-icon name="bell" size={13} />
          </button>
          <button
            type="button"
            className="status-item"
            title="Open GitHub repository"
            onClick={() => runWorkbenchCommand('help.github')}
          >
            <vscode-icon name="feedback" size={13} />
          </button>
        </>
      }
    />
  )
}
