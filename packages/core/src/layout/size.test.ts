// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { clampSize } from './size'

describe('clampSize', () => {
  it('returns the minimum when the requested size is below it', () => {
    expect(clampSize(120, 180, 640)).toBe(180)
  })

  it('returns the maximum when the requested size is above it', () => {
    expect(clampSize(900, 180, 640)).toBe(640)
  })

  it('returns the requested size when it is inside the range', () => {
    expect(clampSize(300, 180, 640)).toBe(300)
  })

  it('keeps values inside equal bounds', () => {
    expect(clampSize(10, 200, 200)).toBe(200)
    expect(clampSize(500, 200, 200)).toBe(200)
    expect(clampSize(200, 200, 200)).toBe(200)
  })

  it('accepts the exact bounds', () => {
    expect(clampSize(180, 180, 640)).toBe(180)
    expect(clampSize(640, 180, 640)).toBe(640)
  })
})
