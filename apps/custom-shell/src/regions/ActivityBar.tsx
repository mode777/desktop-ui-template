import { ActivityBar as ActivityBarPrimitive } from '@workbench-kit/react'
import type { ActivityId, ActivityItem } from '../data'

interface ActivityBarProps {
  items: ActivityItem[]
  activeId: ActivityId
  primaryVisible: boolean
  onSelect: (id: ActivityId) => void
  onShowAbout: () => void
}

export function ActivityBar({
  items,
  activeId,
  primaryVisible,
  onSelect,
  onShowAbout,
}: ActivityBarProps) {
  const mappedItems = items.map((item) => ({
    ...item,
    title: `${primaryVisible && item.id === activeId ? 'Hide' : 'Show'} ${item.title}`,
  }))

  return (
    <ActivityBarPrimitive
      items={mappedItems}
      activeId={primaryVisible ? activeId : null}
      bottomItems={[{ id: 'about', title: 'Show example notes', icon: 'question' }]}
      onActivate={(id) => onSelect(id as ActivityId)}
      onAction={(id) => {
        if (id === 'about') onShowAbout()
      }}
    />
  )
}
