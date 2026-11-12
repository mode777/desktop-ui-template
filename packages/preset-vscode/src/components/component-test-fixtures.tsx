import type { ViewDefinition, WorkbenchConfig } from '../types'

export function makeConfig(overrides: Partial<WorkbenchConfig> = {}): WorkbenchConfig {
  return {
    titleBar: {
      enabled: true,
      menuBar: true,
      commandCenter: true,
      layoutControls: true,
      windowControls: true,
    },
    activityBar: { enabled: true, items: [], bottomItems: [] },
    primarySideBar: {
      enabled: true,
      initialWidth: 300,
      minWidth: 180,
      maxWidth: 640,
      views: ['alpha'],
    },
    secondarySideBar: {
      enabled: true,
      initialWidth: 330,
      minWidth: 240,
      maxWidth: 640,
      views: ['alpha'],
    },
    bottomPanel: {
      enabled: true,
      initialHeight: 230,
      minHeight: 100,
      maxHeight: 620,
      views: ['alpha'],
    },
    statusBar: { enabled: true },
    ...overrides,
  }
}

export function makeView(id: string): ViewDefinition {
  return {
    id,
    title: id.toUpperCase(),
    icon: 'file',
    component: () => <div>{`${id} body`}</div>,
    actions: [{ icon: 'refresh', label: `Refresh ${id}`, commandId: `${id}.refresh` }],
  }
}

export const testViews = { alpha: makeView('alpha'), beta: makeView('beta') }
