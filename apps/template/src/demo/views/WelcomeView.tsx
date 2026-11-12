import { openFileTab } from '../commands/commands'
import { runWorkbenchCommand } from '../commands/registry'
import { workspaceFiles } from '../data/workspace'
import { useWorkbenchStore } from '@workbench-kit/preset-vscode'

interface Walkthrough {
  icon: string
  title: string
  description: string
  path: string
  progress: number
}

const walkthroughs: Walkthrough[] = [
  {
    icon: 'settings-gear',
    title: 'Configure the shell',
    description: 'Toggle regions, reorder activity items, change default sizes.',
    path: 'apps/template/src/app/workbench.config.ts',
    progress: 100,
  },
  {
    icon: 'extensions',
    title: 'Add a view',
    description: 'Create a component and register it in the view registry.',
    path: 'apps/template/src/demo/views/registry.tsx',
    progress: 45,
  },
  {
    icon: 'rocket',
    title: 'Publish the demo',
    description: 'GitHub Actions builds the app and deploys it to Pages.',
    path: '.github/workflows/deploy-pages.yml',
    progress: 20,
  },
]

export function WelcomeView() {
  const notify = useWorkbenchStore((state) => state.notify)
  const recentFiles = workspaceFiles.slice(0, 7)

  return (
    <div className="welcome-view">
      <div className="welcome-inner">
        <header className="welcome-hero">
          <div className="welcome-mark">
            <vscode-icon name="code" size={42} />
          </div>
          <div>
            <h1>Desktop UI Template</h1>
            <p className="welcome-tagline">A VS Code-style workbench, ready to make your own.</p>
            <p className="welcome-copy">
              React 19, TypeScript, Vite and <strong>vscode-elements</strong> web components. Every
              region is config-driven, resizable, keyboard accessible and persisted locally.
            </p>
          </div>
        </header>

        <div className="welcome-columns">
          <section className="welcome-section">
            <h2>Start</h2>
            <div className="welcome-actions">
              <button
                type="button"
                className="welcome-action"
                onClick={() => runWorkbenchCommand('file.new')}
              >
                <vscode-icon name="new-file" size={22} />
                <span>
                  <strong>New File</strong>
                  <small>Open an untitled mock document</small>
                </span>
                <kbd>Ctrl N</kbd>
              </button>
              <button
                type="button"
                className="welcome-action"
                onClick={() => runWorkbenchCommand('view.quickOpen')}
              >
                <vscode-icon name="go-to-file" size={22} />
                <span>
                  <strong>Open File…</strong>
                  <small>Jump to any mock file</small>
                </span>
                <kbd>Ctrl P</kbd>
              </button>
              <button
                type="button"
                className="welcome-action"
                onClick={() => runWorkbenchCommand('go.readme')}
              >
                <vscode-icon name="book" size={22} />
                <span>
                  <strong>Read the template guide</strong>
                  <small>Architecture, customization, deployment</small>
                </span>
              </button>
              <button
                type="button"
                className="welcome-action"
                onClick={() => {
                  runWorkbenchCommand('view.togglePrimary')
                  notify('Try Ctrl+B, Ctrl+J and Ctrl+Alt+B to toggle regions', 'info')
                }}
              >
                <vscode-icon name="layout" size={22} />
                <span>
                  <strong>Play with the layout</strong>
                  <small>Toggle and resize every region</small>
                </span>
              </button>
            </div>
          </section>

          <section className="welcome-section">
            <h2>Walkthroughs</h2>
            <div className="welcome-walkthroughs">
              {walkthroughs.map((walkthrough) => (
                <button
                  type="button"
                  className="welcome-walkthrough"
                  key={walkthrough.path}
                  onClick={() => openFileTab(walkthrough.path)}
                >
                  <div className="walkthrough-icon">
                    <vscode-icon name={walkthrough.icon} size={22} />
                  </div>
                  <div className="walkthrough-body">
                    <strong>{walkthrough.title}</strong>
                    <small>{walkthrough.description}</small>
                    <span className="walkthrough-progress" aria-hidden="true">
                      <span style={{ width: `${walkthrough.progress}%` }} />
                    </span>
                  </div>
                  <vscode-icon name="chevron-right" size={14} />
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="welcome-section welcome-rec-section">
          <div className="welcome-section-heading">
            <h2>Recent</h2>
            <button
              type="button"
              className="text-button"
              onClick={() => runWorkbenchCommand('view.quickOpen')}
            >
              More…
            </button>
          </div>
          <div className="welcome-recent">
            {recentFiles.map((file) => (
              <button
                type="button"
                className="welcome-recent-item"
                key={file.path}
                onClick={() =>
                  file.path === 'README.md'
                    ? runWorkbenchCommand('go.readme')
                    : openFileTab(file.path)
                }
              >
                <vscode-icon
                  name={
                    file.path.endsWith('.md')
                      ? 'markdown'
                      : file.path.endsWith('.css')
                        ? 'symbol-color'
                        : 'file-code'
                  }
                  size={14}
                />
                <span>{file.name}</span>
                <small>{file.path}</small>
              </button>
            ))}
          </div>
        </section>

        <footer className="welcome-footer">
          <span>
            Built with React, Vite and{' '}
            <button
              type="button"
              className="text-button"
              onClick={() => runWorkbenchCommand('help.elements')}
            >
              vscode-elements
            </button>
            .
          </span>
          <span>
            <button
              type="button"
              className="text-button"
              onClick={() => runWorkbenchCommand('help.github')}
            >
              GitHub
            </button>
            {' · '}
            <button
              type="button"
              className="text-button"
              onClick={() => runWorkbenchCommand('help.about')}
            >
              About this template
            </button>
          </span>
        </footer>
      </div>
    </div>
  )
}
