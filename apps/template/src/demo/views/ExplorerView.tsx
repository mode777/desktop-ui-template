import { FileTree } from '../components/FileTree'

const outlineSymbols = [
  { icon: 'symbol-class', label: 'Workbench', detail: 'function' },
  { icon: 'symbol-method', label: 'useWorkbenchHotkeys', detail: 'function' },
  { icon: 'symbol-variable', label: 'workbenchConfig', detail: 'const' },
  { icon: 'symbol-interface', label: 'WorkbenchConfig', detail: 'interface' },
]

export function ExplorerView() {
  return (
    <div className="explorer-view">
      <div className="explorer-tree">
        <FileTree />
      </div>

      <div className="explorer-bottom">
        <vscode-collapsible heading="Outline" description={`${outlineSymbols.length} symbols`}>
          <ul className="mini-list">
            {outlineSymbols.map((symbol) => (
              <li key={symbol.label}>
                <vscode-icon name={symbol.icon} size={14} />
                <span>{symbol.label}</span>
                <small>{symbol.detail}</small>
              </li>
            ))}
          </ul>
        </vscode-collapsible>
        <vscode-collapsible heading="Timeline">
          <ul className="mini-list">
            <li>
              <vscode-icon name="history" size={14} />
              <span>Workbench shell</span>
              <small>2 hours ago</small>
            </li>
            <li>
              <vscode-icon name="git-commit" size={14} />
              <span>Initial commit</span>
              <small>yesterday</small>
            </li>
          </ul>
        </vscode-collapsible>
      </div>
    </div>
  )
}
