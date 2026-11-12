import type { ReactNode } from 'react'

export interface StatusBarProps {
  /** Content for the leading side. */
  left?: ReactNode
  /** Content for the trailing side. */
  right?: ReactNode
  /** Accessible label for the status region. */
  label?: string
  /** Appended to the structural root classes. */
  className?: string
}

/**
 * Status bar with consumer-supplied left and right sides.
 *
 * The primitive generates no items and owns no application state.
 */
export function StatusBar({ left, right, label = 'Status bar', className }: StatusBarProps) {
  const rootClassName = ['statusbar', className ?? ''].filter(Boolean).join(' ')

  return (
    <footer className={rootClassName} aria-label={label}>
      <div className="statusbar-side">{left}</div>
      <div className="statusbar-side statusbar-side--right">{right}</div>
    </footer>
  )
}
