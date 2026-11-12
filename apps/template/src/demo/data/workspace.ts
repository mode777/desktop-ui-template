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
  'apps/template/src/app/workbench.config.ts': `import type { WorkbenchConfig } from '@workbench-kit/preset-vscode'

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
  'packages/preset-vscode/src/VSCodeWorkbench.tsx': `import { useState } from 'react'
import { ResizablePane, WorkbenchShell } from '@workbench-kit/react'
import { seedInitialSession, useWorkbenchStore } from './store/workbench-store'
import type { VSCodeWorkbenchProps } from './VSCodeWorkbench'
import { ActivityBar } from './components/ActivityBar'
import { EditorArea } from './components/EditorArea'
import { Sidebar } from './components/Sidebar'

export function VSCodeWorkbench({
  config,
  views,
  commands,
  statusBar,
  initialSession,
}: VSCodeWorkbenchProps) {
  useState(() => {
    if (initialSession) seedInitialSession(initialSession)
    return true
  })
  const visible = useWorkbenchStore((state) => state.primarySideBarVisible)

  return (
    <WorkbenchShell
      activityBar={<ActivityBar config={config} run={commands} />}
      primarySideBar={
        visible ? (
          <ResizablePane side="left" size={300} min={180} max={640} label="Resize primary side bar">
            <Sidebar config={config} views={views.primary} run={commands} />
          </ResizablePane>
        ) : null
      }
      statusBar={statusBar}
    >
      <EditorArea run={commands} />
    </WorkbenchShell>
  )
}
`,
  'packages/preset-vscode/src/store/workbench-store.ts': `import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { openTabIn, closeTabIn } from '@workbench-kit/core'
import type { WorkbenchData, WorkbenchTab } from './workbench-types'

export const DEFAULT_PRIMARY_SIDE_BAR_WIDTH = 300

export function createInitialData(): WorkbenchData {
  return {
    theme: 'dark',
    tabs: [],
    activeTabId: null,
    // visibility, sizes, active views, output and notifications …
  }
}

export function seedInitialSession(session) {
  if (localStorage.getItem('desktop-ui-template:v1') !== null) return false
  useWorkbenchStore.setState(session)
  return true
}

export const useWorkbenchStore = create<WorkbenchState>()(
  persist(
    (set, get) => ({
      ...createInitialData(),
      openTab: (tab) => set((state) => openTabIn(state, tab)),
      closeTab: (id) => set((state) => closeTabIn(state, id)),
    }),
    { name: 'desktop-ui-template:v1', version: 1 },
  ),
)
`,
  'package.json': `{
  "name": "desktop-ui-template",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "dev": "npm run dev -w @workbench-kit/template-app",
    "build": "npm run build:packages && tsc -b && npm run build -w @workbench-kit/template-app",
    "build:packages": "npm run build -w @workbench-kit/core && …",
    "build:minimal": "npm run build -w @workbench-kit/minimal-app",
    "lint": "oxlint",
    "test": "vitest run",
    "check": "npm run lint && npm run format:check && npm run typecheck && …"
  },
  "dependencies": {
    "@vscode-elements/elements": "^2.5.1",
    "@vscode/codicons": "^0.0.45",
    "react": "^19.3.1",
    "react-dom": "^19.3.1"
  }
}
`,
  'apps/template/src/app/App.tsx': `import { useEffect } from 'react'
import { VSCodeWorkbench, useWorkbenchStore } from '@workbench-kit/preset-vscode'
import { openFileTab } from '../demo/commands/commands'
import { commandRegistry } from '../demo/commands/registry'
import { menuDefinitions } from '../demo/commands/menus'
import { workspaceFiles } from '../demo/data/workspace'
import { panelViews, primaryViews, secondaryViews } from '../demo/views/registry'
import { DocumentView } from '../demo/views/DocumentView'
import { workbenchConfig } from './workbench.config'

export function App() {
  const theme = useWorkbenchStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <VSCodeWorkbench
      config={workbenchConfig}
      views={{ primary: primaryViews, secondary: secondaryViews, panel: panelViews }}
      commands={commandRegistry}
      menus={menuDefinitions}
      quickOpen={{ files: workspaceFiles, openFile: openFileTab }}
      renderDocument={(tab) => <DocumentView tab={tab} />}
    />
  )
}
`,
  'apps/template/src/main.tsx': `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@workbench-kit/elements/all'
import '@workbench-kit/styles-vscode/tokens.css'
import '@workbench-kit/styles-vscode/global.css'
import '@workbench-kit/styles-vscode/workbench.css'
import './demo/styles/demo-views.css'
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

- Keep workbench regions configurable through apps/template/src/app/workbench.config.ts.
- Add sidebar views to apps/template/src/demo/views and register them in apps/template/src/demo/views/registry.tsx.
- Add commands to apps/template/src/demo/commands/commands.ts; menus only reference command IDs.
- Keep packages/preset-vscode free of demo imports; app data arrives through props.
- Use CSS custom properties from packages/styles-vscode/src/tokens.css instead of hard-coded colors.
- Import workspace packages by name; do not reach into packages/*/src by relative path.
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
  'packages/workbench/package.json': `{
  "name": "vscode-workbench",
  "version": "0.1.0",
  "private": false,
  "type": "module",
  "license": "MIT",
  "repository": { "type": "git", "url": "git+https://github.com/mode777/vscode-workbench.git" },
  "homepage": "https://github.com/mode777/vscode-workbench/tree/main/packages/workbench#readme",
  "bugs": { "url": "https://github.com/mode777/vscode-workbench/issues" },
  "publishConfig": { "access": "public" },
  "sideEffects": ["**/*.css", "./dist/elements/*.js", "./dist/preset/elements.js"],
  "files": ["dist", "LICENSE", "THIRD_PARTY_NOTICES.md"],
  "exports": {
    ".": "./dist/preset/index.js",
    "./react": "./dist/react/index.js",
    "./core": "./dist/core/index.js",
    "./elements/icon": "./dist/elements/icon.js",
    "./elements/types": "./dist/elements/global.d.ts",
    "./styles/tokens.css": "./dist/styles/tokens.css",
    "./styles/global.css": "./dist/styles/global.css",
    "./styles/workbench.css": "./dist/styles/workbench.css",
    "./styles/shell.css": "./dist/styles/shell.css"
  },
  "dependencies": { "zustand": "^5.1.0" },
  "peerDependencies": {
    "@vscode-elements/elements": ">=2.5.1 <3",
    "react": ">=19",
    "react-dom": ">=19"
  }
}
`,
  'packages/workbench/README.md': `# vscode-workbench

The single public distribution package. Version 0.1.0, 0.x and browser-only.

| What you need    | Published import                             |
| ---------------- | -------------------------------------------- |
| Full preset      | \`vscode-workbench\`                   |
| Composition      | \`vscode-workbench/react\`             |
| Headless helpers | \`vscode-workbench/core\`              |
| Element tag      | \`vscode-workbench/elements/icon\`     |
| Element typings  | \`vscode-workbench/elements/types\`    |
| Tokens           | \`vscode-workbench/styles/tokens.css\` |
| Component styles | \`vscode-workbench/styles/shell.css\`  |
| All styles       | \`vscode-workbench/styles\`             |

React, React DOM and vscode-elements are peers. Ships LICENSE and
THIRD_PARTY_NOTICES.md alongside dist/.

Docs: [API](../../docs/api.md) · [Migration](../../docs/migration.md) ·
[Eject](../../docs/eject.md) · [Release](../../docs/release.md)

\`\`\`bash
npm run build:facade
npm run pack:check
\`\`\`
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
    folder('packages', 'packages', [
      folder('core', 'packages/core', [
        file('package.json', 'packages/core/package.json'),
        folder('src', 'packages/core/src', [
          file('index.ts', 'packages/core/src/index.ts'),
          folder('layout', 'packages/core/src/layout', [
            file('index.ts', 'packages/core/src/layout/index.ts'),
            file('size.ts', 'packages/core/src/layout/size.ts'),
            file('resize.ts', 'packages/core/src/layout/resize.ts'),
          ]),
          folder('persistence', 'packages/core/src/persistence', [
            file('adapter.ts', 'packages/core/src/persistence/adapter.ts'),
            file('index.ts', 'packages/core/src/persistence/index.ts'),
            file('versioned.ts', 'packages/core/src/persistence/versioned.ts'),
          ]),
          folder('tabs', 'packages/core/src/tabs', [
            file('collection.ts', 'packages/core/src/tabs/collection.ts'),
            file('index.ts', 'packages/core/src/tabs/index.ts'),
            file('types.ts', 'packages/core/src/tabs/types.ts'),
          ]),
        ]),
      ]),
      folder('react', 'packages/react', [
        file('package.json', 'packages/react/package.json'),
        folder('src', 'packages/react/src', [
          file('index.ts', 'packages/react/src/index.ts'),
          file('ActivityBar.tsx', 'packages/react/src/ActivityBar.tsx'),
          file('ContextMenu.tsx', 'packages/react/src/ContextMenu.tsx'),
          file('IconButton.tsx', 'packages/react/src/IconButton.tsx'),
          file('MenuBar.tsx', 'packages/react/src/MenuBar.tsx'),
          file('Panel.tsx', 'packages/react/src/Panel.tsx'),
          file('ResizablePane.tsx', 'packages/react/src/ResizablePane.tsx'),
          file('Sidebar.tsx', 'packages/react/src/Sidebar.tsx'),
          file('StatusBar.tsx', 'packages/react/src/StatusBar.tsx'),
          file('TabStrip.tsx', 'packages/react/src/TabStrip.tsx'),
          file('TitleBar.tsx', 'packages/react/src/TitleBar.tsx'),
          file('WorkbenchShell.tsx', 'packages/react/src/WorkbenchShell.tsx'),
        ]),
      ]),
      folder('elements', 'packages/elements', [
        file('package.json', 'packages/elements/package.json'),
        folder('src', 'packages/elements/src', [
          file('all.ts', 'packages/elements/src/all.ts'),
          file('badge.ts', 'packages/elements/src/badge.ts'),
          file('button.ts', 'packages/elements/src/button.ts'),
          file('collapsible.ts', 'packages/elements/src/collapsible.ts'),
          file('context-menu.ts', 'packages/elements/src/context-menu.ts'),
          file('icon.ts', 'packages/elements/src/icon.ts'),
          file('tab-header.ts', 'packages/elements/src/tab-header.ts'),
          file('tab-panel.ts', 'packages/elements/src/tab-panel.ts'),
          file('tabs.ts', 'packages/elements/src/tabs.ts'),
          file('textarea.ts', 'packages/elements/src/textarea.ts'),
          file('textfield.ts', 'packages/elements/src/textfield.ts'),
          file('tree.ts', 'packages/elements/src/tree.ts'),
          file('global.d.ts', 'packages/elements/src/global.d.ts'),
        ]),
      ]),
      folder('styles-vscode', 'packages/styles-vscode', [
        file('package.json', 'packages/styles-vscode/package.json'),
        folder('src', 'packages/styles-vscode/src', [
          file('index.css', 'packages/styles-vscode/src/index.css'),
          file('tokens.css', 'packages/styles-vscode/src/tokens.css'),
          file('global.css', 'packages/styles-vscode/src/global.css'),
          file('shell.css', 'packages/styles-vscode/src/shell.css'),
          file('title-bar.css', 'packages/styles-vscode/src/title-bar.css'),
          file('menu-bar.css', 'packages/styles-vscode/src/menu-bar.css'),
          file('icon-button.css', 'packages/styles-vscode/src/icon-button.css'),
          file('activity-bar.css', 'packages/styles-vscode/src/activity-bar.css'),
          file('resizable-pane.css', 'packages/styles-vscode/src/resizable-pane.css'),
          file('sidebar.css', 'packages/styles-vscode/src/sidebar.css'),
          file('tab-strip.css', 'packages/styles-vscode/src/tab-strip.css'),
          file('editor-area.css', 'packages/styles-vscode/src/editor-area.css'),
          file('panel.css', 'packages/styles-vscode/src/panel.css'),
          file('status-bar.css', 'packages/styles-vscode/src/status-bar.css'),
          file('quick-open.css', 'packages/styles-vscode/src/quick-open.css'),
          file('context-menu.css', 'packages/styles-vscode/src/context-menu.css'),
          file('notifications.css', 'packages/styles-vscode/src/notifications.css'),
          file('workbench.css', 'packages/styles-vscode/src/workbench.css'),
        ]),
      ]),
      folder('preset-vscode', 'packages/preset-vscode', [
        file('package.json', 'packages/preset-vscode/package.json'),
        folder('src', 'packages/preset-vscode/src', [
          file('VSCodeWorkbench.tsx', 'packages/preset-vscode/src/VSCodeWorkbench.tsx'),
          file('types.ts', 'packages/preset-vscode/src/types.ts'),
          file('index.ts', 'packages/preset-vscode/src/index.ts'),
          file('elements.ts', 'packages/preset-vscode/src/elements.ts'),
          folder('commands', 'packages/preset-vscode/src/commands', [
            file('default-commands.ts', 'packages/preset-vscode/src/commands/default-commands.ts'),
          ]),
          folder('components', 'packages/preset-vscode/src/components', [
            file('ActivityBar.tsx', 'packages/preset-vscode/src/components/ActivityBar.tsx'),
            file('BottomPanel.tsx', 'packages/preset-vscode/src/components/BottomPanel.tsx'),
            file('EditorArea.tsx', 'packages/preset-vscode/src/components/EditorArea.tsx'),
            file('MenuBar.tsx', 'packages/preset-vscode/src/components/MenuBar.tsx'),
            file('Notifications.tsx', 'packages/preset-vscode/src/components/Notifications.tsx'),
            file('QuickOpen.tsx', 'packages/preset-vscode/src/components/QuickOpen.tsx'),
            file(
              'SecondarySideBar.tsx',
              'packages/preset-vscode/src/components/SecondarySideBar.tsx',
            ),
            file('Sidebar.tsx', 'packages/preset-vscode/src/components/Sidebar.tsx'),
            file('TitleBar.tsx', 'packages/preset-vscode/src/components/TitleBar.tsx'),
          ]),
          folder('store', 'packages/preset-vscode/src/store', [
            file('workbench-store.ts', 'packages/preset-vscode/src/store/workbench-store.ts'),
            file('workbench-types.ts', 'packages/preset-vscode/src/store/workbench-types.ts'),
          ]),
        ]),
      ]),
      folder('workbench', 'packages/workbench', [
        file('package.json', 'packages/workbench/package.json'),
        file('README.md', 'packages/workbench/README.md'),
      ]),
    ]),
    folder(
      'apps',
      'apps',
      [
        folder(
          'template',
          'apps/template',
          [
            file('index.html', 'apps/template/index.html'),
            file('package.json', 'apps/template/package.json'),
            file('vite.config.ts', 'apps/template/vite.config.ts'),
            folder(
              'src',
              'apps/template/src',
              [
                folder('app', 'apps/template/src/app', [
                  file('App.tsx', 'apps/template/src/app/App.tsx'),
                  file('workbench.config.ts', 'apps/template/src/app/workbench.config.ts'),
                  file(
                    'use-workbench-hotkeys.ts',
                    'apps/template/src/app/use-workbench-hotkeys.ts',
                  ),
                ]),
                folder('demo', 'apps/template/src/demo', [
                  folder('commands', 'apps/template/src/demo/commands', [
                    file('commands.ts', 'apps/template/src/demo/commands/commands.ts'),
                    file('registry.ts', 'apps/template/src/demo/commands/registry.ts'),
                  ]),
                  folder('data', 'apps/template/src/demo/data', [
                    file('workspace.ts', 'apps/template/src/demo/data/workspace.ts'),
                  ]),
                  folder('views', 'apps/template/src/demo/views', [
                    file('registry.tsx', 'apps/template/src/demo/views/registry.tsx'),
                    file('ExplorerView.tsx', 'apps/template/src/demo/views/ExplorerView.tsx'),
                  ]),
                ]),
                file('vscode-elements.ts', 'apps/template/src/vscode-elements.ts'),
                file('main.tsx', 'apps/template/src/main.tsx'),
              ],
              true,
            ),
          ],
          true,
        ),
        folder(
          'minimal',
          'apps/minimal',
          [
            file('package.json', 'apps/minimal/package.json'),
            file('vite.config.ts', 'apps/minimal/vite.config.ts'),
            folder(
              'src',
              'apps/minimal/src',
              [
                file('App.tsx', 'apps/minimal/src/App.tsx'),
                file('elements.ts', 'apps/minimal/src/elements.ts'),
                file('main.tsx', 'apps/minimal/src/main.tsx'),
              ],
              true,
            ),
          ],
          true,
        ),
        folder(
          'custom-shell',
          'apps/custom-shell',
          [
            file('package.json', 'apps/custom-shell/package.json'),
            file('vite.config.ts', 'apps/custom-shell/vite.config.ts'),
            file('tsconfig.json', 'apps/custom-shell/tsconfig.json'),
            file('README.md', 'apps/custom-shell/README.md'),
            folder(
              'src',
              'apps/custom-shell/src',
              [
                file('App.tsx', 'apps/custom-shell/src/App.tsx'),
                file('App.test.tsx', 'apps/custom-shell/src/App.test.tsx'),
                file('state.ts', 'apps/custom-shell/src/state.ts'),
                file('data.ts', 'apps/custom-shell/src/data.ts'),
                file('elements.ts', 'apps/custom-shell/src/elements.ts'),
                file('main.tsx', 'apps/custom-shell/src/main.tsx'),
                file('custom-shell.css', 'apps/custom-shell/src/custom-shell.css'),
                folder('regions', 'apps/custom-shell/src/regions', [
                  file('TitleBar.tsx', 'apps/custom-shell/src/regions/TitleBar.tsx'),
                  file('ActivityBar.tsx', 'apps/custom-shell/src/regions/ActivityBar.tsx'),
                  file('Sidebar.tsx', 'apps/custom-shell/src/regions/Sidebar.tsx'),
                  file('EditorArea.tsx', 'apps/custom-shell/src/regions/EditorArea.tsx'),
                  file('BottomPanel.tsx', 'apps/custom-shell/src/regions/BottomPanel.tsx'),
                  file(
                    'SecondarySideBar.tsx',
                    'apps/custom-shell/src/regions/SecondarySideBar.tsx',
                  ),
                  file('StatusBar.tsx', 'apps/custom-shell/src/regions/StatusBar.tsx'),
                ]),
              ],
              true,
            ),
          ],
          true,
        ),
      ],
      true,
    ),
    file('AGENTS.md', 'AGENTS.md'),
    file('package.json', 'package.json'),
    file('README.md', 'README.md'),
    file('ROADMAP.md', 'ROADMAP.md'),
    file('boundaries.json', 'boundaries.json'),
    file('tsconfig.json', 'tsconfig.json'),
    file('vitest.config.ts', 'vitest.config.ts'),
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
