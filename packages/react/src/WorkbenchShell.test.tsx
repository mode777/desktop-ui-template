import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { WorkbenchShell, type WorkbenchShellProps } from './WorkbenchShell'

afterEach(cleanup)

function shellProps(overrides: Partial<WorkbenchShellProps> = {}): WorkbenchShellProps {
  return {
    titleBar: <div data-testid="title-bar" />,
    activityBar: <div data-testid="activity-bar" />,
    primarySideBar: <div data-testid="primary-side-bar" />,
    secondarySideBar: <div data-testid="secondary-side-bar" />,
    panel: <div data-testid="panel" />,
    statusBar: <div data-testid="status-bar" />,
    overlays: <div data-testid="overlays" />,
    children: <div data-testid="center-content" />,
    ...overrides,
  }
}

function renderShell(overrides: Partial<WorkbenchShellProps> = {}) {
  return render(<WorkbenchShell {...shellProps(overrides)} />)
}

const rootElement = (container: HTMLElement) => container.firstElementChild as HTMLElement

describe('WorkbenchShell slots', () => {
  it('renders every supplied region once', () => {
    renderShell()

    for (const id of [
      'title-bar',
      'activity-bar',
      'primary-side-bar',
      'secondary-side-bar',
      'panel',
      'status-bar',
      'overlays',
      'center-content',
    ]) {
      expect(screen.getAllByTestId(id)).toHaveLength(1)
    }
  })

  it('nests regions in the workbench structure', () => {
    const { container } = renderShell()
    const root = rootElement(container)
    const body = root.querySelector('.workbench-body') as HTMLElement
    const center = body.querySelector('.workbench-center') as HTMLElement

    expect(root.children[0]).toBe(screen.getByTestId('title-bar'))
    expect(root.children[1]).toBe(body)
    expect(root.children[2]).toBe(screen.getByTestId('status-bar'))
    expect(root.lastElementChild).toBe(screen.getByTestId('overlays'))

    expect(Array.from(body.children)).toEqual([
      screen.getByTestId('activity-bar'),
      screen.getByTestId('primary-side-bar'),
      center,
      screen.getByTestId('secondary-side-bar'),
    ])
    expect(Array.from(center.children)).toEqual([
      screen.getByTestId('center-content'),
      screen.getByTestId('panel'),
    ])
  })

  it('omits null and undefined slots while keeping the structural wrappers', () => {
    const { container } = renderShell({
      titleBar: undefined,
      primarySideBar: null,
      panel: null,
    })
    const root = rootElement(container)
    const body = root.querySelector('.workbench-body') as HTMLElement
    const center = body.querySelector('.workbench-center') as HTMLElement

    expect(screen.queryByTestId('title-bar')).toBeNull()
    expect(screen.queryByTestId('primary-side-bar')).toBeNull()
    expect(screen.queryByTestId('panel')).toBeNull()
    expect(body).not.toBeNull()
    expect(center).not.toBeNull()
    expect(screen.getByTestId('activity-bar')).toBeInTheDocument()
    expect(screen.getByTestId('center-content')).toBeInTheDocument()
    expect(screen.getByTestId('secondary-side-bar')).toBeInTheDocument()
  })

  it('appends a custom class to the structural root classes', () => {
    const { container } = renderShell({ className: 'app-shell' })
    const root = rootElement(container)

    expect(root).toHaveClass('workbench', 'app-shell')
    expect(root).not.toHaveClass('panel-is-maximized')
  })

  it('keeps the structural wrappers with only center content', () => {
    const { container } = render(
      <WorkbenchShell>
        <div data-testid="only-content" />
      </WorkbenchShell>,
    )
    const root = rootElement(container)
    const body = root.querySelector('.workbench-body') as HTMLElement
    const center = body.querySelector('.workbench-center') as HTMLElement

    expect(root).toHaveClass('workbench')
    expect(Array.from(root.children)).toEqual([body])
    expect(Array.from(center.children)).toEqual([screen.getByTestId('only-content')])
    expect(screen.queryByTestId('title-bar')).toBeNull()
    expect(screen.queryByTestId('activity-bar')).toBeNull()
    expect(screen.queryByTestId('panel')).toBeNull()
    expect(screen.queryByTestId('status-bar')).toBeNull()
    expect(screen.queryByTestId('overlays')).toBeNull()
  })
})

describe('WorkbenchShell panel maximization', () => {
  it('marks the root and replaces the center content with the panel', () => {
    const { container } = renderShell({ panelMaximized: true })
    const root = rootElement(container)
    const center = root.querySelector('.workbench-center') as HTMLElement

    expect(root).toHaveClass('workbench', 'panel-is-maximized')
    expect(screen.queryByTestId('center-content')).toBeNull()
    expect(Array.from(center.children)).toEqual([screen.getByTestId('panel')])

    for (const id of [
      'title-bar',
      'activity-bar',
      'primary-side-bar',
      'secondary-side-bar',
      'status-bar',
      'overlays',
    ]) {
      expect(screen.getByTestId(id)).toBeInTheDocument()
    }
  })

  it('restores the center content above the panel when unmaximized', () => {
    const { container, rerender } = renderShell({ panelMaximized: true })
    const root = rootElement(container)

    rerender(<WorkbenchShell {...shellProps({ panelMaximized: false })} />)

    const center = root.querySelector('.workbench-center') as HTMLElement
    expect(root).not.toHaveClass('panel-is-maximized')
    expect(Array.from(center.children)).toEqual([
      screen.getByTestId('center-content'),
      screen.getByTestId('panel'),
    ])
    expect(screen.getByTestId('title-bar')).toBeInTheDocument()
    expect(screen.getByTestId('activity-bar')).toBeInTheDocument()
    expect(screen.getByTestId('primary-side-bar')).toBeInTheDocument()
    expect(screen.getByTestId('secondary-side-bar')).toBeInTheDocument()
    expect(screen.getByTestId('status-bar')).toBeInTheDocument()
    expect(screen.getByTestId('overlays')).toBeInTheDocument()
  })
})
