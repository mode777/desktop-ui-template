import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TitleBar, type TitleBarProps } from './TitleBar'

afterEach(cleanup)

function renderTitleBar(overrides: Partial<TitleBarProps> = {}) {
  const props: TitleBarProps = {
    left: <span data-testid="left-slot">Left</span>,
    center: <span data-testid="center-slot">Center</span>,
    right: <span data-testid="right-slot">Right</span>,
    ...overrides,
  }
  return { ...render(<TitleBar {...props} />), props }
}

describe('TitleBar slots', () => {
  it('places left, center and right content in their structural areas', () => {
    const { container } = renderTitleBar()
    const root = container.firstElementChild as HTMLElement

    expect(root.children[0]).toHaveClass('titlebar-left')
    expect(root.children[0]).toContainElement(screen.getByTestId('left-slot'))
    expect(root.children[1]).toBe(screen.getByTestId('center-slot'))
    expect(root.children[2]).toHaveClass('titlebar-actions')
    expect(root.children[2]).toContainElement(screen.getByTestId('right-slot'))
  })

  it('renders the center spacer when no center content is supplied', () => {
    const { container } = renderTitleBar({ center: undefined })

    expect(container.querySelector('.command-center-spacer')).not.toBeNull()
  })

  it('exposes the accessible label and appends a modifier class', () => {
    const { container } = renderTitleBar({ label: 'App title', className: 'custom-titlebar' })

    expect(screen.getByLabelText('App title')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass('titlebar', 'custom-titlebar')
  })
})

describe('TitleBar double activation', () => {
  it('reports double activation outside buttons', () => {
    const onDoubleClick = vi.fn()
    const { container } = renderTitleBar({ onDoubleClick })

    fireEvent.doubleClick(container.firstElementChild as Element)

    expect(onDoubleClick).toHaveBeenCalledTimes(1)
  })

  it('ignores double activation on buttons', () => {
    const onDoubleClick = vi.fn()
    renderTitleBar({
      onDoubleClick,
      left: <button type="button">Brand</button>,
    })

    fireEvent.doubleClick(screen.getByRole('button', { name: 'Brand' }))

    expect(onDoubleClick).not.toHaveBeenCalled()
  })
})
