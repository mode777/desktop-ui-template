import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from './App'

afterEach(cleanup)

const tablist = () => screen.getByRole('tablist', { name: 'Open tabs' })
const documentArea = () => screen.getByLabelText('Document')
const sidebarSash = () => screen.getByRole('separator', { name: 'Resize options sidebar' })

describe('minimal example', () => {
  it('renders one active tab, the options sidebar and the status bar', () => {
    render(<App />)

    expect(within(tablist()).getByText('README.md')).toBeInTheDocument()
    expect(within(tablist()).getByText('README.md').closest('.editor-tab')).toHaveClass('is-active')
    expect(screen.getByLabelText('Options')).toBeInTheDocument()
    expect(screen.getByLabelText('Status bar')).toHaveTextContent('1 tab')
    expect(screen.queryByRole('button', { name: 'Close README.md' })).not.toBeInTheDocument()
  })

  it('drives the document and status bar from consumer-owned option state', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('checkbox', { name: /Word wrap/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Minimap/ }))
    fireEvent.change(screen.getByLabelText('Font size'), { target: { value: '16' } })
    fireEvent.change(screen.getByLabelText('Tab size'), { target: { value: '4' } })

    expect(screen.getByLabelText('Status bar')).toHaveTextContent('Wrap: off')
    expect(documentArea()).toHaveTextContent('off')
    expect(documentArea()).toHaveTextContent('shown')
    expect(documentArea()).toHaveTextContent('16px')
    expect(within(documentArea()).getByText('4 spaces')).toBeInTheDocument()
  })

  it('keeps the tab active when the controlled strip reports activation', () => {
    render(<App />)

    fireEvent.click(within(tablist()).getByText('README.md'))

    expect(within(tablist()).getByText('README.md').closest('.editor-tab')).toHaveClass('is-active')
    expect(documentArea()).toHaveTextContent('README.md')
  })

  it('resizes and resets the sidebar through the controlled sash', () => {
    render(<App />)

    const sash = sidebarSash()
    const pane = sash.parentElement as HTMLElement

    expect(pane.style.width).toBe('240px')

    fireEvent.keyDown(sash, { key: 'ArrowRight' })

    expect(pane.style.width).toBe('250px')
    expect(screen.getByLabelText('Status bar')).toHaveTextContent('Sidebar: 250px')

    fireEvent.doubleClick(sash)

    expect(pane.style.width).toBe('240px')
  })
})
