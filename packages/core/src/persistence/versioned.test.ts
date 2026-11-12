// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import type { StorageAdapter } from './adapter'
import { readVersioned, writeVersioned } from './versioned'

interface MemoryAdapter extends StorageAdapter {
  entries: Map<string, string>
}

function createMemoryAdapter(initial: Record<string, string> = {}): MemoryAdapter {
  const entries = new Map(Object.entries(initial))
  return {
    entries,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value)
    },
    removeItem: (key) => {
      entries.delete(key)
    },
  }
}

const fallback = { theme: 'dark', width: 300 }

describe('writeVersioned / readVersioned', () => {
  it('round-trips state and records the current version', () => {
    const adapter = createMemoryAdapter()
    const state = { theme: 'light', width: 420 }

    expect(writeVersioned(adapter, 'workbench', 2, state)).toBe(true)

    expect(readVersioned(adapter, 'workbench', { version: 2, fallback })).toEqual(state)
    expect(JSON.parse(adapter.entries.get('workbench') ?? '')).toEqual({
      version: 2,
      state,
    })
  })

  it('returns the fallback when nothing is stored', () => {
    const adapter = createMemoryAdapter()
    expect(readVersioned(adapter, 'missing', { version: 2, fallback })).toBe(fallback)
  })

  it('returns the fallback when the adapter throws', () => {
    const adapter: StorageAdapter = {
      getItem: () => {
        throw new Error('storage disabled')
      },
      setItem: () => undefined,
    }

    expect(readVersioned(adapter, 'workbench', { version: 2, fallback })).toBe(fallback)
  })

  it('returns the fallback for malformed JSON', () => {
    const adapter = createMemoryAdapter({ workbench: '{not json' })
    expect(readVersioned(adapter, 'workbench', { version: 2, fallback })).toBe(fallback)
  })

  it('returns the fallback for a payload without a versioned envelope', () => {
    const adapter = createMemoryAdapter({ workbench: JSON.stringify({ theme: 'dark' }) })
    expect(readVersioned(adapter, 'workbench', { version: 2, fallback })).toBe(fallback)
  })

  it('does not migrate when the stored version matches', () => {
    const adapter = createMemoryAdapter()
    const migrate = vi.fn(() => fallback)
    writeVersioned(adapter, 'workbench', 2, fallback)

    expect(readVersioned(adapter, 'workbench', { version: 2, fallback, migrate })).toEqual(fallback)
    expect(migrate).not.toHaveBeenCalled()
  })

  it('uses the migration result for a different stored version', () => {
    const adapter = createMemoryAdapter({
      workbench: JSON.stringify({ version: 1, state: { theme: 'light' } }),
    })
    const migrate = vi.fn(() => ({ theme: 'light', width: 280 }))

    expect(readVersioned(adapter, 'workbench', { version: 2, fallback, migrate })).toEqual({
      theme: 'light',
      width: 280,
    })
    expect(migrate).toHaveBeenCalledWith({ version: 1, state: { theme: 'light' } })
  })

  it('returns the fallback for an unknown version without a migration', () => {
    const adapter = createMemoryAdapter({
      workbench: JSON.stringify({ version: 1, state: { theme: 'light' } }),
    })

    expect(readVersioned(adapter, 'workbench', { version: 2, fallback })).toBe(fallback)
  })

  it('reports a failed write without throwing', () => {
    const adapter: StorageAdapter = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded')
      },
    }

    expect(writeVersioned(adapter, 'workbench', 2, fallback)).toBe(false)
  })
})
