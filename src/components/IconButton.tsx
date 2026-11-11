import type { ButtonHTMLAttributes } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string
  label: string
  active?: boolean
  badge?: number
  iconSize?: number
  variant?: 'default' | 'toolbar' | 'activity'
}

export function IconButton({
  icon,
  label,
  active,
  badge,
  iconSize = 16,
  variant = 'default',
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={`icon-button icon-button--${variant} ${active ? 'is-active' : ''} ${className}`.trim()}
      title={label}
      aria-label={label}
      aria-pressed={active}
      {...props}
    >
      <vscode-icon name={icon} size={iconSize} />
      {badge !== undefined && badge > 0 ? <span className="icon-button-badge">{badge}</span> : null}
    </button>
  )
}
