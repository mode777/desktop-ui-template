import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ActivityBar, type ActivityBarItem, type ActivityBarProps } from './ActivityBar'

afterEach(cleanup)

const items: ActivityBarItem[] = [
  { id: 'files', title: 'Files', icon: 'files' },
  { id: 'search', title: 'Search', icon: 'search', badge: 3 },
  { id: 'settings', title: 'Settings', icon: 'settings-gear' },
]

function renderBar(overrides: Partial<ActivityBarProps> = {}) {
  const props: ActivityBarProps = {
    items,
    activeId: 'files',
    onActivate: vi.fn(),
    ...overrides,
  }
  return { ...render(<ActivityBar {...props} />), props }
}

function ControlledHarness({ onActivate }: { onActivate?: (id: string) => void }) {
  const [activeId, setActiveId] = useState<string | null>('files')
  return (
    <ActivityBar
      items={items}
      activeId={activeId}
      onActivate={(id) => {
        onActivate?.(id)
        setActiveId(id)
      }}
    />
  )
}

describe('ActivityBar controlled activation', () => {
  it('marks only the matching item active', () => {
    const { container } = renderBar()

    expect(screen.getByRole('button', { name: 'Files' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-pressed', 'false')
    expect(container.querySelectorAll('.activitybar-indicator')).toHaveLength(1)
  })

  it('reports a requested activation and follows the consumer update', () => {
    const onActivate = vi.fn()
    render(<ControlledHarness onActivate={onActivate} />)

    fireEvent.click(screen.getByRole('button', { name: 'Search' }))

    expect(onActivate).toHaveBeenCalledWith('search')
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Files' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps the previous selection when the consumer ignores the request', () => {
    const { props } = renderBar()

    fireEvent.click(screen.getByRole('button', { name: 'Search' }))

    expect(props.onActivate).toHaveBeenCalledWith('search')
    expect(screen.getByRole('button', { name: 'Files' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('follows an external active id change', () => {
    const { rerender, props } = renderBar()

    rerender(<ActivityBar {...props} activeId="settings" />)

    expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Files' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('marks no item active when the active id is missing from the list', () => {
    const { container } = renderBar({ activeId: 'missing' })

    expect(container.querySelectorAll('.activitybar-indicator')).toHaveLength(0)
    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAttribute('aria-pressed', 'false')
    }
  })
})

describe('ActivityBar actions and badges', () => {
  it('renders a badge while keeping the item label', () => {
    renderBar()

    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
    expect(screen.getByText('3')).toHaveClass('icon-button-badge')
  })

  it('reports bottom actions separately from top-item activation', () => {
    const onActivate = vi.fn()
    const onAction = vi.fn()
    renderBar({
      onActivate,
      onAction,
      bottomItems: [{ id: 'account', title: 'Account', icon: 'account' }],
    })

    fireEvent.click(screen.getByRole('button', { name: 'Account' }))

    expect(onAction).toHaveBeenCalledWith('account')
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('renders the bottom group without controls when no actions are supplied', () => {
    const { container } = renderBar()

    const bottom = container.querySelector('.activitybar-group--bottom') as HTMLElement
    expect(bottom).not.toBeNull()
    expect(within(bottom).queryAllByRole('button')).toHaveLength(0)
  })
})
