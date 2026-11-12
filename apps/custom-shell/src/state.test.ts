import { describe, expect, it } from 'vitest'
import { initialTabs } from './data'
import {
  createInitialState,
  customShellReducer,
  PANEL_MAX,
  PANEL_MIN,
  PRIMARY_MAX,
  PRIMARY_MIN,
  type CustomShellAction,
} from './state'

const run = (...actions: CustomShellAction[]) =>
  actions.reduce(customShellReducer, createInitialState())

describe('customShellReducer', () => {
  it('activates a known tab and ignores an unknown id', () => {
    const activated = run({ type: 'tab/activate', id: 'app' })
    expect(activated.activeTabId).toBe('app')

    const unchanged = customShellReducer(activated, { type: 'tab/activate', id: 'missing' })
    expect(unchanged.activeTabId).toBe('app')
    expect(unchanged.tabs).toHaveLength(4)
  })

  it('closes the active tab and selects the next surviving tab', () => {
    const next = run({ type: 'tab/close', id: 'overview' })

    expect(next.tabs.map((tab) => tab.id)).toEqual(['app', 'styles', 'notes'])
    expect(next.activeTabId).toBe('app')
  })

  it('keeps the active tab when a background tab closes', () => {
    const next = run({ type: 'tab/close', id: 'styles' })

    expect(next.tabs.map((tab) => tab.id)).toEqual(['overview', 'app', 'notes'])
    expect(next.activeTabId).toBe('overview')
  })

  it('reopens a closed tab through the open action', () => {
    const closed = run({ type: 'tab/close', id: 'styles' })
    const reopened = customShellReducer(closed, {
      type: 'tab/open',
      tab: initialTabs[2],
    })

    expect(reopened.tabs.map((tab) => tab.id)).toContain('styles')
    expect(reopened.activeTabId).toBe('styles')
  })

  it('reorders through the core tab transition', () => {
    const next = run({ type: 'tab/reorder', sourceId: 'app', targetId: 'notes' })

    expect(next.tabs.map((tab) => tab.id)).toEqual(['overview', 'styles', 'notes', 'app'])
    expect(next.activeTabId).toBe('overview')
  })

  it('switches the primary activity and toggles it off on a repeated selection', () => {
    const outline = run({ type: 'activity/select', id: 'outline' })
    expect(outline.activityId).toBe('outline')
    expect(outline.primaryVisible).toBe(true)

    const hidden = customShellReducer(outline, { type: 'activity/select', id: 'outline' })
    expect(hidden.activityId).toBe('outline')
    expect(hidden.primaryVisible).toBe(false)

    const restored = customShellReducer(hidden, { type: 'activity/select', id: 'outline' })
    expect(restored.primaryVisible).toBe(true)

    const settings = customShellReducer(restored, { type: 'activity/select', id: 'settings' })
    expect(settings.activityId).toBe('settings')
  })

  it('toggles the secondary sidebar and the primary sidebar independently', () => {
    const secondary = run({ type: 'secondary/toggle' })
    expect(secondary.secondaryVisible).toBe(false)
    expect(secondary.primaryVisible).toBe(true)

    const primary = run({ type: 'primary/toggle' })
    expect(primary.primaryVisible).toBe(false)
    expect(primary.secondaryVisible).toBe(true)
  })

  it('hides and restores the panel without keeping a maximized flag', () => {
    const maximized = run({ type: 'panel/toggle-maximized' })
    expect(maximized.panelMaximized).toBe(true)

    const hidden = customShellReducer(maximized, { type: 'panel/toggle' })
    expect(hidden.panelVisible).toBe(false)
    expect(hidden.panelMaximized).toBe(false)

    const shown = customShellReducer(hidden, { type: 'panel/toggle' })
    expect(shown.panelVisible).toBe(true)
    expect(shown.panelMaximized).toBe(false)
  })

  it('shows the panel when maximizing it while hidden', () => {
    const hidden = run({ type: 'panel/toggle' })
    expect(hidden.panelVisible).toBe(false)

    const maximized = customShellReducer(hidden, { type: 'panel/toggle-maximized' })
    expect(maximized.panelVisible).toBe(true)
    expect(maximized.panelMaximized).toBe(true)

    const restored = customShellReducer(maximized, { type: 'panel/toggle-maximized' })
    expect(restored.panelMaximized).toBe(false)
  })

  it('selects a panel tab', () => {
    const next = run({ type: 'panel/select-tab', id: 'details' })
    expect(next.panelTabId).toBe('details')
  })

  it('clamps consumer-owned region sizes', () => {
    const primary = run(
      { type: 'primary/resize', width: PRIMARY_MIN - 1 },
      { type: 'primary/resize', width: PRIMARY_MAX + 1 },
    )
    expect(primary.primaryWidth).toBe(PRIMARY_MAX)

    const panel = run(
      { type: 'panel/resize', height: PANEL_MIN - 20 },
      { type: 'panel/resize', height: PANEL_MAX + 20 },
    )
    expect(panel.panelHeight).toBe(PANEL_MAX)
  })
})
