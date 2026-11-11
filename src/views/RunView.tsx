import { runWorkbenchCommand } from '../commands/commands'
import { useWorkbenchStore } from '../store/workbench-store'

const configurations = [
  { name: 'Launch Chrome', detail: 'localhost:5173', icon: 'chrome' },
  { name: 'Attach to Vite', detail: 'port 9229', icon: 'debug-alt' },
  { name: 'Run tests', detail: 'vitest --watch', icon: 'beaker' },
]

export function RunView() {
  const notify = useWorkbenchStore((state) => state.notify)
  const outputLines = useWorkbenchStore((state) => state.outputLines)

  return (
    <div className="run-view">
      <div className="run-hero">
        <vscode-icon name="debug-alt" size={34} />
        <h2>Run and Debug</h2>
        <p>Start a mock debug session, or wire this panel to your own runner.</p>
        <div className="run-actions">
          <vscode-button onClick={() => runWorkbenchCommand('run.start')}>
            <vscode-icon name="play" size={13} slot="content-before" />
            Run and Debug
          </vscode-button>
          <button
            type="button"
            className="text-button"
            onClick={() => notify('launch.json is not part of the template')}
          >
            create a launch.json file
          </button>
        </div>
      </div>

      <section className="run-section">
        <h3>Launch configurations</h3>
        <div className="run-configs">
          {configurations.map((configuration) => (
            <button
              type="button"
              className="run-config"
              key={configuration.name}
              onClick={() => {
                runWorkbenchCommand('run.start')
                notify(`Starting ${configuration.name} (mock)`, 'success')
              }}
            >
              <vscode-icon name={configuration.icon} size={16} />
              <span>
                <strong>{configuration.name}</strong>
                <small>{configuration.detail}</small>
              </span>
              <vscode-icon name="play" size={13} />
            </button>
          ))}
        </div>
      </section>

      <section className="run-section">
        <h3>Recently used</h3>
        <div className="run-output-preview">
          {outputLines.slice(-4).map((line, index) => (
            <div key={`${index}-${line}`}>{line}</div>
          ))}
        </div>
      </section>
    </div>
  )
}
