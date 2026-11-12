import { runWorkbenchCommand } from '../commands/registry'

export function ReadmeView() {
  return (
    <div className="readme-view">
      <article className="readme-paper">
        <div className="readme-kicker">
          <vscode-icon name="markdown" size={15} />
          Template guide
        </div>
        <h1>Desktop UI Template</h1>
        <p className="readme-lede">
          A configurable VS Code-style workbench built with React 19, TypeScript, Vite and{' '}
          <a href="https://github.com/vscode-elements/elements" target="_blank" rel="noreferrer">
            vscode-elements
          </a>
          . The shell is real; the documents are intentionally mock previews.
        </p>

        <h2>Run it</h2>
        <pre className="readme-code">
          <code>{`npm install
npm run dev
npm run check   # lint, format, typecheck, tests, build`}</code>
        </pre>

        <h2>Layout anatomy</h2>
        <p>
          The shell follows the Visual Studio Code workbench model: a title bar with menus, an
          activity bar, a primary sidebar, an editor area with tabs, an optional secondary sidebar,
          a bottom panel, and a status bar. Every region can be disabled in{' '}
          <button
            type="button"
            className="text-button"
            onClick={() => runWorkbenchCommand('go.welcome')}
          >
            <code>apps/template/src/app/workbench.config.ts</code>
          </button>{' '}
          or toggled at runtime.
        </p>
        <table className="readme-table">
          <thead>
            <tr>
              <th>Region</th>
              <th>Component</th>
              <th>Customize</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Title bar</td>
              <td>
                <code>TitleBar.tsx</code>
              </td>
              <td>Menus, command center, window controls</td>
            </tr>
            <tr>
              <td>Activity bar</td>
              <td>
                <code>ActivityBar.tsx</code>
              </td>
              <td>Items and badges in the config</td>
            </tr>
            <tr>
              <td>Primary sidebar</td>
              <td>
                <code>Sidebar.tsx</code>
              </td>
              <td>
                Views in <code>apps/template/src/demo/views/registry.tsx</code>
              </td>
            </tr>
            <tr>
              <td>Editor area</td>
              <td>
                <code>EditorArea.tsx</code>
              </td>
              <td>Tabs, drag reorder, context menu, document renderer</td>
            </tr>
            <tr>
              <td>Secondary sidebar</td>
              <td>
                <code>SecondarySideBar.tsx</code>
              </td>
              <td>Chat panel or your own inspector</td>
            </tr>
            <tr>
              <td>Bottom panel</td>
              <td>
                <code>BottomPanel.tsx</code>
              </td>
              <td>Problems, output, terminal mocks</td>
            </tr>
            <tr>
              <td>Status bar</td>
              <td>
                <code>StatusBar.tsx</code>
              </td>
              <td>Workspace and document indicators</td>
            </tr>
          </tbody>
        </table>

        <h2>Extension points</h2>
        <ul>
          <li>
            <strong>Add a sidebar view:</strong> create a component in{' '}
            <code>apps/template/src/demo/views</code>, then add it to <code>primaryViews</code> and{' '}
            <code>workbenchConfig.primarySideBar.views</code>.
          </li>
          <li>
            <strong>Add a command:</strong> append it to <code>commandList</code>; menus and the
            command palette pick it up automatically.
          </li>
          <li>
            <strong>Change the layout:</strong> flip <code>enabled</code>, reorder the activity
            items, or change the default and min/max sizes.
          </li>
          <li>
            <strong>Replace the document surface:</strong> swap <code>DocumentView</code> for
            Monaco, CodeMirror, an iframe, or your own renderer.
          </li>
        </ul>

        <h2>Persistence and shortcuts</h2>
        <p>
          Layout, theme, open tabs and panel sizes persist in <code>localStorage</code> under{' '}
          <code>desktop-ui-template:v1</code>. Keyboard shortcuts live in{' '}
          <code>apps/template/src/app/use-workbench-hotkeys.ts</code>.
        </p>
        <pre className="readme-code">
          <code>{`Ctrl+B        toggle primary sidebar
Ctrl+Alt+B    toggle secondary sidebar
Ctrl+J        toggle bottom panel
Ctrl+P        quick open
Ctrl+Shift+P  command palette
Ctrl+W        close editor
Ctrl+Tab      cycle editors`}</code>
        </pre>

        <h2>Deploy</h2>
        <p>
          Pushes to <code>main</code> run the CI workflow and publish <code>dist</code> to GitHub
          Pages. Vite uses a relative <code>base</code>, so the same build also works from a
          subdirectory or an iframe.
        </p>

        <div className="readme-callout">
          <vscode-icon name="lightbulb" size={18} />
          <span>
            This template is a UI skeuomorph, not an editor. There is no Monaco, no real file system
            and no backend. The tree, tabs and chat are realistic mock surfaces designed to be
            replaced.
          </span>
        </div>
      </article>
    </div>
  )
}
