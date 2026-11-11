import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

type Side = 'left' | 'right' | 'bottom'

interface ResizablePaneProps {
  side: Side
  size: number
  min: number
  max: number
  onResize: (size: number) => void
  onReset: () => void
  label: string
  maximized?: boolean
  children: ReactNode
}

function clampSize(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function ResizablePane({
  side,
  size,
  min,
  max,
  onResize,
  onReset,
  label,
  maximized = false,
  children,
}: ResizablePaneProps) {
  const [liveSize, setLiveSize] = useState(size)
  const dragStart = useRef({ position: 0, size })
  const latestSize = useRef(size)
  const dragging = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!dragging.current) {
      setLiveSize(size)
      latestSize.current = size
    }
  }, [size])

  useEffect(() => () => cleanupRef.current?.(), [])

  const vertical = side !== 'bottom'
  const ariaOrientation = vertical ? 'vertical' : 'horizontal'

  const finishDrag = () => {
    dragging.current = false
    cleanupRef.current?.()
    cleanupRef.current = null
    onResize(latestSize.current)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (maximized) return
    event.preventDefault()
    dragStart.current = { position: vertical ? event.clientX : event.clientY, size: liveSize }
    dragging.current = true
    document.body.classList.add('is-resizing')
    document.body.style.cursor = vertical ? 'ew-resize' : 'ns-resize'
    document.body.style.userSelect = 'none'

    const handleMove = (moveEvent: PointerEvent) => {
      const current = vertical ? moveEvent.clientX : moveEvent.clientY
      const delta = current - dragStart.current.position
      const next =
        side === 'left'
          ? dragStart.current.size + delta
          : side === 'right'
            ? dragStart.current.size - delta
            : dragStart.current.size - delta
      const clamped = clampSize(next, min, max)
      latestSize.current = clamped
      setLiveSize(clamped)
    }

    const cleanup = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', finishDrag)
      document.body.classList.remove('is-resizing')
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    cleanupRef.current = cleanup
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', finishDrag, { once: true })
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 50 : 10
    let next = liveSize

    if (event.key === 'Home') next = min
    else if (event.key === 'End') next = max
    else if (vertical && event.key === 'ArrowLeft')
      next = liveSize + (side === 'right' ? step : -step)
    else if (vertical && event.key === 'ArrowRight')
      next = liveSize + (side === 'right' ? -step : step)
    else if (!vertical && event.key === 'ArrowUp') next = liveSize + step
    else if (!vertical && event.key === 'ArrowDown') next = liveSize - step
    else return

    event.preventDefault()
    const clamped = clampSize(next, min, max)
    latestSize.current = clamped
    setLiveSize(clamped)
    onResize(clamped)
  }

  const style: CSSProperties = maximized
    ? { flex: '1 1 auto' }
    : vertical
      ? { width: liveSize }
      : { height: liveSize }

  return (
    <div
      className={`resizable-pane resizable-pane--${side} ${maximized ? 'is-maximized' : ''}`.trim()}
      style={style}
    >
      {children}
      {!maximized ? (
        <div
          className={`resize-handle resize-handle--${ariaOrientation}`}
          role="separator"
          aria-label={label}
          aria-orientation={ariaOrientation}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={Math.round(liveSize)}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
          onDoubleClick={onReset}
        />
      ) : null}
    </div>
  )
}
