import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { IconButton } from './IconButton'

describe('IconButton', () => {
  it('exposes an accessible label and tooltip', () => {
    render(<IconButton icon="search" label="Search" />)
    const button = screen.getByRole('button', { name: 'Search' })
    expect(button).toHaveAttribute('title', 'Search')
    expect(button).toHaveAttribute('type', 'button')
  })

  it('reports its active state and handles clicks', () => {
    const onClick = vi.fn()
    render(<IconButton icon="files" label="Explorer" active onClick={onClick} />)
    const button = screen.getByRole('button', { name: 'Explorer' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders a badge only for positive values', () => {
    const { rerender } = render(
      <IconButton icon="source-control" label="Source Control" badge={3} />,
    )
    expect(screen.getByText('3')).toBeInTheDocument()
    rerender(<IconButton icon="source-control" label="Source Control" badge={0} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
