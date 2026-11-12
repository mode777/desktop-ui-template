import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { StatusBar, type StatusBarProps } from './StatusBar'

afterEach(cleanup)

function renderStatusBar(overrides: Partial<StatusBarProps> = {}) {
  return render(<StatusBar {...overrides} />)
}

describe('StatusBar slots', () => {
  it('renders left and right content in separate sides', () => {
    const { container } = renderStatusBar({
      left: <span>branch: main</span>,
      right: <span>UTF-8</span>,
    })

    const sides = [...container.querySelectorAll('.statusbar-side')]
    expect(sides).toHaveLength(2)
    expect(sides[0]).toHaveTextContent('branch: main')
    expect(sides[1]).toHaveTextContent('UTF-8')
    expect(sides[1]).toHaveClass('statusbar-side--right')
  })

  it('keeps both sides when only one is supplied', () => {
    const { container } = renderStatusBar({ right: <span>Ln 1, Col 1</span> })

    const sides = container.querySelectorAll('.statusbar-side')
    expect(sides).toHaveLength(2)
    expect(sides[0]).toHaveTextContent('')
    expect(sides[1]).toHaveTextContent('Ln 1, Col 1')
  })

  it('renders an accessible label and an appended class', () => {
    const { container } = renderStatusBar({ label: 'Workspace status', className: 'custom-status' })

    expect(screen.getByLabelText('Workspace status')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass('statusbar', 'custom-status')
  })

  it('uses the default label when none is supplied', () => {
    renderStatusBar()

    expect(screen.getByLabelText('Status bar')).toBeInTheDocument()
  })
})
