import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContextMenu, type ContextMenuItem, type ContextMenuProps } from './ContextMenu'

afterEach(cleanup)

const items: ContextMenuItem[] = [
  { label: 'Close', value: 'close', keybinding: 'Ctrl+W' },
  { separator: true },
  { label: 'Copy Path', value: 'copy-path' },
]

function renderContextMenu(overrides: Partial<ContextMenuProps> = {}) {
  const props: ContextMenuProps = {
    open: true,
    x: 40,
    y: 30,
    items,
    onSelect: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  }
  return { ...render(<ContextMenu {...props} />), props }
}

const contextMenuElement = () => document.querySelector('vscode-context-menu') as HTMLElement

describe('ContextMenu rendering', () => {
  it('renders nothing while closed', () => {
    renderContextMenu({ open: false })

    expect(contextMenuElement()).toBeNull()
  })

  it('renders the supplied entries into the element', () => {
    renderContextMenu()

    const menu = contextMenuElement() as HTMLElement & { data: ContextMenuItem[] }
    expect(menu).not.toBeNull()
    expect(menu.data).toEqual(items)
    expect(document.querySelector('.context-menu-positioner')).toHaveStyle({
      left: '40px',
      top: '30px',
    })
  })

  it('clamps the portal position to the viewport', () => {
    renderContextMenu({ x: 5000, y: 5000 })

    const positioner = document.querySelector('.context-menu-positioner') as HTMLElement
    expect(positioner.style.left).toBe(`${window.innerWidth - 290}px`)
    expect(positioner.style.top).toBe(`${window.innerHeight - 360}px`)
  })
})

describe('ContextMenu interaction', () => {
  it('reports a selected value and closes', () => {
    const { props } = renderContextMenu()

    fireEvent(
      contextMenuElement(),
      new CustomEvent('vsc-context-menu-select', { detail: { value: 'close' } }),
    )

    expect(props.onSelect).toHaveBeenCalledWith('close')
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on an outside pointer down', () => {
    const { props } = renderContextMenu()

    fireEvent.mouseDown(document.body)

    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('ignores pointer downs inside the ignored selector', () => {
    const { props } = renderContextMenu({ ignoreSelector: '.keep-open' })
    render(
      <button type="button" className="keep-open">
        Keep open
      </button>,
    )

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Keep open' }))

    expect(props.onClose).not.toHaveBeenCalled()
  })
})
