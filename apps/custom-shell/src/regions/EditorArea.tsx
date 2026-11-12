import { TabStrip, type TabStripItem } from '@workbench-kit/react'
import type { CustomShellTab } from '../data'

interface EditorAreaProps {
  tabs: CustomShellTab[]
  activeTab: CustomShellTab | null
  onActivate: (id: string) => void
  onClose: (id: string) => void
  onReorder: (sourceId: string, targetId: string) => void
  onReopen: () => void
}

function tabItem(tab: CustomShellTab): TabStripItem {
  return {
    id: tab.id,
    title: tab.title,
    icon: <vscode-icon name={tab.icon} size={14} slot="content-before" />,
  }
}

export function EditorArea({
  tabs,
  activeTab,
  onActivate,
  onClose,
  onReorder,
  onReopen,
}: EditorAreaProps) {
  return (
    <section className="editor-area" aria-label="Editor">
      <TabStrip
        tabs={tabs.map(tabItem)}
        activeId={activeTab?.id ?? null}
        onActivate={onActivate}
        onClose={onClose}
        onReorder={onReorder}
        label="Open editors"
      />

      {activeTab ? (
        <>
          <div className="editor-breadcrumbs" aria-label="Breadcrumbs">
            <span className="breadcrumb-segment">
              <vscode-icon name={activeTab.icon} size={13} />
              <span>{activeTab.language}</span>
            </span>
            <span className="breadcrumb-segment">
              <span>{activeTab.title}</span>
            </span>
          </div>

          <div className="editor-content" role="region" aria-label="Document">
            <article className="custom-shell-document">
              <p className="custom-shell-eyebrow">{activeTab.eyebrow}</p>
              <h2>{activeTab.heading}</h2>
              <p className="custom-shell-lede">{activeTab.summary}</p>

              {activeTab.sections.map((section) => (
                <section className="custom-shell-document-section" key={section.title}>
                  <h3>{section.title}</h3>
                  <p>{section.body}</p>
                  {section.items ? (
                    <ul>
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}

              <p className="custom-shell-note">
                This is a composition demo, not a code editor. The document content is mock data
                supplied by the application.
              </p>
            </article>
          </div>
        </>
      ) : (
        <div className="custom-shell-empty" role="status">
          <vscode-icon name="editor-layout" size={40} />
          <h2>No editors are open</h2>
          <p>Reopen the overview to see this example&apos;s composition notes.</p>
          <button type="button" className="custom-shell-primary-action" onClick={onReopen}>
            Reopen Overview
          </button>
        </div>
      )}
    </section>
  )
}
