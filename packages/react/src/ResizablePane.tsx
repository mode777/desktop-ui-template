import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { resizeFromKey, resizeFromPointer } from '@workbench-kit/core'

export type ResizablePaneSide = 'left' | 'right' | 'bottom'

export interface ResizablePaneProps {
  side: ResizablePaneSide
  /** Committed size, owned by the consumer. */
  size: number
  min: number
  max: number
  /** Called once per committed resize (pointer release or keyboard step). */
  onSizeChange: (size: number) => void
  /** Called on sash double click; the consumer decides the resulting size. */
  onReset?: () => void
  label: string
  maximized?: boolean
  className?: string
  children: ReactNode
}

/**
 * Controlled resizable region.
 *
 * The consumer owns the committed size; this component only previews a drag
 * locally and reports the final value. Resize arithmetic comes from
 * `kit/core/layout`; pointer listeners, body cursor side effects and the ARIA
 * separator stay here. The rendered class names are the styling contract.
 */
export function ResizablePane({
  side,
  size,
  min,
  max,
  onSizeChange,
  onReset,
  label,
  maximized = false,
  className,
  children,
}: ResizablePaneProps) {
  const [dragging, setDragging] = useState(false)
  const [liveSize, setLiveSize] = useState(size)
  const dragStart = useRef({ position: 0, size })
  const latestSize = useRef(size)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => () => cleanupRef.current?.(), [])

  const vertical = side !== 'bottom'
  const orientation = vertical ? 'vertical' : 'horizontal'
  const displaySize = dragging ? liveSize : size

  const finishDrag = () => {
    cleanupRef.current?.()
    cleanupRef.current = null
    setDragging(false)
    onSizeChange(latestSize.current)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (maximized) return
    event.preventDefault()
    dragStart.current = { position: vertical ? event.clientX : event.clientY, size }
    latestSize.current = size
    setLiveSize(size)
    setDragging(true)
    document.body.classList.add('is-resizing')
    document.body.style.cursor = vertical ? 'ew-resize' : 'ns-resize'
    document.body.style.userSelect = 'none'

    const handleMove = (moveEvent: PointerEvent) => {
      const current = vertical ? moveEvent.clientX : moveEvent.clientY
      const next = resizeFromPointer({
        side,
        startSize: dragStart.current.size,
        startPosition: dragStart.current.position,
        position: current,
        min,
        max,
      })
      latestSize.current = next
      setLiveSize(next)
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
    const next = resizeFromKey({
      side,
      orientation,
      size,
      key: event.key,
      shift: event.shiftKey,
      min,
      max,
    })
    if (next === null) return

    event.preventDefault()
    onSizeChange(next)
  }

  const style: CSSProperties = maximized
    ? { flex: '1 1 auto' }
    : vertical
      ? { width: displaySize }
      : { height: displaySize }

  const rootClassName = [
    'resizable-pane',
    `resizable-pane--${side}`,
    maximized ? 'is-maximized' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClassName} style={style}>
      {children}
      {!maximized ? (
        <div
          className={`resize-handle resize-handle--${orientation}`}
          role="separator"
          aria-label={label}
          aria-orientation={orientation}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={Math.round(displaySize)}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
          onDoubleClick={onReset}
        />
      ) : null}
    </div>
  )
}
