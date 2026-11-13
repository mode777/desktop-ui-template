import type { WorkbenchTab } from '@workbench-kit/preset-vscode'

export const WELCOME_TAB: WorkbenchTab = {
  id: 'welcome',
  title: 'Welcome',
  kind: 'welcome',
}

export const README_TAB: WorkbenchTab = {
  id: 'readme',
  title: 'README.md',
  kind: 'readme',
  path: 'README.md',
  language: 'markdown',
}

const CONFIG_TAB: WorkbenchTab = {
  id: 'file:apps/template/src/app/workbench.config.ts',
  title: 'workbench.config.ts',
  kind: 'file',
  path: 'apps/template/src/app/workbench.config.ts',
  language: 'typescript',
}

export function createInitialTabs(): WorkbenchTab[] {
  return [WELCOME_TAB, CONFIG_TAB, README_TAB]
}

export function createInitialOutputLines(): string[] {
  return [
    '[info] vscode-workbench 0.1.3',
    '[info] Workbench shell initialized',
    '[info] vscode-elements registered',
    '[info] Waiting for a task…',
  ]
}
