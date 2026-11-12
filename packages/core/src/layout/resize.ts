/**
 * Resize math for workbench sashes.
 *
 * Pure helpers: pointer and keyboard input in, a clamped size out. The DOM
 * lifecycle (pointer capture, body cursor, live preview state) stays in the
 * component; this module only answers "what size should this be?".
 */

import { clampSize } from './size'

export type ResizeSide = 'left' | 'right' | 'bottom'

/** Orientation of the sash itself: vertical for left/right regions, horizontal for the bottom. */
export type ResizeOrientation = 'vertical' | 'horizontal'

export interface PointerResizeInput {
  side: ResizeSide
  /** Size at the moment the drag started. */
  startSize: number
  /** Pointer coordinate at the moment the drag started (clientX or clientY). */
  startPosition: number
  /** Current pointer coordinate on the same axis. */
  position: number
  min: number
  max: number
}

export interface KeyResizeInput {
  side: ResizeSide
  /** Must match `side`; supplied by the caller so keyboard and sash stay consistent. */
  orientation: ResizeOrientation
  size: number
  key: string
  shift: boolean
  min: number
  max: number
}

/** Maps a pointer displacement to a new region size, clamped to the caller's bounds. */
export function resizeFromPointer({
  side,
  startSize,
  startPosition,
  position,
  min,
  max,
}: PointerResizeInput): number {
  const delta = position - startPosition
  const next = side === 'left' ? startSize + delta : startSize - delta
  return clampSize(next, min, max)
}

/**
 * Maps a resize key to a new region size, or returns `null` when the key is not
 * a resize key so the caller can leave it unhandled.
 */
export function resizeFromKey({
  side,
  orientation,
  size,
  key,
  shift,
  min,
  max,
}: KeyResizeInput): number | null {
  const step = shift ? 50 : 10
  const vertical = orientation === 'vertical'
  let next: number

  if (key === 'Home') next = min
  else if (key === 'End') next = max
  else if (vertical && key === 'ArrowLeft') next = size + (side === 'right' ? step : -step)
  else if (vertical && key === 'ArrowRight') next = size + (side === 'right' ? -step : step)
  else if (!vertical && key === 'ArrowUp') next = size + step
  else if (!vertical && key === 'ArrowDown') next = size - step
  else return null

  return clampSize(next, min, max)
}
