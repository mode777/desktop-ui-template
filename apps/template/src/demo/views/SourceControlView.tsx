import { useState, type FormEvent } from 'react'
import { openFileTab } from '../commands/commands'
import { runWorkbenchCommand } from '../commands/registry'
import { useWorkbenchStore } from '@workbench-kit/preset-vscode'

const changes = [
  {
    path: 'packages/preset-vscode/src/VSCodeWorkbench.tsx',
    status: 'M',
    additions: 12,
    deletions: 4,
  },
  { path: 'apps/template/src/demo/views/registry.tsx', status: 'M', additions: 6, deletions: 0 },
  { path: '.github/workflows/deploy-pages.yml', status: 'A', additions: 42, deletions: 0 },
]

export function SourceControlView() {
  const [message, setMessage] = useState('')
  const notify = useWorkbenchStore((state) => state.notify)

  const commit = () => {
    if (!message.trim()) {
      notify('Write a commit message first', 'warning')
      return
    }
    runWorkbenchCommand('scm.commit')
    setMessage('')
  }

  return (
    <div className="scm-view">
      <div className="scm-commit">
        <vscode-textarea
          rows={3}
          resize="none"
          placeholder={`Message (Ctrl+Enter to commit on 'main')`}
          value={message}
          onInput={(event: FormEvent<HTMLElement>) => {
            setMessage((event.target as HTMLElement & { value: string }).value)
          }}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault()
              commit()
            }
          }}
        />
        <div className="scm-commit-actions">
          <vscode-button onClick={commit} disabled={!message.trim()}>
            Commit
          </vscode-button>
          <span className="scm-branch">
            <vscode-icon name="git-branch" size={13} /> main
          </span>
        </div>
      </div>

      <vscode-collapsible heading="Changes" description={`${changes.length}`} open>
        <div className="scm-changes">
          {changes.map((change) => (
            <button
              type="button"
              className="scm-file"
              key={change.path}
              onClick={() => openFileTab(change.path)}
              title={change.path}
            >
              <vscode-icon name="file-code" size={14} />
              <span className="scm-file-name">{change.path.split('/').at(-1)}</span>
              <span className="scm-file-path">{change.path.split('/').slice(0, -1).join('/')}</span>
              <span className={`scm-status scm-status--${change.status.toLowerCase()}`}>
                {change.status}
              </span>
              <span className="scm-diff">
                <span className="scm-add">+{change.additions}</span>
                <span className="scm-del">−{change.deletions}</span>
              </span>
            </button>
          ))}
        </div>
      </vscode-collapsible>

      <vscode-collapsible heading="Stashes" description="0">
        <div className="view-empty view-empty--compact">
          <p>No stashes.</p>
        </div>
      </vscode-collapsible>

      <div className="scm-graph-hint">
        <vscode-icon name="git-commit" size={16} />
        <div>
          <strong>Git graph</strong>
          <p>Source control is a mock surface in this template.</p>
        </div>
      </div>
    </div>
  )
}
