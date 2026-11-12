import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from './App'

afterEach(cleanup)

const statusBar = () => screen.getByLabelText('Status bar')
const editor = () => screen.getByLabelText('Editor')
const tabList = () => screen.getByRole('tablist', { name: 'Open editors' })
const tabTitles = (container: HTMLElement) =>
  [...container.querySelectorAll('.editor-tab .tab-title')].map((node) => node.textContent)

describe('custom-shell example regions', () => {
  it('renders the title bar, activity bar, primary sidebar and status bar', () => {
    render(<App />)

    expect(screen.getByLabelText('Title bar')).toHaveTextContent('Custom Shell')
    expect(screen.getByRole('navigation', { name: 'Activity bar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Primary side bar')).toHaveTextContent('Workspace')
    expect(screen.getByLabelText('Example files')).toHaveTextContent('Overview')
    expect(statusBar()).toHaveTextContent('Overview')
    expect(statusBar()).toHaveTextContent('4 tabs')
    expect(statusBar()).toHaveTextContent('Primary: 280px')
  })

  it('switches the primary sidebar and hides it when the active activity is selected again', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Show Outline' }))
    expect(screen.getByLabelText('Primary side bar')).toHaveTextContent('Outline')

    fireEvent.click(screen.getByRole('button', { name: 'Hide Outline' }))
    expect(screen.queryByLabelText('Primary side bar')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Show Outline' }))
    expect(screen.getByLabelText('Primary side bar')).toHaveTextContent('Outline')
  })

  it('reflects region visibility in the status bar through title bar controls', () => {
    render(<App />)

    expect(statusBar()).toHaveTextContent('Secondary: 280px')
    fireEvent.click(screen.getByRole('button', { name: 'Hide Secondary Side Bar' }))
    expect(statusBar()).toHaveTextContent('Secondary: hidden')

    expect(statusBar()).toHaveTextContent('Panel: console')
    fireEvent.click(screen.getByRole('button', { name: 'Hide Panel' }))
    expect(statusBar()).toHaveTextContent('Panel: hidden')
  })

  it('activates a tab and renders its document', () => {
    render(<App />)

    expect(within(editor()).getByRole('heading', { level: 2 })).toHaveTextContent(
      'A custom shell without the preset',
    )

    fireEvent.click(within(tabList()).getByText('App.tsx'))

    expect(within(editor()).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Compose the shell from slots',
    )
    expect(statusBar()).toHaveTextContent('App.tsx')
  })

  it('closes the active tab and selects the next surviving tab', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Close Overview' }))

    expect(within(tabList()).queryByText('Overview')).not.toBeInTheDocument()
    expect(within(editor()).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Compose the shell from slots',
    )
    expect(statusBar()).toHaveTextContent('3 tabs')
    expect(statusBar()).toHaveTextContent('App.tsx')
  })

  it('reorders tabs through drag and drop', () => {
    const { container } = render(<App />)
    const data = new Map<string, string>()
    const dataTransfer = {
      effectAllowed: 'move',
      dropEffect: 'move',
      setData: (format: string, value: string) => data.set(format, value),
      getData: (format: string) => data.get(format) ?? '',
    }

    const source = within(tabList()).getByText('Overview').closest('.editor-tab')
    const target = within(tabList()).getByText('App.tsx').closest('.editor-tab')
    expect(source).not.toBeNull()
    expect(target).not.toBeNull()

    fireEvent.dragStart(source as Element, { dataTransfer })
    fireEvent.dragOver(target as Element, { dataTransfer })
    fireEvent.drop(target as Element, { dataTransfer })

    expect(tabTitles(container)).toEqual(['App.tsx', 'Overview', 'custom-shell.css', 'Notes.md'])
  })

  it('shows an empty state after closing every tab and reopens the overview', () => {
    render(<App />)

    for (const title of ['Overview', 'App.tsx', 'custom-shell.css', 'Notes.md']) {
      fireEvent.click(screen.getByRole('button', { name: `Close ${title}` }))
    }

    expect(screen.getByRole('status')).toHaveTextContent('No editors are open')
    expect(statusBar()).toHaveTextContent('No editor')
    expect(statusBar()).toHaveTextContent('0 tabs')

    fireEvent.click(screen.getByRole('button', { name: 'Reopen Overview' }))

    expect(within(tabList()).getByText('Overview')).toBeInTheDocument()
    expect(statusBar()).toHaveTextContent('1 tabs')
  })

  it('switches the bottom panel tab through the vscode-tabs selection event', () => {
    render(<App />)

    expect(screen.getByLabelText('Console output')).toHaveTextContent('local reducer initialized')
    expect(statusBar()).toHaveTextContent('Panel: console')

    const tabs = document.querySelector('vscode-tabs')
    expect(tabs).not.toBeNull()
    fireEvent(tabs as Element, new CustomEvent('vsc-tabs-select', { detail: { selectedIndex: 1 } }))

    expect(screen.getByLabelText('Example details')).toHaveTextContent('Active editor')
    expect(screen.getByLabelText('Example details')).toHaveTextContent('Overview')
    expect(statusBar()).toHaveTextContent('Panel: details')
  })

  it('toggles the secondary sidebar and panel maximize state', () => {
    render(<App />)

    expect(screen.getByLabelText('Secondary side bar')).toHaveTextContent('Inspector')
    fireEvent.click(screen.getByRole('button', { name: 'Close Secondary Side Bar' }))
    expect(screen.queryByLabelText('Secondary side bar')).not.toBeInTheDocument()
    expect(statusBar()).toHaveTextContent('Secondary: hidden')

    fireEvent.click(screen.getByRole('button', { name: 'Show Secondary Side Bar' }))
    expect(screen.getByLabelText('Secondary side bar')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Maximize Panel Size' }))
    expect(document.querySelector('.workbench')).toHaveClass('panel-is-maximized')
    expect(screen.queryByLabelText('Editor')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Panel')).toBeInTheDocument()
    expect(statusBar()).toHaveTextContent('Panel: console (max)')
    expect(screen.getByRole('button', { name: 'Restore Panel Size' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Restore Panel Size' }))
    expect(document.querySelector('.workbench')).not.toHaveClass('panel-is-maximized')
    expect(screen.getByLabelText('Editor')).toBeInTheDocument()
    expect(statusBar()).toHaveTextContent('Panel: console')
  })

  it('resizes and resets the consumer-owned sashes', () => {
    render(<App />)

    const primarySash = screen.getByRole('separator', { name: 'Resize primary side bar' })
    const primaryPane = primarySash.parentElement as HTMLElement
    expect(primaryPane.style.width).toBe('280px')
    expect(screen.getByRole('separator', { name: 'Resize secondary side bar' })).toBeInTheDocument()
    expect(screen.getByRole('separator', { name: 'Resize bottom panel' })).toBeInTheDocument()

    fireEvent.keyDown(primarySash, { key: 'ArrowRight' })
    expect(primaryPane.style.width).toBe('290px')
    expect(statusBar()).toHaveTextContent('Primary: 290px')

    fireEvent.doubleClick(primarySash)
    expect(primaryPane.style.width).toBe('280px')
    expect(statusBar()).toHaveTextContent('Primary: 280px')
  })
})
