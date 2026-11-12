import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ActivityBar } from './ActivityBar'
import { makeConfig } from './component-test-fixtures'
import { useWorkbenchStore } from '../store/workbench-store'

afterEach(cleanup)

beforeEach(() => {
  useWorkbenchStore.setState({ activePrimaryView: 'alpha', primarySideBarVisible: true })
})

const config = makeConfig({
  activityBar: {
    enabled: true,
    items: [{ id: 'alpha', title: 'Alpha', icon: 'files' }],
    bottomItems: [
      { id: 'settings', title: 'Settings', icon: 'settings-gear', commandId: 'app.settings' },
    ],
  },
})

describe('ActivityBar', () => {
  it('toggles the primary side bar for an activity item', () => {
    render(<ActivityBar config={config} run={{ run: () => true }} />)

    fireEvent.click(screen.getByLabelText('Alpha'))
    expect(useWorkbenchStore.getState().primarySideBarVisible).toBe(false)
  })

  it('runs activity actions through the supplied command runner', () => {
    const run = { run: vi.fn(() => true) }
    render(<ActivityBar config={config} run={run} />)

    fireEvent.click(screen.getByLabelText('Settings'))
    expect(run.run).toHaveBeenCalledWith('app.settings')
  })
})
