import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Sidebar, type SidebarProps } from './Sidebar'

afterEach(cleanup)

function renderSidebar(overrides: Partial<SidebarProps> = {}) {
  const props: SidebarProps = {
    title: 'Explorer',
    icon: 'files',
    actions: [{ id: 'refresh', icon: 'refresh', label: 'Refresh' }],
    onAction: vi.fn(),
    onClose: vi.fn(),
    closeLabel: 'Close Primary Side Bar',
    label: 'Primary side bar',
    children: <p>Sidebar content</p>,
    ...overrides,
  }
  return { ...render(<Sidebar {...props} />), props }
}

describe('Sidebar header and content', () => {
  it('renders the title, icon, actions and body content', () => {
    const { container } = renderSidebar()

    expect(screen.getByLabelText('Primary side bar')).toHaveTextContent('Explorer')
    expect(container.querySelector('vscode-icon[name="files"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
    expect(screen.getByText('Sidebar content')).toBeInTheDocument()
  })

  it('reports header actions through the action callback', () => {
    const { props } = renderSidebar()

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

    expect(props.onAction).toHaveBeenCalledWith('refresh')
  })

  it('reports the close request with the configured label', () => {
    const { props } = renderSidebar()

    fireEvent.click(screen.getByRole('button', { name: 'Close Primary Side Bar' }))

    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('omits the close control when no close callback is supplied', () => {
    renderSidebar({ onClose: undefined })

    expect(screen.queryByRole('button', { name: 'Close Primary Side Bar' })).not.toBeInTheDocument()
  })

  it('renders an empty body without inventing header content', () => {
    const { container } = renderSidebar({
      title: undefined,
      icon: undefined,
      actions: undefined,
      onClose: undefined,
      children: undefined,
    })

    expect(container.querySelector('.view-header')).toBeNull()
    expect(container.querySelector('.view-body')).not.toBeNull()
    expect(container.querySelector('.view-body')?.childElementCount).toBe(0)
  })

  it('appends a modifier class for the secondary region', () => {
    const { container } = renderSidebar({ className: 'secondary-sidebar' })

    expect(container.firstElementChild).toHaveClass('sidebar', 'secondary-sidebar')
  })
})
