import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MenuBar } from './MenuBar'
import { TitleBar } from './TitleBar'
import { makeConfig } from './component-test-fixtures'
import type { MenuDefinition } from '../types'

afterEach(cleanup)

const menus: MenuDefinition[] = [
  {
    id: 'first',
    label: 'First',
    entries: [{ label: 'One', commandId: 'test.one', keybinding: 'Ctrl+1' }],
  },
  { id: 'second', label: 'Second', entries: [{ label: 'Two', commandId: 'test.two' }] },
]

describe('MenuBar', () => {
  it('renders supplied menus in order', () => {
    render(<MenuBar menus={menus} run={{ run: () => true }} />)

    const buttons = screen.getAllByRole('button').map((button) => button.textContent)
    expect(buttons).toEqual(['First', 'Second'])
  })

  it('dispatches the chosen entry through the command runner', () => {
    const run = { run: vi.fn(() => true) }
    render(<MenuBar menus={menus} run={run} />)

    fireEvent.click(screen.getByText('First'))
    const menu = document.querySelector('vscode-context-menu') as HTMLElement
    fireEvent(menu, new CustomEvent('vsc-context-menu-select', { detail: { value: 'test.one' } }))

    expect(run.run).toHaveBeenCalledWith('test.one')
  })
})

describe('TitleBar', () => {
  it('renders and activates the supplied branding', () => {
    const onActivate = vi.fn()
    render(
      <TitleBar
        config={makeConfig()}
        menus={menus}
        branding={{ title: 'Acme', icon: 'rocket', onActivate }}
        run={{ run: () => true }}
      />,
    )

    fireEvent.click(screen.getByLabelText('Acme'))
    expect(onActivate).toHaveBeenCalled()
  })

  it('renders no brand control when branding is omitted', () => {
    render(<TitleBar config={makeConfig()} menus={menus} run={{ run: () => true }} />)

    expect(screen.queryByLabelText('Acme')).not.toBeInTheDocument()
    expect(screen.getByText('First')).toBeInTheDocument()
  })

  it('runs quick open from the command center', () => {
    const run = { run: vi.fn(() => true) }
    render(
      <TitleBar config={makeConfig()} menus={menus} commandCenterLabel="workspace" run={run} />,
    )

    fireEvent.click(screen.getByText('workspace'))
    expect(run.run).toHaveBeenCalledWith('view.quickOpen')
  })
})
