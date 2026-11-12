import { useMemo, useState, type FormEvent } from 'react'
import { useWorkbenchStore } from '@workbench-kit/preset-vscode'

const extensions = [
  {
    icon: 'symbol-color',
    name: 'Theme Studio',
    publisher: 'desktop-ui',
    description: 'Preview and switch color tokens without leaving the workbench.',
    installs: '12.4k',
    installed: true,
  },
  {
    icon: 'markdown',
    name: 'Markdown Preview',
    publisher: 'template-labs',
    description: 'Render the mock README as a formatted document.',
    installs: '8.1k',
    installed: true,
  },
  {
    icon: 'terminal',
    name: 'Terminal Profiles',
    publisher: 'shell-tools',
    description: 'Add PowerShell, zsh and fish profiles to the panel.',
    installs: '4.9k',
    installed: false,
  },
  {
    icon: 'sparkle',
    name: 'Agent Chat',
    publisher: 'desktop-ui',
    description: 'A ready-made chat surface for the secondary sidebar.',
    installs: '21.7k',
    installed: true,
  },
  {
    icon: 'layout',
    name: 'Layout Presets',
    publisher: 'workbench',
    description: 'Save and restore named arrangements of every region.',
    installs: '3.2k',
    installed: false,
  },
]

export function ExtensionsView() {
  const [query, setQuery] = useState('')
  const notify = useWorkbenchStore((state) => state.notify)
  const filtered = useMemo(
    () =>
      extensions.filter((extension) =>
        `${extension.name} ${extension.publisher} ${extension.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  )

  return (
    <div className="extensions-view">
      <div className="search-input-row">
        <vscode-textfield
          value={query}
          placeholder="Search Extensions in Marketplace"
          aria-label="Search extensions"
          onInput={(event: FormEvent<HTMLElement>) => {
            setQuery((event.target as HTMLElement & { value: string }).value)
          }}
        >
          <vscode-icon slot="content-before" name="extensions" size={14} />
        </vscode-textfield>
      </div>

      <div className="extensions-meta">
        <span>{filtered.length} results</span>
        <span className="extensions-installed-label">Installed</span>
      </div>

      <div className="extensions-list">
        {filtered.map((extension) => (
          <article className="extension-card" key={extension.name}>
            <div className="extension-icon">
              <vscode-icon name={extension.icon} size={26} />
            </div>
            <div className="extension-body">
              <div className="extension-title">
                <strong>{extension.name}</strong>
                <span>{extension.installs} installs</span>
              </div>
              <p>{extension.description}</p>
              <div className="extension-footer">
                <span>{extension.publisher}</span>
                {extension.installed ? (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => notify(`${extension.name} is already installed`)}
                  >
                    Installed
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-button text-button--accent"
                    onClick={() => notify(`Installing ${extension.name} (mock)`, 'success')}
                  >
                    Install
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
