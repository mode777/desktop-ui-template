import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface ContextMenuItem {
  label?: string
  value?: string
  keybinding?: string
  separator?: boolean
}

export interface ContextMenuProps {
  /** Whether the menu is visible. */
  open: boolean
  /** Viewport x coordinate for the menu anchor. */
  x: number
  /** Viewport y coordinate for the menu anchor. */
  y: number
  /** Menu entries, including separators. */
  items: ContextMenuItem[]
  /** Called with the value of a chosen entry. */
  onSelect: (value: string) => void
  /** Called when the menu should close. */
  onClose: () => void
  /** Clicks inside this selector should not close the menu. */
  ignoreSelector?: string
}

type ContextMenuElement = HTMLElement & {
  show: boolean
  data: ContextMenuItem[]
}

const VIEWPORT_MARGIN = 8
const APPROX_MENU_WIDTH = 290
const APPROX_MENU_HEIGHT = 360

/**
 * Controlled context-menu portal rendered through `vscode-context-menu`.
 *
 * It owns no menu content beyond the supplied entries and delegates entry
 * selection and closing to the consumer. Register the published context-menu
 * element entry before rendering it.
 */
export function ContextMenu({
  open,
  x,
  y,
  items,
  onSelect,
  onClose,
  ignoreSelector,
}: ContextMenuProps) {
  const menuRef = useRef<ContextMenuElement | null>(null)

  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    if (!open) {
      menu.show = false
      return
    }

    menu.data = items
    menu.show = true
  }, [open, items])

  useEffect(() => {
    const menu = menuRef.current
    if (!menu || !open) return

    const handleSelect = (event: Event) => {
      const detail = (event as CustomEvent<{ value?: string }>).detail
      if (detail?.value) onSelect(detail.value)
      onClose()
    }

    menu.addEventListener('vsc-context-menu-select', handleSelect)
    return () => menu.removeEventListener('vsc-context-menu-select', handleSelect)
  }, [open, onSelect, onClose])

  useEffect(() => {
    if (!open) return

    const handleOutside = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (menuRef.current?.contains(target)) return
      if (ignoreSelector && target.closest(ignoreSelector)) return
      onClose()
    }

    document.addEventListener('mousedown', handleOutside, true)
    return () => document.removeEventListener('mousedown', handleOutside, true)
  }, [open, onClose, ignoreSelector])

  if (!open) return null

  const left = Math.max(VIEWPORT_MARGIN, Math.min(x, window.innerWidth - APPROX_MENU_WIDTH))
  const top = Math.max(VIEWPORT_MARGIN, Math.min(y, window.innerHeight - APPROX_MENU_HEIGHT))

  return createPortal(
    <div className="context-menu-positioner" style={{ left, top }}>
      <vscode-context-menu
        ref={(element) => {
          menuRef.current = element as ContextMenuElement | null
        }}
      />
    </div>,
    document.body,
  )
}
