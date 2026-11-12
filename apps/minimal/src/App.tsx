import { useState } from 'react'
import { ResizablePane, TabStrip, WorkbenchShell } from '@workbench-kit/react'
import type { TabStripItem } from '@workbench-kit/react'

const tabs: TabStripItem[] = [
  {
    id: 'readme',
    title: 'README.md',
    closable: false,
    icon: <vscode-icon name="markdown" size={14} slot="content-before" />,
  },
]

const sidebarMin = 180
const sidebarMax = 420
const sidebarInitial = 240

export function App() {
  const [activeId, setActiveId] = useState(tabs[0].id)
  const [sidebarWidth, setSidebarWidth] = useState(sidebarInitial)
  const [wordWrap, setWordWrap] = useState(true)
  const [showMinimap, setShowMinimap] = useState(false)
  const [fontSize, setFontSize] = useState('14')
  const [tabSize, setTabSize] = useState('2')

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0]

  return (
    <WorkbenchShell
      primarySideBar={
        <ResizablePane
          side="left"
          size={sidebarWidth}
          min={sidebarMin}
          max={sidebarMax}
          onSizeChange={setSidebarWidth}
          onReset={() => setSidebarWidth(sidebarInitial)}
          label="Resize options sidebar"
        >
          <aside className="minimal-sidebar" aria-label="Options">
            <header className="minimal-sidebar-header">
              <h1>Options</h1>
              <p>Consumer-owned state, no preset store.</p>
            </header>

            <div className="minimal-options">
              <label className="minimal-option">
                <input
                  type="checkbox"
                  checked={wordWrap}
                  onChange={(event) => setWordWrap(event.target.checked)}
                />
                <span>
                  <strong>Word wrap</strong>
                  <small>Soft-wrap long lines in the document area.</small>
                </span>
              </label>

              <label className="minimal-option">
                <input
                  type="checkbox"
                  checked={showMinimap}
                  onChange={(event) => setShowMinimap(event.target.checked)}
                />
                <span>
                  <strong>Minimap</strong>
                  <small>Reserve space for a code overview.</small>
                </span>
              </label>

              <label className="minimal-field">
                <span>Font size</span>
                <select value={fontSize} onChange={(event) => setFontSize(event.target.value)}>
                  <option value="12">12 px</option>
                  <option value="14">14 px</option>
                  <option value="16">16 px</option>
                </select>
              </label>

              <label className="minimal-field">
                <span>Tab size</span>
                <select value={tabSize} onChange={(event) => setTabSize(event.target.value)}>
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                </select>
              </label>
            </div>

            <p className="minimal-sidebar-note">
              Sidebar width: <strong>{sidebarWidth}px</strong>
            </p>
          </aside>
        </ResizablePane>
      }
      statusBar={
        <footer className="statusbar" aria-label="Status bar">
          <div className="statusbar-side">
            <span className="status-item status-item--brand">
              <vscode-icon name="beaker" size={13} />
              <span>Minimal example</span>
            </span>
          </div>
          <div className="statusbar-side statusbar-side--right">
            <span className="status-item">{wordWrap ? 'Wrap: on' : 'Wrap: off'}</span>
            <span className="status-item">Sidebar: {sidebarWidth}px</span>
            <span className="status-item">1 tab</span>
          </div>
        </footer>
      }
    >
      <div className="minimal-editor">
        <TabStrip
          tabs={tabs}
          activeId={activeId}
          onActivate={setActiveId}
          onClose={() => undefined}
          onReorder={() => undefined}
          label="Open tabs"
        />

        <section className="minimal-document" aria-label="Document">
          <p className="minimal-eyebrow">Primitive composition</p>
          <h2>{activeTab.title}</h2>
          <p className="minimal-lede">
            This app uses the workbench shell, a resizable pane and a tab strip directly. It never
            imports the VS Code-style preset, the template application or the demo views.
          </p>

          <dl className="minimal-meta">
            <div>
              <dt>Word wrap</dt>
              <dd>{wordWrap ? 'on' : 'off'}</dd>
            </div>
            <div>
              <dt>Minimap</dt>
              <dd>{showMinimap ? 'shown' : 'hidden'}</dd>
            </div>
            <div>
              <dt>Font size</dt>
              <dd>{fontSize}px</dd>
            </div>
            <div>
              <dt>Tab size</dt>
              <dd>{tabSize} spaces</dd>
            </div>
          </dl>

          <ul className="minimal-checklist">
            <li>One non-closable tab with consumer-owned active state.</li>
            <li>A resizable options sidebar with pointer and keyboard sashes.</li>
            <li>A status bar supplied through the shell&apos;s slot.</li>
            <li>Only the tab header and icon elements registered.</li>
          </ul>
        </section>
      </div>
    </WorkbenchShell>
  )
}
