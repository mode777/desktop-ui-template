import { IconButton } from './IconButton'

export interface ActivityBarItem {
  id: string
  title: string
  icon: string
  badge?: number
}

export interface ActivityBarAction {
  id: string
  title: string
  icon: string
}

export interface ActivityBarProps {
  /** Top-level activity items, rendered in order. */
  items: ActivityBarItem[]
  /** Item to mark active. Omit or pass null for no active item. */
  activeId?: string | null
  /** Actions rendered in the bottom group. */
  bottomItems?: ActivityBarAction[]
  /** Called when a top-level item is activated. */
  onActivate?: (id: string) => void
  /** Called when a bottom action is activated. */
  onAction?: (id: string) => void
  /** Accessible label for the navigation region. */
  label?: string
  /** Appended to the structural root classes. */
  className?: string
}

/**
 * Controlled activity bar.
 *
 * Renders the supplied items and reports activation or action requests. It owns
 * no selection or visibility state and imports no application modules.
 */
export function ActivityBar({
  items,
  activeId = null,
  bottomItems = [],
  onActivate,
  onAction,
  label = 'Activity bar',
  className,
}: ActivityBarProps) {
  const rootClassName = ['activitybar', className ?? ''].filter(Boolean).join(' ')

  return (
    <nav className={rootClassName} aria-label={label}>
      <div className="activitybar-group">
        {items.map((item) => {
          const active = item.id === activeId
          return (
            <div className="activitybar-item-wrap" key={item.id}>
              {active ? <span className="activitybar-indicator" aria-hidden="true" /> : null}
              <IconButton
                icon={item.icon}
                label={item.title}
                variant="activity"
                active={active}
                badge={item.badge}
                onClick={() => onActivate?.(item.id)}
              />
            </div>
          )
        })}
      </div>

      <div className="activitybar-group activitybar-group--bottom">
        {bottomItems.map((item) => (
          <IconButton
            key={item.id}
            icon={item.icon}
            label={item.title}
            variant="activity"
            onClick={() => onAction?.(item.id)}
          />
        ))}
      </div>
    </nav>
  )
}
