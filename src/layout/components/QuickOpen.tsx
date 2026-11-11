import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { commandList, openFileTab } from '../../commands/commands'
import { iconClassForFile, iconForFile, workspaceFiles } from '../../data/workspace'
import { useWorkbenchStore } from '../../store/workbench-store'

interface QuickOpenResult {
  id: string
  label: string
  detail: string
  icon: string
  iconClass?: string
  keybinding?: string
  run: () => void
}

export function QuickOpen() {
  const open = useWorkbenchStore((state) => state.quickOpenOpen)
  const mode = useWorkbenchStore((state) => state.quickOpenMode)
  if (!open) return null
  return <QuickOpenDialog key={mode} mode={mode} />
}

function QuickOpenDialog({ mode }: { mode: 'files' | 'commands' }) {
  const setQuickOpen = useWorkbenchStore((state) => state.setQuickOpen)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLElement | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      inputRef.current?.shadowRoot?.querySelector('input')?.focus()
    })
    return () => cancelAnimationFrame(handle)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setQuickOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setQuickOpen])

  const results = useMemo<QuickOpenResult[]>(() => {
    const needle = query.trim().toLowerCase()

    if (mode === 'commands') {
      return commandList
        .filter((command) => `${command.category} ${command.title}`.toLowerCase().includes(needle))
        .slice(0, 40)
        .map((command) => ({
          id: command.id,
          label: command.title,
          detail: command.category,
          icon: 'chevron-right',
          keybinding: command.keybinding,
          run: command.run,
        }))
    }

    return workspaceFiles
      .filter((file) => `${file.name} ${file.path}`.toLowerCase().includes(needle))
      .slice(0, 40)
      .map((file) => ({
        id: file.path,
        label: file.name,
        detail: file.path,
        icon: iconForFile(file.path),
        iconClass: iconClassForFile(file.path),
        run: () => openFileTab(file.path),
      }))
  }, [mode, query])

  const activeIndex = results.length === 0 ? 0 : Math.min(selectedIndex, results.length - 1)

  useEffect(() => {
    const selected = listRef.current?.querySelector<HTMLElement>(
      `[data-result-index="${activeIndex}"]`,
    )
    selected?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const choose = (index: number) => {
    const result = results[index]
    if (!result) return
    setQuickOpen(false)
    result.run()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex(results.length === 0 ? 0 : (activeIndex + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex(
        results.length === 0 ? 0 : (activeIndex - 1 + results.length) % results.length,
      )
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(activeIndex)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setQuickOpen(false)
    }
  }

  return (
    <div className="quick-open-overlay" onMouseDown={() => setQuickOpen(false)}>
      <div
        className="quick-open"
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'commands' ? 'Command palette' : 'Quick open'}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="quick-open-input">
          <vscode-textfield
            ref={(element) => {
              inputRef.current = element
            }}
            value={query}
            placeholder={mode === 'commands' ? 'Type a command…' : 'Search files by name…'}
            aria-label={mode === 'commands' ? 'Command name' : 'File name'}
            onInput={(event) => {
              setQuery((event.target as HTMLElement & { value: string }).value)
              setSelectedIndex(0)
            }}
          >
            <vscode-icon
              slot="content-before"
              name={mode === 'commands' ? 'chevron-right' : 'search'}
              size={14}
            />
          </vscode-textfield>
        </div>

        <div className="quick-open-list" ref={listRef} role="listbox">
          {results.length === 0 ? (
            <div className="quick-open-empty">
              No matching {mode === 'commands' ? 'commands' : 'files'}.
            </div>
          ) : (
            results.map((result, index) => (
              <button
                type="button"
                key={`${result.id}-${index}`}
                data-result-index={index}
                className={`quick-open-item ${index === activeIndex ? 'is-selected' : ''}`}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => choose(index)}
                role="option"
                aria-selected={index === activeIndex}
              >
                <vscode-icon name={result.icon} size={15} className={result.iconClass} />
                <span className="quick-open-label">{result.label}</span>
                <span className="quick-open-detail">{result.detail}</span>
                {result.keybinding ? (
                  <span className="quick-open-keybinding">{result.keybinding}</span>
                ) : null}
              </button>
            ))
          )}
        </div>

        <div className="quick-open-footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>Enter</kbd> open
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
          <span className="quick-open-mode">{mode === 'commands' ? 'Commands' : 'Files'}</span>
        </div>
      </div>
    </div>
  )
}
