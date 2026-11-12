import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BottomPanel } from './BottomPanel'
import { makeConfig, testViews as views } from './component-test-fixtures'
import { useWorkbenchStore } from '../store/workbench-store'

afterEach(cleanup)

beforeEach(() => {
  useWorkbenchStore.setState({
    activePanelView: 'alpha',
    bottomPanelVisible: true,
    panelMaximized: false,
  })
})

describe('BottomPanel', () => {
  it('renders tabs in configuration order and skips unknown ids', () => {
    const config = makeConfig({
      bottomPanel: { ...makeConfig().bottomPanel, views: ['beta', 'ghost', 'alpha'] },
    })
    const { container } = render(
      <BottomPanel config={config} views={views} run={{ run: () => true }} />,
    )

    const headers = [...container.querySelectorAll('vscode-tab-header')].map(
      (header) => header.textContent,
    )
    expect(headers).toEqual(['BETA', 'ALPHA'])
  })

  it('switches the active view when a tab is selected', () => {
    const config = makeConfig({
      bottomPanel: { ...makeConfig().bottomPanel, views: ['alpha', 'beta'] },
    })
    const { container } = render(
      <BottomPanel config={config} views={views} run={{ run: () => true }} />,
    )

    const tabs = container.querySelector('vscode-tabs') as HTMLElement
    fireEvent(tabs, new CustomEvent('vsc-tabs-select', { detail: { selectedIndex: 1 } }))

    expect(useWorkbenchStore.getState().activePanelView).toBe('beta')
  })

  it('runs the panel commands through the supplied runner', () => {
    const run = { run: vi.fn(() => true) }
    const { container } = render(<BottomPanel config={makeConfig()} views={views} run={run} />)

    fireEvent.click(container.querySelector('vscode-icon[label="Close Panel"]') as HTMLElement)
    fireEvent.click(
      container.querySelector('vscode-icon[label="Maximize Panel Size"]') as HTMLElement,
    )

    expect(run.run).toHaveBeenCalledWith('view.togglePanel')
    expect(run.run).toHaveBeenCalledWith('view.togglePanelMaximized')
  })
})
