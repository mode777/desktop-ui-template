import type { ReactNode } from 'react'
import { IconButton } from './IconButton'

export interface SidebarAction {
  id: string
  icon: string
  label: string
}

export interface SidebarProps {
  /** Header title. When omitted, no header is rendered. */
  title?: string
  /** Codicon name for the header. */
  icon?: string
  /** Header actions, rendered in order. */
  actions?: SidebarAction[]
  /** Called when a header action is activated. */
  onAction?: (id: string) => void
  /** Called when the close control is activated. Omit to hide the control. */
  onClose?: () => void
  /** Accessible label for the close control. */
  closeLabel?: string
  /** Accessible label for the sidebar region. */
  label?: string
  /** Appended to the structural root classes. */
  className?: string
  /** Sidebar body content. */
  children?: ReactNode
}

/**
 * Controlled sidebar container.
 *
 * Renders a header from the supplied title, icon and actions, plus a body slot.
 * It resolves no views, reads no store and keeps no visibility state.
 */
export function Sidebar({
  title,
  icon,
  actions = [],
  onAction,
  onClose,
  closeLabel = 'Close side bar',
  label = 'Side bar',
  className,
  children,
}: SidebarProps) {
  const rootClassName = ['sidebar', className ?? ''].filter(Boolean).join(' ')

  return (
    <aside className={rootClassName} aria-label={label}>
      {title ? (
        <div className="view-header">
          <div className="view-header-title">
            {icon ? <vscode-icon name={icon} size={14} /> : null}
            <span>{title}</span>
          </div>
          <div className="view-header-actions">
            {actions.map((action) => (
              <IconButton
                key={action.id}
                icon={action.icon}
                label={action.label}
                variant="toolbar"
                onClick={() => onAction?.(action.id)}
              />
            ))}
            {onClose ? (
              <IconButton icon="close" label={closeLabel} variant="toolbar" onClick={onClose} />
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="view-body">{children}</div>
    </aside>
  )
}
