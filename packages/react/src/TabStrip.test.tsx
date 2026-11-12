import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TabStrip, type TabStripItem, type TabStripProps } from './TabStrip'

afterEach(cleanup)

const baseTabs: TabStripItem[] = [
  { id: 'a', title: 'a.ts' },
  { id: 'b', title: 'b.ts' },
  { id: 'c', title: 'c.ts' },
]

const tabFor = (title: string) => screen.getByText(title).closest('.editor-tab') as HTMLElement

const headerFor = (title: string) =>
  screen.getByText(title).closest('vscode-tab-header') as HTMLElement

const middleClick = (element: HTMLElement) =>
  fireEvent(element, new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }))

function renderStrip(overrides: Partial<TabStripProps> = {}) {
  const props: TabStripProps = {
    tabs: baseTabs,
    activeId: 'a',
    onActivate: vi.fn(),
    onClose: vi.fn(),
    onReorder: vi.fn(),
    label: 'Open editors',
    ...overrides,
  }
  return { ...render(<TabStrip {...props} />), props }
}

function ControlledHarness({ onActivate }: { onActivate?: (id: string) => void }) {
  const [activeId, setActiveId] = useState<string | null>('a')
  return (
    <TabStrip
      tabs={baseTabs}
      activeId={activeId}
      onActivate={(id) => {
        onActivate?.(id)
        setActiveId(id)
      }}
      onClose={() => {}}
      onReorder={() => {}}
      label="Open editors"
    />
  )
}

describe('TabStrip controlled selection', () => {
  it('reports a requested selection and follows the consumer update', () => {
    const onActivate = vi.fn()
    render(<ControlledHarness onActivate={onActivate} />)

    fireEvent.click(screen.getByText('b.ts'))

    expect(onActivate).toHaveBeenCalledWith('b')
    expect(tabFor('b.ts')).toHaveClass('is-active')
    expect(tabFor('a.ts')).not.toHaveClass('is-active')
  })

  it('keeps the previous selection when the consumer ignores the request', () => {
    const { props } = renderStrip()

    fireEvent.click(screen.getByText('b.ts'))

    expect(props.onActivate).toHaveBeenCalledWith('b')
    expect(tabFor('a.ts')).toHaveClass('is-active')
    expect(tabFor('b.ts')).not.toHaveClass('is-active')
  })

  it('follows an external active id change', () => {
    const { rerender, props } = renderStrip()

    rerender(<TabStrip {...props} activeId="c" />)

    expect(tabFor('c.ts')).toHaveClass('is-active')
    expect(tabFor('a.ts')).not.toHaveClass('is-active')
  })
})

describe('TabStrip rendering', () => {
  it('renders the icon before the title and marks the active tab', () => {
    renderStrip({
      tabs: [
        {
          id: 'a',
          title: 'a.ts',
          icon: <span slot="content-before">icon</span>,
        },
        { id: 'b', title: 'b.ts' },
      ],
    })

    const header = headerFor('a.ts')
    expect(header.children[0]).toHaveTextContent('icon')
    expect(header.children[0]).toHaveAttribute('slot', 'content-before')
    expect(header.children[1]).toHaveClass('tab-title')
    expect(tabFor('a.ts')).toHaveClass('is-active')
    expect(tabFor('b.ts')).not.toHaveClass('is-active')
  })

  it('shows the dirty close affordance and its label', () => {
    renderStrip({ tabs: [{ id: 'a', title: 'a.ts', dirty: true }] })

    const close = screen.getByRole('button', { name: 'Close a.ts' })

    expect(close).toHaveClass('tab-close', 'is-dirty')
    expect(close).toHaveAttribute('title', 'Unsaved changes — close')
    expect(close.querySelector('.tab-dirty-dot')).not.toBeNull()
  })

  it('renders no close affordance for a non-closable tab', () => {
    renderStrip({ tabs: [{ id: 'a', title: 'a.ts', closable: false }] })

    expect(screen.queryByRole('button', { name: 'Close a.ts' })).not.toBeInTheDocument()
  })
})

describe('TabStrip closing', () => {
  it('reports a close from the close affordance without activating', () => {
    const { props } = renderStrip()

    fireEvent.click(screen.getByRole('button', { name: 'Close a.ts' }))

    expect(props.onClose).toHaveBeenCalledWith('a')
    expect(props.onActivate).not.toHaveBeenCalled()
    expect(screen.getByText('a.ts')).toBeInTheDocument()
  })

  it('reports a middle-click close without activating', () => {
    const { props } = renderStrip()

    middleClick(tabFor('b.ts'))

    expect(props.onClose).toHaveBeenCalledWith('b')
    expect(props.onActivate).not.toHaveBeenCalled()
  })

  it('ignores a middle click on a non-closable tab', () => {
    const { props } = renderStrip({
      tabs: [
        { id: 'a', title: 'a.ts' },
        { id: 'b', title: 'b.ts', closable: false },
      ],
    })

    middleClick(tabFor('b.ts'))

    expect(props.onClose).not.toHaveBeenCalled()
  })
})

function createDataTransfer() {
  const data = new Map<string, string>()
  return {
    effectAllowed: 'none',
    dropEffect: 'none',
    setData: (type: string, value: string) => {
      data.set(type, value)
    },
    getData: (type: string) => data.get(type) ?? '',
  } as unknown as DataTransfer
}

function ClosingHarness({ onClose }: { onClose: (id: string) => void }) {
  const [tabs, setTabs] = useState<TabStripItem[]>(baseTabs)
  const [activeId, setActiveId] = useState<string | null>('b')
  return (
    <TabStrip
      tabs={tabs}
      activeId={activeId}
      label="Open editors"
      onActivate={setActiveId}
      onReorder={() => {}}
      onClose={(id) => {
        onClose(id)
        setTabs((current) => current.filter((tab) => tab.id !== id))
        if (activeId === id) {
          setActiveId(tabs.find((tab) => tab.id !== id)?.id ?? null)
        }
      }}
    />
  )
}

const headers = () => Array.from(document.querySelectorAll('vscode-tab-header')) as HTMLElement[]

/** jsdom does not upgrade the custom element, so make its headers focusable explicitly. */
const makeHeadersFocusable = () => {
  headers().forEach((header) => header.setAttribute('tabindex', '0'))
}

const titles = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.tab-title')).map((title) => title.textContent)

describe('TabStrip dragging', () => {
  it('marks the dragged tab and drop target, then reports the reorder once', () => {
    const { container, props } = renderStrip()
    const dataTransfer = createDataTransfer()

    fireEvent.dragStart(tabFor('a.ts'), { dataTransfer })
    expect(tabFor('a.ts')).toHaveClass('is-dragging')

    fireEvent.dragOver(tabFor('b.ts'), { dataTransfer })
    expect(tabFor('b.ts')).toHaveClass('is-drag-over')

    fireEvent.drop(tabFor('b.ts'), { dataTransfer })

    expect(props.onReorder).toHaveBeenCalledTimes(1)
    expect(props.onReorder).toHaveBeenCalledWith('a', 'b')
    expect(tabFor('a.ts')).not.toHaveClass('is-dragging')
    expect(tabFor('b.ts')).not.toHaveClass('is-drag-over')
    expect(titles(container)).toEqual(['a.ts', 'b.ts', 'c.ts'])
  })

  it('reports nothing when a tab is dropped on itself', () => {
    const { props } = renderStrip()
    const dataTransfer = createDataTransfer()

    fireEvent.dragStart(tabFor('a.ts'), { dataTransfer })
    fireEvent.drop(tabFor('a.ts'), { dataTransfer })

    expect(props.onReorder).not.toHaveBeenCalled()
    expect(tabFor('a.ts')).not.toHaveClass('is-dragging')
  })

  it('clears both markers when the drag ends', () => {
    renderStrip()
    const dataTransfer = createDataTransfer()

    fireEvent.dragStart(tabFor('a.ts'), { dataTransfer })
    fireEvent.dragOver(tabFor('b.ts'), { dataTransfer })
    fireEvent.dragEnd(tabFor('a.ts'), { dataTransfer })

    expect(tabFor('a.ts')).not.toHaveClass('is-dragging')
    expect(tabFor('b.ts')).not.toHaveClass('is-drag-over')
  })
})

describe('TabStrip keyboard navigation', () => {
  it('activates and focuses the adjacent tab with wrap-around', async () => {
    const onActivate = vi.fn()
    const { rerender, props } = renderStrip({ activeId: 'a', onActivate })
    makeHeadersFocusable()

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })
    expect(onActivate).toHaveBeenLastCalledWith('b')
    await vi.waitFor(() => expect(document.activeElement).toBe(headers()[1]))

    rerender(<TabStrip {...props} activeId="c" onActivate={onActivate} />)
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })
    expect(onActivate).toHaveBeenLastCalledWith('a')
    await vi.waitFor(() => expect(document.activeElement).toBe(headers()[0]))
  })

  it('jumps to the first and last tab with Home and End', async () => {
    const onActivate = vi.fn()
    renderStrip({ activeId: 'b', onActivate })
    makeHeadersFocusable()

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'Home' })
    expect(onActivate).toHaveBeenLastCalledWith('a')
    await vi.waitFor(() => expect(document.activeElement).toBe(headers()[0]))

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'End' })
    expect(onActivate).toHaveBeenLastCalledWith('c')
    await vi.waitFor(() => expect(document.activeElement).toBe(headers()[2]))
  })

  it('closes the active tab with Delete and focuses the neighbour', async () => {
    const onClose = vi.fn()
    render(<ClosingHarness onClose={onClose} />)
    makeHeadersFocusable()

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'Delete' })

    expect(onClose).toHaveBeenCalledWith('b')
    expect(screen.queryByText('b.ts')).not.toBeInTheDocument()
    await vi.waitFor(() => expect(document.activeElement).toBe(headers()[0]))
  })

  it('closes the active tab with Backspace', () => {
    const onClose = vi.fn()
    render(<ClosingHarness onClose={onClose} />)

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'Backspace' })

    expect(onClose).toHaveBeenCalledWith('b')
  })

  it('leaves unrelated keys untouched', () => {
    const { props } = renderStrip({ activeId: 'b' })
    makeHeadersFocusable()

    expect(fireEvent.keyDown(screen.getByRole('tablist'), { key: 'a' })).toBe(true)
    expect(props.onActivate).not.toHaveBeenCalled()
    expect(props.onClose).not.toHaveBeenCalled()
  })
})

describe('TabStrip host hooks', () => {
  it('suppresses the native context menu and passes the id and position', () => {
    const onTabContextMenu = vi.fn()
    renderStrip({ onTabContextMenu })

    const notPrevented = fireEvent.contextMenu(tabFor('b.ts'), { clientX: 12, clientY: 34 })

    expect(notPrevented).toBe(false)
    expect(onTabContextMenu).toHaveBeenCalledWith('b', { x: 12, y: 34 })
  })

  it('leaves the native context menu alone without a hook', () => {
    renderStrip()

    expect(fireEvent.contextMenu(tabFor('b.ts'))).toBe(true)
  })

  it('reports double activation with the tab id', () => {
    const onTabDoubleClick = vi.fn()
    renderStrip({ onTabDoubleClick })

    fireEvent.doubleClick(headerFor('b.ts'))

    expect(onTabDoubleClick).toHaveBeenCalledWith('b')
  })

  it('renders the actions slot next to the tab list', () => {
    renderStrip({ actions: <button type="button">More</button> })

    const action = screen.getByRole('button', { name: 'More' })
    expect(action.closest('.editor-tabs-actions')).not.toBeNull()
    expect(action.closest('.editor-tabs-actions')?.previousElementSibling).toHaveClass(
      'editor-tabs-scroll',
    )
  })
})

describe('TabStrip accessibility', () => {
  it('exposes a labelled tab list and marks exactly the active tab selected', () => {
    renderStrip({ activeId: 'b' })

    expect(screen.getByRole('tablist', { name: 'Open editors' })).toBeInTheDocument()
    expect(headerFor('a.ts')).toHaveAttribute('aria-selected', 'false')
    expect(headerFor('b.ts')).toHaveAttribute('aria-selected', 'true')
    expect(headerFor('c.ts')).toHaveAttribute('aria-selected', 'false')
  })
})
