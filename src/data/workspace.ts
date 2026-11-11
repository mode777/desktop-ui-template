export interface WorkspaceNode {
  name: string
  path: string
  kind: 'folder' | 'file'
  open?: boolean
  children?: WorkspaceNode[]
  language?: string
}

export interface VirtualFile {
  path: string
  name: string
  language: string
  content: string
}

const contents: Record<string, string> = {
  'src/layout/workbench.config.ts': `import type { WorkbenchConfig } from './types'

export const workbenchConfig: WorkbenchConfig = {
  titleBar: {
    enabled: true,
    menuBar: true,
    commandCenter: true,
    layoutControls: true,
    windowControls: true,
  },
  activityBar: {
    enabled: true,
    items: [
      { id: 'explorer', title: 'Explorer', icon: 'files' },
      { id: 'search', title: 'Search', icon: 'search' },
      { id: 'source-control', title: 'Source Control', icon: 'source-control' },
    ],
  },
  primarySideBar: {
    enabled: true,
    initialWidth: 300,
    minWidth: 180,
    maxWidth: 640,
    views: ['explorer', 'search', 'source-control', 'run', 'extensions'],
  },
  secondarySideBar: {
    enabled: true,
    initialWidth: 330,
    minWidth: 240,
    maxWidth: 640,
    views: ['chat'],
  },
  bottomPanel: {
    enabled: true,
    initialHeight: 230,
    minHeight: 100,
    maxHeight: 620,
    views: ['problems', 'output', 'terminal'],
  },
  statusBar: { enabled: true },
}
`,
  'src/layout/Workbench.tsx': `import { ActivityBar } from './components/ActivityBar'
import { BottomPanel } from './components/BottomPanel'
import { EditorArea } from './components/EditorArea'
import { ResizablePane } from './components/ResizablePane'
import { SecondarySideBar } from './components/SecondarySideBar'
import { Sidebar } from './components/Sidebar'
import { StatusBar } from './components/StatusBar'
import { TitleBar } from './components/TitleBar'
import { useWorkbenchHotkeys } from '../hooks/use-workbench-hotkeys'
import { useWorkbenchStore } from '../store/workbench-store'
import { workbenchConfig } from './workbench.config'

export function Workbench() {
  useWorkbenchHotkeys()
  const primaryVisible = useWorkbenchStore((s) => s.primarySideBarVisible)
  const panelVisible = useWorkbenchStore((s) => s.bottomPanelVisible)

  return (
    <div className="workbench">
      <TitleBar config={workbenchConfig} />
      <div className="workbench-body">
        <ActivityBar config={workbenchConfig} />
        {primaryVisible && <Sidebar />}
        <div className="workbench-center">
          <EditorArea />
          {panelVisible && <BottomPanel />}
        </div>
        <SecondarySideBar />
      </div>
      <StatusBar />
    </div>
  )
}
`,
  'src/store/workbench-store.ts': `import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { workbenchConfig } from '../layout/workbench.config'
import type { WorkbenchData, WorkbenchTab } from './workbench-types'

export interface WorkbenchState extends WorkbenchData {
  openTab: (tab: WorkbenchTab) => void
  activateTab: (id: string) => void
  closeTab: (id: string) => void
  togglePrimarySideBar: () => void
  toggleSecondarySideBar: () => void
  toggleBottomPanel: () => void
  resetLayout: () => void
}

export const useWorkbenchStore = create<WorkbenchState>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      openTab: (tab) => set((state) => ({
        tabs: state.tabs.some((t) => t.id === tab.id)
          ? state.tabs
          : [...state.tabs, tab],
        activeTabId: tab.id,
      })),
      activateTab: (id) => set({ activeTabId: id }),
      closeTab: (id) => set((state) => {
        const index = state.tabs.findIndex((tab) => tab.id === id)
        if (index === -1) return state
        const tabs = state.tabs.filter((tab) => tab.id !== id)
        return {
          tabs,
          activeTabId:
            state.activeTabId === id
              ? (tabs[index] ?? tabs[index - 1])?.id ?? null
              : state.activeTabId,
        }
      }),
      togglePrimarySideBar: () =>
        set((state) => ({ primarySideBarVisible: !state.primarySideBarVisible })),
      toggleSecondarySideBar: () =>
        set((state) => ({ secondarySideBarVisible: !state.secondarySideBarVisible })),
      toggleBottomPanel: () =>
        set((state) => ({
          bottomPanelVisible: !state.bottomPanelVisible,
          panelMaximized: state.bottomPanelVisible ? false : state.panelMaximized,
        })),
      resetLayout: () => set(createInitialState()),
    }),
    { name: 'desktop-ui-template', version: 1 },
  ),
)
`,
  'package.json': `{
  "name": "desktop-ui-template",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "test": "vitest run",
    "check": "npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build"
  },
  "dependencies": {
    "@vscode-elements/elements": "^2.5.1",
    "@vscode/codicons": "^0.0.45",
    "react": "^19.3.1",
    "react-dom": "^19.3.1",
    "zustand": "^5.1.0"
  }
}
`,
  'src/app/App.tsx': `import { useEffect } from 'react'
import { Workbench } from '../layout/Workbench'
import { useWorkbenchStore } from '../store/workbench-store'

export function App() {
  const theme = useWorkbenchStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return <Workbench />
}
`,
  'src/main.tsx': `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@vscode-elements/elements'
import './styles/tokens.css'
import './styles/global.css'
import './styles/workbench.css'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`,
  'AGENTS.md': `# AGENTS.md

## Project

Desktop UI Template — a VS Code-style workbench shell built with React,
TypeScript, Vite and vscode-elements.

## Commands

- \`npm run dev\` — start Vite
- \`npm run check\` — lint, format check, typecheck, tests, build
- \`npm run test\` — Vitest
- \`npm run build\` — production build

## Conventions

- Keep workbench regions configurable through src/layout/workbench.config.ts.
- Add new sidebar views to src/views and register them in src/views/registry.tsx.
- Add commands to src/commands/commands.ts; menus only reference command IDs.
- Use CSS custom properties from src/styles/tokens.css instead of hard-coded colors.
- This template intentionally does not include a real code editor.
`,
  'README.md': `# Desktop UI Template

A VS Code-style desktop UI template for React.

- Configurable workbench regions
- Activity bar, primary sidebar, secondary sidebar, panel, status bar
- Tabs with open / close / reorder / context menu
- Resizable panes with persistence
- Built with vscode-elements web components
`,
}

const fallbackContent = (path: string, language: string) => {
  if (language === 'css') {
    return `/* ${path} */
/* Mock document preview. The template does not implement a code editor. */

.mock-document {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--vscode-foreground);
}
`
  }

  if (language === 'json') {
    return `{
  "path": "${path}",
  "mock": true,
  "note": "Replace DocumentView with your own renderer.",
  "layout": ["workbench", "sidebars", "panel", "status-bar"]
}
`
  }

  if (language === 'markdown') {
    return `# ${path}

This is a mock Markdown document.

- The template does not implement a code editor.
- Tabs, breadcrumbs and the status bar use realistic content.
- Replace DocumentView with your own renderer when you add one.
`
  }

  if (language === 'yaml') {
    return `# ${path}
name: desktop-ui-template
template: vs-code
mock: true
regions:
  - activity-bar
  - primary-sidebar
  - editor
  - secondary-sidebar
  - panel
  - status-bar
`
  }

  if (language === 'xml') {
    return `<!-- ${path} -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#181818" />
  <rect x="6" y="7" width="4" height="18" rx="1.4" fill="#0078d4" />
</svg>
`
  }

  if (language === 'html') {
    return `<!-- ${path} -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Desktop UI Template</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`
  }

  return `// ${path}
// Mock document preview
//
// The template does not implement a code editor. This file exists so
// tabs, breadcrumbs, and the status bar have realistic content.
// Replace DocumentView with your own renderer when you add one.

export const template = {
  name: 'desktop-ui-template',
  layout: 'vs-code',
  elements: ['workbench', 'sidebars', 'panel', 'status-bar'],
}
`
}

export function languageForPath(path: string): string {
  if (path.endsWith('.tsx')) return 'typescriptreact'
  if (path.endsWith('.ts')) return 'typescript'
  if (path.endsWith('.css')) return 'css'
  if (path.endsWith('.json')) return 'json'
  if (path.endsWith('.md')) return 'markdown'
  if (path.endsWith('.svg')) return 'xml'
  if (path.endsWith('.yml') || path.endsWith('.yaml')) return 'yaml'
  if (path.endsWith('.html')) return 'html'
  return 'plaintext'
}

const file = (name: string, path: string, open?: boolean): WorkspaceNode => ({
  name,
  path,
  kind: 'file',
  language: languageForPath(path),
  open,
})

const folder = (
  name: string,
  path: string,
  children: WorkspaceNode[],
  open = false,
): WorkspaceNode => ({
  name,
  path,
  kind: 'folder',
  open,
  children,
})

export const workspaceTree: WorkspaceNode = folder(
  'desktop-ui-template',
  '',
  [
    folder('.github', '.github', [
      folder('workflows', '.github/workflows', [
        file('ci.yml', '.github/workflows/ci.yml'),
        file('deploy-pages.yml', '.github/workflows/deploy-pages.yml'),
      ]),
    ]),
    folder('public', 'public', [file('favicon.svg', 'public/favicon.svg')]),
    folder(
      'src',
      'src',
      [
        folder('app', 'src/app', [file('App.tsx', 'src/app/App.tsx')], true),
        folder('commands', 'src/commands', [
          file('commands.ts', 'src/commands/commands.ts'),
          file('menus.ts', 'src/commands/menus.ts'),
        ]),
        folder('components', 'src/components', [
          file('FileTree.tsx', 'src/components/FileTree.tsx'),
          file('IconButton.tsx', 'src/components/IconButton.tsx'),
          file('VsContextMenu.tsx', 'src/components/VsContextMenu.tsx'),
        ]),
        folder('data', 'src/data', [file('workspace.ts', 'src/data/workspace.ts')]),
        folder('hooks', 'src/hooks', [
          file('use-workbench-hotkeys.ts', 'src/hooks/use-workbench-hotkeys.ts'),
        ]),
        folder(
          'layout',
          'src/layout',
          [
            file('workbench.config.ts', 'src/layout/workbench.config.ts'),
            file('types.ts', 'src/layout/types.ts'),
            file('Workbench.tsx', 'src/layout/Workbench.tsx'),
            folder(
              'components',
              'src/layout/components',
              [
                file('ActivityBar.tsx', 'src/layout/components/ActivityBar.tsx'),
                file('BottomPanel.tsx', 'src/layout/components/BottomPanel.tsx'),
                file('EditorArea.tsx', 'src/layout/components/EditorArea.tsx'),
                file('MenuBar.tsx', 'src/layout/components/MenuBar.tsx'),
                file('ResizablePane.tsx', 'src/layout/components/ResizablePane.tsx'),
                file('SecondarySideBar.tsx', 'src/layout/components/SecondarySideBar.tsx'),
                file('Sidebar.tsx', 'src/layout/components/Sidebar.tsx'),
                file('StatusBar.tsx', 'src/layout/components/StatusBar.tsx'),
                file('TitleBar.tsx', 'src/layout/components/TitleBar.tsx'),
              ],
              true,
            ),
          ],
          true,
        ),
        folder('store', 'src/store', [
          file('workbench-store.ts', 'src/store/workbench-store.ts'),
          file('workbench-types.ts', 'src/store/workbench-types.ts'),
        ]),
        folder('styles', 'src/styles', [
          file('global.css', 'src/styles/global.css'),
          file('tokens.css', 'src/styles/tokens.css'),
          file('workbench.css', 'src/styles/workbench.css'),
        ]),
        folder('views', 'src/views', [
          file('registry.tsx', 'src/views/registry.tsx'),
          file('ExplorerView.tsx', 'src/views/ExplorerView.tsx'),
          file('SearchView.tsx', 'src/views/SearchView.tsx'),
          file('SourceControlView.tsx', 'src/views/SourceControlView.tsx'),
          file('ExtensionsView.tsx', 'src/views/ExtensionsView.tsx'),
          file('RunView.tsx', 'src/views/RunView.tsx'),
          file('ChatView.tsx', 'src/views/ChatView.tsx'),
          file('WelcomeView.tsx', 'src/views/WelcomeView.tsx'),
          file('DocumentView.tsx', 'src/views/DocumentView.tsx'),
        ]),
        folder('types', 'src/types', [
          file('vscode-elements.d.ts', 'src/types/vscode-elements.d.ts'),
        ]),
        file('vscode-elements.ts', 'src/vscode-elements.ts'),
        file('main.tsx', 'src/main.tsx'),
      ],
      true,
    ),
    file('AGENTS.md', 'AGENTS.md'),
    file('LICENSE', 'LICENSE'),
    file('index.html', 'index.html'),
    file('opencode.json', 'opencode.json'),
    file('package.json', 'package.json'),
    file('README.md', 'README.md'),
    file('ROADMAP.md', 'ROADMAP.md'),
    file('tsconfig.json', 'tsconfig.json'),
    file('vite.config.ts', 'vite.config.ts'),
  ],
  true,
)

function walk(node: WorkspaceNode, visitor: (node: WorkspaceNode) => void) {
  visitor(node)
  node.children?.forEach((child) => walk(child, visitor))
}

export const workspaceFiles: VirtualFile[] = []

walk(workspaceTree, (node) => {
  if (node.kind !== 'file') return
  const language = languageForPath(node.path)
  workspaceFiles.push({
    path: node.path,
    name: node.name,
    language,
    content: contents[node.path] ?? fallbackContent(node.path, language),
  })
})

export const workspaceFilesByPath = new Map(workspaceFiles.map((entry) => [entry.path, entry]))

export function getFile(path: string): VirtualFile | undefined {
  return workspaceFilesByPath.get(path)
}

export function iconForFile(path: string): string {
  if (path.endsWith('.tsx') || path.endsWith('.ts')) return 'file-code'
  if (path.endsWith('.css')) return 'symbol-color'
  if (path.endsWith('.json')) return 'json'
  if (path.endsWith('.md')) return 'markdown'
  if (path.endsWith('.svg')) return 'file-media'
  if (path.endsWith('.yml') || path.endsWith('.yaml')) return 'settings-gear'
  if (path.endsWith('.html')) return 'code'
  return 'file'
}

export function iconClassForFile(path: string): string {
  if (path.endsWith('.tsx') || path.endsWith('.ts')) return 'file-icon file-icon--ts'
  if (path.endsWith('.css')) return 'file-icon file-icon--css'
  if (path.endsWith('.json')) return 'file-icon file-icon--json'
  if (path.endsWith('.md')) return 'file-icon file-icon--md'
  if (path.endsWith('.yml') || path.endsWith('.yaml')) return 'file-icon file-icon--yml'
  return 'file-icon'
}
