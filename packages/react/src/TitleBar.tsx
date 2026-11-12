import type { ReactNode } from 'react'

export interface TitleBarProps {
  /** Content for the leading side, rendered inside the title bar's left area. */
  left?: ReactNode
  /** Center content. When omitted, a spacer keeps the side areas apart. */
  center?: ReactNode
  /** Content for the trailing side, rendered inside the title bar's actions area. */
  right?: ReactNode
  /**
   * Called when a non-button part of the title bar is double-activated.
   * Double activation on buttons is ignored.
   */
  onDoubleClick?: () => void
  /** Accessible label for the title bar region. */
  label?: string
  /** Appended to the structural root classes. */
  className?: string
}

/**
 * Structural title bar with consumer-supplied slots.
 *
 * It owns no branding, menus, commands or window behavior.
 */
export function TitleBar({
  left,
  center,
  right,
  onDoubleClick,
  label = 'Title bar',
  className,
}: TitleBarProps) {
  const rootClassName = ['titlebar', className ?? ''].filter(Boolean).join(' ')

  return (
    <header
      className={rootClassName}
      aria-label={label}
      onDoubleClick={(event) => {
        if ((event.target as HTMLElement).closest('button')) return
        onDoubleClick?.()
      }}
    >
      <div className="titlebar-left">{left}</div>
      {center ?? <div className="command-center-spacer" />}
      <div className="titlebar-actions">{right}</div>
    </header>
  )
}
