import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Sidebar } from './Sidebar'
import { SecondarySideBar } from './SecondarySideBar'
import { makeConfig, testViews as views } from './component-test-fixtures'
import { useWorkbenchStore } from '../store/workbench-store'

afterEach(cleanup)

beforeEach(() => {
  useWorkbenchStore.setState({
    activePrimaryView: 'alpha',
    activeSecondaryView: 'alpha',
    primarySideBarVisible: true,
    secondarySideBarVisible: true,
  })
})

describe('Sidebar', () => {
  it('renders the active view from the supplied registry', () => {
    useWorkbenchStore.setState({ activePrimaryView: 'beta' })
    render(<Sidebar config={makeConfig()} views={views} run={{ run: () => true }} />)

    expect(screen.getByText('BETA')).toBeInTheDocument()
    expect(screen.getByText('beta body')).toBeInTheDocument()
  })

  it('falls back to the first configured view the registry knows', () => {
    useWorkbenchStore.setState({ activePrimaryView: 'missing' })
    render(
      <Sidebar
        config={makeConfig({
          primarySideBar: { ...makeConfig().primarySideBar, views: ['ghost', 'beta'] },
        })}
        views={views}
        run={{ run: () => true }}
      />,
    )

    expect(screen.getByText('BETA')).toBeInTheDocument()
  })

  it('skips configured ids the registry does not define', () => {
    useWorkbenchStore.setState({ activePrimaryView: 'alpha' })
    render(
      <Sidebar
        config={makeConfig({
          primarySideBar: { ...makeConfig().primarySideBar, views: ['ghost', 'alpha'] },
        })}
        views={views}
        run={{ run: () => true }}
      />,
    )

    expect(screen.getByText('ALPHA')).toBeInTheDocument()
    expect(screen.queryByText('GHOST')).not.toBeInTheDocument()
  })

  it('runs view actions through the supplied command runner', () => {
    const run = { run: vi.fn(() => true) }
    render(<Sidebar config={makeConfig()} views={views} run={run} />)

    fireEvent.click(screen.getByLabelText('Refresh alpha'))
    expect(run.run).toHaveBeenCalledWith('alpha.refresh')
  })
})

describe('SecondarySideBar', () => {
  it('renders the active secondary view with fallback', () => {
    useWorkbenchStore.setState({ activeSecondaryView: 'missing' })
    render(<SecondarySideBar config={makeConfig()} views={views} run={{ run: () => true }} />)

    expect(screen.getByText('ALPHA')).toBeInTheDocument()
    expect(screen.getByLabelText('Close Secondary Side Bar')).toBeInTheDocument()
  })
})
