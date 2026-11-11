import { openFileTab } from '../commands/commands'
import { useWorkbenchStore } from '../store/workbench-store'

const problems = [
  {
    severity: 'error',
    message: "Property 'panelMaximized' does not exist on type 'LayoutConfig'.",
    path: 'src/layout/Workbench.tsx',
    line: 42,
    source: 'ts',
  },
  {
    severity: 'error',
    message: "Cannot find module '../views/registry' or its corresponding type declarations.",
    path: 'src/layout/components/Sidebar.tsx',
    line: 6,
    source: 'ts',
  },
  {
    severity: 'warning',
    message: 'The value of the CSS variable is invalid.',
    path: 'src/styles/tokens.css',
    line: 87,
    source: 'css',
  },
  {
    severity: 'warning',
    message: 'Consider adding an explicit type annotation to this exported constant.',
    path: 'src/commands/commands.ts',
    line: 19,
    source: 'oxlint',
  },
]

export function ProblemsView() {
  const notify = useWorkbenchStore((state) => state.notify)

  return (
    <div className="problems-view">
      <div className="problems-toolbar">
        <span>
          <vscode-icon name="error" size={13} /> 2 errors
        </span>
        <span>
          <vscode-icon name="warning" size={13} /> 1 warning
        </span>
        <button
          type="button"
          className="text-button"
          onClick={() => notify('Problems are filtered to the mock workspace')}
        >
          Filter
        </button>
      </div>
      <div className="problems-list">
        {problems.map((problem) => (
          <button
            type="button"
            className={`problem-row problem-row--${problem.severity}`}
            key={`${problem.path}-${problem.line}`}
            onClick={() => openFileTab(problem.path)}
          >
            <vscode-icon name={problem.severity === 'error' ? 'error' : 'warning'} size={14} />
            <span className="problem-message">{problem.message}</span>
            <span className="problem-source">{problem.source}</span>
            <span className="problem-location">
              {problem.path}:{problem.line}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
