import { useEffect, useMemo, useState } from 'react'
import { menuDefinitions, overflowMenu } from '../../commands/menus'
import { runWorkbenchCommand } from '../../commands/commands'
import { VsContextMenu } from '../../components/VsContextMenu'
import type { ContextMenuItem } from '../../components/VsContextMenu'

interface OpenMenu {
  id: string
  x: number
  y: number
}

export function MenuBar() {
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
      ? overflowMenu
      : (menuDefinitions.find((menu) => menu.id === menuId)?.entries ?? [])
  }, [menuId])

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

  return (
    <nav className="menubar" aria-label="Application menu">
      {menuDefinitions.map((menu) => (
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

      <VsContextMenu
        open={openMenu !== null}
        x={openMenu?.x ?? 0}
        y={openMenu?.y ?? 0}
        items={items}
        ignoreSelector=".menubar"
        onSelect={(value) => {
          runWorkbenchCommand(value)
          setOpenMenu(null)
        }}
        onClose={() => setOpenMenu(null)}
      />
    </nav>
  )
}
