import { getFile } from '../data/workspace'
import type { WorkbenchTab } from '../store/workbench-types'
import { CodePreview } from './CodePreview'
import { ReadmeView } from './ReadmeView'
import { WelcomeView } from './WelcomeView'

interface DocumentViewProps {
  tab: WorkbenchTab
}

export function DocumentView({ tab }: DocumentViewProps) {
  if (tab.kind === 'welcome') return <WelcomeView />
  if (tab.kind === 'readme') return <ReadmeView />

  if (tab.kind === 'untitled') {
    return (
      <div className="untitled-document">
        <vscode-icon name="edit" size={36} />
        <h2>{tab.title}</h2>
        <p>
          This is an empty document. The template deliberately stops at the workbench shell — plug
          in Monaco, CodeMirror, or your own document surface here.
        </p>
      </div>
    )
  }

  const file = tab.path ? getFile(tab.path) : undefined
  if (!file) {
    return (
      <div className="untitled-document">
        <vscode-icon name="warning" size={32} />
        <h2>File not found</h2>
        <p>{tab.path ?? tab.title}</p>
      </div>
    )
  }

  return (
    <div className="document-view">
      <CodePreview content={file.content} language={file.language} />
    </div>
  )
}
