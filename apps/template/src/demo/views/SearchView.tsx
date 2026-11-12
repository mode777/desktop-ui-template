import { useMemo, useState, type FormEvent } from 'react'
import { openFileTab } from '../commands/commands'
import { workspaceFiles } from '../data/workspace'
import { IconButton } from '@workbench-kit/react'

export function SearchView() {
  const [query, setQuery] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [useRegex, setUseRegex] = useState(false)

  const results = useMemo(() => {
    const needle = query.trim()
    if (!needle) return []

    let matcher: (value: string) => boolean
    try {
      const expression = useRegex ? new RegExp(needle, caseSensitive ? '' : 'i') : null
      matcher = (value) =>
        expression
          ? expression.test(value)
          : caseSensitive
            ? value.includes(needle)
            : value.toLowerCase().includes(needle.toLowerCase())
    } catch {
      return []
    }

    return workspaceFiles
      .filter((file) => matcher(file.content) || matcher(file.path))
      .slice(0, 20)
      .map((file) => ({
        ...file,
        matches: Math.max(1, file.content.split(needle).length - 1),
      }))
  }, [caseSensitive, query, useRegex])

  return (
    <div className="search-view">
      <div className="search-input-row">
        <vscode-textfield
          value={query}
          placeholder="Search"
          aria-label="Search workspace"
          onInput={(event: FormEvent<HTMLElement>) => {
            setQuery((event.target as HTMLElement & { value: string }).value)
          }}
        >
          <vscode-icon slot="content-before" name="search" size={14} />
        </vscode-textfield>
      </div>
      <div className="search-options">
        <IconButton
          icon="case-sensitive"
          label="Match Case"
          variant="toolbar"
          active={caseSensitive}
          onClick={() => setCaseSensitive((value) => !value)}
        />
        <IconButton
          icon="regex"
          label="Use Regular Expression"
          variant="toolbar"
          active={useRegex}
          onClick={() => setUseRegex((value) => !value)}
        />
        <span className="search-hint">
          {query ? `${results.length} files` : 'Search the mock workspace'}
        </span>
      </div>

      <div className="search-results">
        {!query.trim() ? (
          <div className="view-empty">
            <vscode-icon name="search" size={30} />
            <p>Type to search across {workspaceFiles.length} mock files.</p>
            <small>Results are generated from the template's in-memory file list.</small>
          </div>
        ) : results.length === 0 ? (
          <div className="view-empty">
            <vscode-icon name="search-stop" size={30} />
            <p>No results found.</p>
            <small>Try “workbench”, “layout”, or “terminal”.</small>
          </div>
        ) : (
          results.map((file) => (
            <button
              type="button"
              className="search-result"
              key={file.path}
              onClick={() => openFileTab(file.path)}
            >
              <vscode-icon name="file-code" size={14} />
              <span className="search-result-name">{file.name}</span>
              <span className="search-result-path">{file.path}</span>
              <span className="search-result-count">{file.matches}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
