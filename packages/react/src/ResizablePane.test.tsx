import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ResizablePane, type ResizablePaneSide } from './ResizablePane'

afterEach(cleanup)

interface HarnessProps {
  initialSize?: number
  min?: number
  max?: number
  side?: ResizablePaneSide
  onSizeChange?: (size: number) => void
}

/** Controlled consumer: accepts every reported size. */
function Harness({
  initialSize = 300,
  min = 180,
  max = 640,
  side = 'left',
  onSizeChange,
}: HarnessProps) {
  const [size, setSize] = useState(initialSize)
  return (
    <ResizablePane
      side={side}
      size={size}
      min={min}
      max={max}
      label="Resize pane"
      onSizeChange={(next) => {
        onSizeChange?.(next)
        setSize(next)
      }}
    >
      <div>content</div>
    </ResizablePane>
  )
}

const sash = () => screen.getByRole('separator')
const pane = () => sash().parentElement as HTMLElement

const startDrag = (position: number) =>
  fireEvent.pointerDown(sash(), { clientX: position, clientY: position })
const moveDrag = (position: number) =>
  fireEvent.pointerMove(window, { clientX: position, clientY: position })
const endDrag = () => fireEvent.pointerUp(window)

describe('ResizablePane controlled size', () => {
  it('renders the supplied size and follows external size changes', () => {
    const { rerender } = render(
      <ResizablePane
        side="left"
        size={300}
        min={180}
        max={640}
        onSizeChange={() => {}}
        label="Resize"
      >
        <div>content</div>
      </ResizablePane>,
    )

    expect(pane().style.width).toBe('300px')

    rerender(
      <ResizablePane
        side="left"
        size={420}
        min={180}
        max={640}
        onSizeChange={() => {}}
        label="Resize"
      >
        <div>content</div>
      </ResizablePane>,
    )

    expect(pane().style.width).toBe('420px')
  })

  it('previews a drag and commits once when the consumer accepts', () => {
    const onSizeChange = vi.fn()
    render(<Harness onSizeChange={onSizeChange} />)

    startDrag(100)
    moveDrag(140)

    expect(pane().style.width).toBe('340px')
    expect(onSizeChange).not.toHaveBeenCalled()

    endDrag()

    expect(onSizeChange).toHaveBeenCalledOnce()
    expect(onSizeChange).toHaveBeenCalledWith(340)
    expect(pane().style.width).toBe('340px')
  })

  it('returns to the prop size when the consumer rejects the commit', () => {
    const onSizeChange = vi.fn()
    render(
      <ResizablePane
        side="left"
        size={300}
        min={180}
        max={640}
        onSizeChange={onSizeChange}
        label="Resize"
      >
        <div>content</div>
      </ResizablePane>,
    )

    startDrag(100)
    moveDrag(140)
    expect(pane().style.width).toBe('340px')

    endDrag()

    expect(onSizeChange).toHaveBeenCalledWith(340)
    expect(pane().style.width).toBe('300px')
  })

  it('clamps the preview and the committed size at both bounds', () => {
    const onSizeChange = vi.fn()
    render(<Harness onSizeChange={onSizeChange} />)

    startDrag(100)
    moveDrag(1000)
    expect(pane().style.width).toBe('640px')
    endDrag()
    expect(onSizeChange).toHaveBeenLastCalledWith(640)

    startDrag(100)
    moveDrag(-500)
    expect(pane().style.width).toBe('180px')
    endDrag()
    expect(onSizeChange).toHaveBeenLastCalledWith(180)
  })

  it('sets and clears the body resize cursor and class during a drag', () => {
    render(<Harness />)

    startDrag(100)
    moveDrag(140)

    expect(document.body.classList.contains('is-resizing')).toBe(true)
    expect(document.body.style.cursor).toBe('ew-resize')
    expect(document.body.style.userSelect).toBe('none')

    endDrag()

    expect(document.body.classList.contains('is-resizing')).toBe(false)
    expect(document.body.style.cursor).toBe('')
    expect(document.body.style.userSelect).toBe('')
  })
})

describe('ResizablePane keyboard resizing', () => {
  it('steps left and right regions in the direction that grows them', () => {
    const onSizeChange = vi.fn()
    const { unmount } = render(<Harness side="left" onSizeChange={onSizeChange} />)

    fireEvent.keyDown(sash(), { key: 'ArrowRight' })
    expect(onSizeChange).toHaveBeenLastCalledWith(310)

    fireEvent.keyDown(sash(), { key: 'ArrowLeft' })
    expect(onSizeChange).toHaveBeenLastCalledWith(300)

    unmount()

    render(<Harness side="right" onSizeChange={onSizeChange} />)
    fireEvent.keyDown(sash(), { key: 'ArrowLeft' })
    expect(onSizeChange).toHaveBeenLastCalledWith(310)

    fireEvent.keyDown(sash(), { key: 'ArrowRight' })
    expect(onSizeChange).toHaveBeenLastCalledWith(300)
  })

  it('steps a bottom region on the vertical arrows only', () => {
    const onSizeChange = vi.fn()
    render(<Harness side="bottom" onSizeChange={onSizeChange} />)

    fireEvent.keyDown(sash(), { key: 'ArrowUp' })
    expect(onSizeChange).toHaveBeenLastCalledWith(310)

    fireEvent.keyDown(sash(), { key: 'ArrowDown' })
    expect(onSizeChange).toHaveBeenLastCalledWith(300)

    fireEvent.keyDown(sash(), { key: 'ArrowLeft' })
    expect(onSizeChange).toHaveBeenCalledTimes(2)
  })

  it('uses a 50-unit step with Shift', () => {
    const onSizeChange = vi.fn()
    render(<Harness side="left" onSizeChange={onSizeChange} />)

    fireEvent.keyDown(sash(), { key: 'ArrowRight', shiftKey: true })
    expect(onSizeChange).toHaveBeenLastCalledWith(350)
  })

  it('jumps to the bounds with Home and End', () => {
    const onSizeChange = vi.fn()
    render(<Harness side="left" onSizeChange={onSizeChange} />)

    fireEvent.keyDown(sash(), { key: 'Home' })
    expect(onSizeChange).toHaveBeenLastCalledWith(180)

    fireEvent.keyDown(sash(), { key: 'End' })
    expect(onSizeChange).toHaveBeenLastCalledWith(640)
  })

  it('leaves unhandled keys alone', () => {
    const onSizeChange = vi.fn()
    render(<Harness side="left" onSizeChange={onSizeChange} />)

    const notPrevented = fireEvent.keyDown(sash(), { key: 'a' })

    expect(notPrevented).toBe(true)
    expect(onSizeChange).not.toHaveBeenCalled()
  })
})

describe('ResizablePane accessibility and presentation', () => {
  it('exposes the sash as an accessible separator', () => {
    render(<Harness initialSize={300.4} side="left" />)

    const separator = sash()
    expect(separator).toHaveAttribute('role', 'separator')
    expect(separator).toHaveAttribute('aria-label', 'Resize pane')
    expect(separator).toHaveAttribute('aria-orientation', 'vertical')
    expect(separator).toHaveAttribute('aria-valuemin', '180')
    expect(separator).toHaveAttribute('aria-valuemax', '640')
    expect(separator).toHaveAttribute('aria-valuenow', '300')
    expect(separator).toHaveAttribute('tabindex', '0')
  })

  it('reports a horizontal orientation for a bottom region', () => {
    render(<Harness side="bottom" />)

    expect(sash()).toHaveAttribute('aria-orientation', 'horizontal')
  })

  it('fills the space and hides the sash when maximized', () => {
    const { container } = render(
      <ResizablePane
        side="bottom"
        size={300}
        min={180}
        max={640}
        onSizeChange={() => {}}
        label="Resize"
        maximized
      >
        <div>content</div>
      </ResizablePane>,
    )

    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveClass('resizable-pane', 'resizable-pane--bottom', 'is-maximized')
    expect(root.style.flex).toBe('1 1 auto')
  })

  it('appends a consumer class without dropping the structural classes', () => {
    const { container } = render(
      <ResizablePane
        side="left"
        size={300}
        min={180}
        max={640}
        onSizeChange={() => {}}
        label="Resize"
        className="custom-pane"
      >
        <div>content</div>
      </ResizablePane>,
    )

    expect(container.firstElementChild).toHaveClass(
      'resizable-pane',
      'resizable-pane--left',
      'custom-pane',
    )
  })

  it('requests a reset on double click without changing the size itself', () => {
    const onReset = vi.fn()
    const onSizeChange = vi.fn()
    render(
      <ResizablePane
        side="left"
        size={300}
        min={180}
        max={640}
        onSizeChange={onSizeChange}
        onReset={onReset}
        label="Resize"
      >
        <div>content</div>
      </ResizablePane>,
    )

    fireEvent.doubleClick(sash())

    expect(onReset).toHaveBeenCalledOnce()
    expect(onSizeChange).not.toHaveBeenCalled()
  })
})

describe('ResizablePane drag cleanup', () => {
  it('removes listeners and body state when unmounted mid-drag', () => {
    const onSizeChange = vi.fn()
    const { unmount } = render(<Harness onSizeChange={onSizeChange} />)

    startDrag(100)
    moveDrag(140)
    expect(document.body.classList.contains('is-resizing')).toBe(true)

    unmount()

    expect(document.body.classList.contains('is-resizing')).toBe(false)
    expect(document.body.style.cursor).toBe('')
    expect(document.body.style.userSelect).toBe('')

    moveDrag(200)
    endDrag()
    expect(onSizeChange).not.toHaveBeenCalled()
  })
})
