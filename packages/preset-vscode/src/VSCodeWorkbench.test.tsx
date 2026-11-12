import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { VSCodeWorkbench } from './VSCodeWorkbench'
import { createCommandRegistry, defaultCommands } from './commands/default-commands'
import { createInitialData, seedInitialSession, useWorkbenchStore } from './store/workbench-store'
import type { ViewDefinition, WorkbenchConfig } from './types'

afterEach(cleanup)

const config: WorkbenchConfig = {
  titleBar: {
    enabled: true,
    menuBar: true,
    commandCenter: true,
    layoutControls: true,
    windowControls: false,
  },
  activityBar: {
    enabled: true,
    items: [{ id: 'options', title: 'Options', icon: 'settings-gear' }],
    bottomItems: [],
  },
  primarySideBar: {
    enabled: true,
    initialWidth: 240,
    minWidth: 160,
    maxWidth: 480,
    views: ['options'],
  },
  secondarySideBar: {
    enabled: true,
    initialWidth: 220,
    minWidth: 160,
    maxWidth: 480,
    views: ['details'],
  },
  bottomPanel: {
    enabled: true,
    initialHeight: 200,
    minHeight: 80,
    maxHeight: 400,
    views: ['console'],
  },
  statusBar: { enabled: true },
}

function view(id: string): ViewDefinition {
  return { id, title: id.toUpperCase(), icon: 'file', component: () => <p>{`${id} view`}</p> }
}

const views = {
  primary: { options: view('options') },
  secondary: { details: view('details') },
  panel: { console: view('console') },
}

const commands = createCommandRegistry([
  ...defaultCommands,
  { id: 'test.notify', title: 'Notify', category: 'Test', run: () => undefined },
])

const emptySession = { tabs: [], activeTabId: null, outputLines: ['[test] ready'] }

function reset() {
  useWorkbenchStore.setState(createInitialData())
  localStorage.clear()
}

beforeEach(reset)

describe('VSCodeWorkbench composition', () => {
  it('renders the full workbench from consumer input', () => {
    render(
      <VSCodeWorkbench
        config={config}
        views={views}
        commands={commands}
        menus={[{ id: 'app', label: 'Application', entries: [] }]}
        branding={{ title: 'Acme Workbench', icon: 'rocket' }}
        commandCenterLabel="acme-workspace"
        statusBar={<span>status content</span>}
        initialSession={emptySession}
      />,
    )

    expect(screen.getByLabelText('Primary side bar')).toBeInTheDocument()
    expect(screen.getByLabelText('Secondary side bar')).toBeInTheDocument()
    expect(screen.getByLabelText('Panel')).toBeInTheDocument()
    expect(screen.getByText('status content')).toBeInTheDocument()
    expect(screen.getByLabelText('Acme Workbench')).toBeInTheDocument()
    expect(screen.getByText('acme-workspace')).toBeInTheDocument()
    expect(screen.getByLabelText('Options')).toBeInTheDocument()
  })

  it('omits disabled regions', () => {
    render(
      <VSCodeWorkbench
        config={{
          ...config,
          titleBar: { ...config.titleBar, enabled: false },
          activityBar: { ...config.activityBar, enabled: false },
          bottomPanel: { ...config.bottomPanel, enabled: false },
          statusBar: { enabled: false },
        }}
        views={views}
        commands={commands}
        menus={[]}
        initialSession={emptySession}
      />,
    )

    expect(screen.queryByLabelText('Activity bar')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Panel')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Status bar')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Primary side bar')).toBeInTheDocument()
  })

  it('renders no status bar when the slot is omitted', () => {
    render(
      <VSCodeWorkbench
        config={config}
        views={views}
        commands={commands}
        menus={[]}
        initialSession={emptySession}
      />,
    )

    expect(screen.queryByLabelText('Status bar')).not.toBeInTheDocument()
  })

  it('falls back to the first configured view the registry knows', () => {
    useWorkbenchStore.setState({ activePrimaryView: 'missing' })
    render(
      <VSCodeWorkbench
        config={config}
        views={views}
        commands={commands}
        menus={[]}
        initialSession={emptySession}
      />,
    )

    expect(screen.getByText('OPTIONS')).toBeInTheDocument()
    expect(screen.getByText('options view')).toBeInTheDocument()
  })

  it('renders the closed-tab empty state without demo content', () => {
    render(
      <VSCodeWorkbench
        config={config}
        views={views}
        commands={commands}
        menus={[]}
        initialSession={emptySession}
      />,
    )

    expect(screen.getByText('No editors are open')).toBeInTheDocument()
    expect(screen.queryByText(/Explorer/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Desktop UI Template/)).not.toBeInTheDocument()
  })
})

describe('VSCodeWorkbench session handling', () => {
  it('seeds the supplied first-run session', () => {
    const tabs = [{ id: 'readme', title: 'README.md', kind: 'readme' as const }]
    render(
      <VSCodeWorkbench
        config={config}
        views={views}
        commands={commands}
        menus={[]}
        initialSession={{ tabs, activeTabId: 'readme', outputLines: ['[test] ready'] }}
      />,
    )

    expect(useWorkbenchStore.getState().tabs).toEqual(tabs)
    expect(useWorkbenchStore.getState().activeTabId).toBe('readme')
  })

  it('restores a previously persisted session instead of seeding', async () => {
    localStorage.setItem(
      'desktop-ui-template:v1',
      JSON.stringify({ state: { primarySideBarWidth: 411, theme: 'light' }, version: 1 }),
    )
    await useWorkbenchStore.persist.rehydrate()

    const { container } = render(
      <VSCodeWorkbench
        config={config}
        views={views}
        commands={commands}
        menus={[]}
        initialSession={{
          tabs: [{ id: 'x', title: 'x', kind: 'file' }],
          activeTabId: 'x',
          outputLines: [],
        }}
      />,
    )

    const pane = container.querySelector('.resizable-pane') as HTMLElement | null
    expect(pane?.style.width).toBe('411px')
    expect(useWorkbenchStore.getState().tabs).toEqual([])
  })

  it('keeps a closed-all-tabs session empty after reload', async () => {
    localStorage.setItem(
      'desktop-ui-template:v1',
      JSON.stringify({ state: { tabs: [], activeTabId: null }, version: 1 }),
    )
    await useWorkbenchStore.persist.rehydrate()

    render(
      <VSCodeWorkbench
        config={config}
        views={views}
        commands={commands}
        menus={[]}
        initialSession={{
          tabs: [{ id: 'x', title: 'x', kind: 'file' }],
          activeTabId: 'x',
          outputLines: [],
        }}
      />,
    )

    expect(useWorkbenchStore.getState().tabs).toEqual([])
    expect(screen.getByText('No editors are open')).toBeInTheDocument()
  })

  it('treats an unknown command id as a no-op', () => {
    const registry = createCommandRegistry([
      { id: 'test.only', title: 'Only', category: 'Test', run: () => undefined },
    ])
    render(
      <VSCodeWorkbench
        config={{
          ...config,
          activityBar: {
            ...config.activityBar,
            bottomItems: [
              { id: 'missing', title: 'Missing', icon: 'warning', commandId: 'does.not.exist' },
            ],
          },
        }}
        views={views}
        commands={registry}
        menus={[]}
        initialSession={emptySession}
      />,
    )

    expect(() => fireEvent.click(screen.getByLabelText('Missing'))).not.toThrow()
  })

  it('seeds the same session only once', () => {
    const session = {
      tabs: [{ id: 'readme', title: 'README.md', kind: 'readme' as const }],
      activeTabId: 'readme',
      outputLines: ['[test] ready'],
    }
    expect(seedInitialSession(session)).toBe(true)
    expect(seedInitialSession({ ...session, tabs: [] })).toBe(false)
    expect(useWorkbenchStore.getState().tabs).toEqual(session.tabs)
  })
})
