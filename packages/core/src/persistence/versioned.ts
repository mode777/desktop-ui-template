/**
 * Versioned persistence over an injected {@link StorageAdapter}.
 *
 * The stored payload is an envelope: `{ version, state }`. Reads are total —
 * a missing key, an unreadable payload, an adapter failure or an unmigratable
 * version all return the caller's fallback instead of throwing.
 *
 * This module is the seam the preset will use when it takes over persistence;
 * nothing in the current application imports it yet, which is why it costs
 * nothing in the shipped bundle.
 */

import type { StorageAdapter } from './adapter'

export interface StoredEnvelope {
  version: number
  state: unknown
}

export interface ReadVersionedOptions<T> {
  /** Schema version this build understands. */
  version: number
  /** Returned when nothing usable is stored. */
  fallback: T
  /** Converts an envelope written by another version into current state. */
  migrate?: (stored: StoredEnvelope) => T
}

function parseEnvelope(raw: string): StoredEnvelope | null {
  const parsed: unknown = JSON.parse(raw)
  if (typeof parsed !== 'object' || parsed === null) return null

  const record = parsed as Record<string, unknown>
  if (typeof record.version !== 'number' || !Number.isFinite(record.version)) return null
  if (!('state' in record)) return null

  return { version: record.version, state: record.state }
}

/** Reads and unwraps the stored envelope, falling back instead of throwing. */
export function readVersioned<T>(
  adapter: StorageAdapter,
  key: string,
  { version, fallback, migrate }: ReadVersionedOptions<T>,
): T {
  try {
    const raw = adapter.getItem(key)
    if (raw === null) return fallback

    const envelope = parseEnvelope(raw)
    if (!envelope) return fallback
    if (envelope.version === version) return envelope.state as T
    if (migrate) return migrate(envelope)

    return fallback
  } catch {
    return fallback
  }
}

/** Wraps state in a versioned envelope and stores it. Returns false when the write fails. */
export function writeVersioned<T>(
  adapter: StorageAdapter,
  key: string,
  version: number,
  state: T,
): boolean {
  const envelope: StoredEnvelope = { version, state }
  try {
    adapter.setItem(key, JSON.stringify(envelope))
    return true
  } catch {
    return false
  }
}
