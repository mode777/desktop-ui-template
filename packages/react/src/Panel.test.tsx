import { cleanup, fireEvent, render } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Panel, type PanelProps, type PanelTab } from './Panel'

afterEach(cleanup)

const tabs: PanelTab[] = [
  { id: 'problems', title: 'Problems', badge: 2, content: <p>Problems content</p> },
  { id: 'output', title: 'Output', content: <p>Output content</p> },
]

function renderPanel(overrides: Partial<PanelProps> = {}) {
  const props: PanelProps = {
    tabs,
    activeId: 'problems',
    onSelect: vi.fn(),
    ...overrides,
  }
  return { ...render(<Panel {...props} />), props }
}

function ControlledHarness({ onSelect }: { onSelect?: (id: string) => void }) {
  const [activeId, setActiveId] = useState<string | null>('problems')
  return (
    <Panel
      tabs={tabs}
      activeId={activeId}
      onSelect={(id) => {
        onSelect?.(id)
        setActiveId(id)
      }}
    />
  )
}

const tabsElement = (container: HTMLElement) =>
  container.querySelector('vscode-tabs') as HTMLElement

const selectTab = (container: HTMLElement, selectedIndex: number) => {
  fireEvent(
    tabsElement(container),
    new CustomEvent('vsc-tabs-select', { detail: { selectedIndex } }),
  )
}

describe('Panel controlled selection', () => {
  it('renders tabs in order and marks the active tab as selected', () => {
    const { container } = renderPanel()

    const headers = [...container.querySelectorAll('vscode-tab-header')].map(
      (header) => header.textContent,
    )
    expect(headers).toEqual(['Problems2', 'Output'])
    expect(tabsElement(container).getAttribute('selected-index')).toBe('0')
  })

  it('reports a selection and follows the consumer update', () => {
    const onSelect = vi.fn()
    const { container } = render(<ControlledHarness onSelect={onSelect} />)

    selectTab(container, 1)

    expect(onSelect).toHaveBeenCalledWith('output')
    expect(tabsElement(container).getAttribute('selected-index')).toBe('1')
  })

  it('keeps the previous selection when the consumer ignores the request', () => {
    const { container, props } = renderPanel()

    selectTab(container, 1)

    expect(props.onSelect).toHaveBeenCalledWith('output')
    expect(tabsElement(container).getAttribute('selected-index')).toBe('0')
  })

  it('follows an external active id change', () => {
    const { container, rerender, props } = renderPanel()

    rerender(<Panel {...props} activeId="output" />)

    expect(tabsElement(container).getAttribute('selected-index')).toBe('1')
  })

  it('renders every tab when the active id matches none', () => {
    const { container } = renderPanel({ activeId: 'missing' })

    expect(container.querySelectorAll('vscode-tab-header')).toHaveLength(2)
    expect(tabsElement(container).getAttribute('selected-index')).toBe('0')
  })
})

describe('Panel content and chrome', () => {
  it('renders each tab badge and per-tab content', () => {
    const { container } = renderPanel()

    expect(container.querySelector('vscode-badge[slot="content-after"]')).toHaveTextContent('2')
    const panels = [...container.querySelectorAll('vscode-tab-panel')]
    expect(panels[0]).toHaveTextContent('Problems content')
    expect(panels[1]).toHaveTextContent('Output content')
  })

  it('reports maximize and close requests', () => {
    const onToggleMaximized = vi.fn()
    const onClose = vi.fn()
    const { container } = renderPanel({ onToggleMaximized, onClose })

    fireEvent.click(container.querySelector('vscode-icon[label="Maximize Panel Size"]') as Element)
    fireEvent.click(container.querySelector('vscode-icon[label="Close Panel"]') as Element)

    expect(onToggleMaximized).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('reflects the maximized state in the control label', () => {
    const { container } = renderPanel({ maximized: true, onToggleMaximized: vi.fn() })

    expect(container.querySelector('vscode-icon[label="Restore Panel Size"]')).not.toBeNull()
    expect(container.querySelector('vscode-icon[label="Maximize Panel Size"]')).toBeNull()
  })

  it('omits panel controls when no callbacks are supplied', () => {
    const { container } = renderPanel()

    expect(container.querySelectorAll('vscode-tabs > vscode-icon[slot="addons"]')).toHaveLength(0)
  })
})
