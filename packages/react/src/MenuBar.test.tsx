import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MenuBar, type MenuBarMenu, type MenuBarProps } from './MenuBar'

afterEach(cleanup)

const menus: MenuBarMenu[] = [
  {
    id: 'first',
    label: 'First',
    entries: [{ label: 'One', commandId: 'test.one', keybinding: 'Ctrl+1' }],
  },
  { id: 'second', label: 'Second', entries: [{ label: 'Two', commandId: 'test.two' }] },
]

function renderMenuBar(overrides: Partial<MenuBarProps> = {}) {
  const onCommand = vi.fn()
  const props = { menus, onCommand, ...overrides }
  return { ...render(<MenuBar {...props} />), onCommand }
}

const selectEntry = (value?: string) => {
  const menu = document.querySelector('vscode-context-menu') as HTMLElement
  fireEvent(menu, new CustomEvent('vsc-context-menu-select', { detail: { value } }))
}

describe('MenuBar menus', () => {
  it('renders supplied menus in order', () => {
    renderMenuBar()

    const buttons = screen.getAllByRole('button').map((button) => button.textContent)
    expect(buttons).toEqual(['First', 'Second'])
  })

  it('reports the chosen command identifier and closes the menu', () => {
    const { onCommand } = renderMenuBar()

    fireEvent.click(screen.getByText('First'))
    expect(document.querySelector('vscode-context-menu')).not.toBeNull()

    selectEntry('test.one')

    expect(onCommand).toHaveBeenCalledWith('test.one')
    expect(document.querySelector('vscode-context-menu')).toBeNull()
  })

  it('reports no command for an entry without a command identifier', () => {
    const { onCommand } = renderMenuBar({
      menus: [{ id: 'first', label: 'First', entries: [{ separator: true }] }],
    })

    fireEvent.click(screen.getByText('First'))
    selectEntry(undefined)

    expect(onCommand).not.toHaveBeenCalled()
  })

  it('dispatches overflow entries like menu entries', () => {
    const { onCommand } = renderMenuBar({
      overflowItems: [{ label: 'Overflow action', commandId: 'test.overflow' }],
    })

    fireEvent.click(screen.getByRole('button', { name: 'More menus' }))
    selectEntry('test.overflow')

    expect(onCommand).toHaveBeenCalledWith('test.overflow')
  })

  it('closes an open menu on Escape without dispatching a command', () => {
    const { onCommand } = renderMenuBar()

    fireEvent.click(screen.getByText('First'))
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(document.querySelector('vscode-context-menu')).toBeNull()
    expect(onCommand).not.toHaveBeenCalled()
  })

  it('exposes the accessible label and appends a modifier class', () => {
    const { container } = renderMenuBar({ label: 'App menus', className: 'custom-menubar' })

    expect(screen.getByLabelText('App menus')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass('menubar', 'custom-menubar')
  })
})
