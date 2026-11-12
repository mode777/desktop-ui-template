import { useEffect, useMemo, useState } from 'react'
import { ContextMenu } from './ContextMenu'
import type { ContextMenuItem } from './ContextMenu'

export interface MenuBarEntry {
  label?: string
  commandId?: string
  keybinding?: string
  separator?: boolean
}

export interface MenuBarMenu {
  id: string
  label: string
  entries: MenuBarEntry[]
}

export interface MenuBarProps {
  /** Menus, rendered in order. */
  menus: MenuBarMenu[]
  /** Called with the command identifier of a chosen entry. */
  onCommand: (commandId: string) => void
  /** Entries shown by the overflow trigger; the trigger is hidden when omitted. */
  overflowItems?: MenuBarEntry[]
  /** Accessible label for the menu navigation. */
  label?: string
  /** Appended to the structural root classes. */
  className?: string
}

interface OpenMenu {
  id: string
  x: number
  y: number
}

/**
 * Controlled menu bar.
 *
 * It owns only transient open/close state and reports chosen command ids. It
 * has no command registry and executes nothing itself.
 */
export function MenuBar({
  menus,
  onCommand,
  overflowItems,
  label = 'Application menu',
  className,
}: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null)

  useEffect(() => {
    if (!openMenu) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenu(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openMenu])

  const menuId = openMenu?.id
  const entries = useMemo(() => {
    if (!menuId) return []
    return menuId === 'overflow'
      ? (overflowItems ?? [])
      : (menus.find((menu) => menu.id === menuId)?.entries ?? [])
  }, [menuId, menus, overflowItems])

  const items = useMemo<ContextMenuItem[]>(
    () =>
      entries.map((entry) => ({
        label: entry.label,
        value: entry.commandId,
        keybinding: entry.keybinding,
        separator: entry.separator,
      })),
    [entries],
  )

  const openAt = (id: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    setOpenMenu({ id, x: rect.left, y: rect.bottom })
  }

  const rootClassName = ['menubar', className ?? ''].filter(Boolean).join(' ')

  return (
    <nav className={rootClassName} aria-label={label}>
      {menus.map((menu) => (
        <button
          key={menu.id}
          type="button"
          className={`menubar-button ${openMenu?.id === menu.id ? 'is-open' : ''}`}
          aria-haspopup="menu"
          aria-expanded={openMenu?.id === menu.id}
          onClick={(event) => {
            if (openMenu?.id === menu.id) setOpenMenu(null)
            else openAt(menu.id, event.currentTarget)
          }}
          onPointerEnter={(event) => {
            if (openMenu && openMenu.id !== menu.id) openAt(menu.id, event.currentTarget)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openAt(menu.id, event.currentTarget)
            }
          }}
        >
          {menu.label}
        </button>
      ))}
      {overflowItems ? (
        <button
          type="button"
          className={`menubar-button menubar-overflow ${openMenu?.id === 'overflow' ? 'is-open' : ''}`}
          aria-label="More menus"
          aria-haspopup="menu"
          aria-expanded={openMenu?.id === 'overflow'}
          onClick={(event) => {
            if (openMenu?.id === 'overflow') setOpenMenu(null)
            else openAt('overflow', event.currentTarget)
          }}
        >
          <vscode-icon name="ellipsis" size={14} />
        </button>
      ) : null}

      <ContextMenu
        open={openMenu !== null}
        x={openMenu?.x ?? 0}
        y={openMenu?.y ?? 0}
        items={items}
        ignoreSelector=".menubar"
        onSelect={(value) => {
          onCommand(value)
          setOpenMenu(null)
        }}
        onClose={() => setOpenMenu(null)}
      />
    </nav>
  )
}
