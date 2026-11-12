// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { resizeFromKey, resizeFromPointer } from './resize'

const bounds = { min: 180, max: 640 }

const pointer = (overrides: Partial<Parameters<typeof resizeFromPointer>[0]> = {}) =>
  resizeFromPointer({
    side: 'left',
    startSize: 300,
    startPosition: 100,
    position: 100,
    ...bounds,
    ...overrides,
  })

const key = (overrides: Partial<Parameters<typeof resizeFromKey>[0]> = {}) =>
  resizeFromKey({
    side: 'left',
    orientation: 'vertical',
    size: 300,
    key: 'ArrowRight',
    shift: false,
    ...bounds,
    ...overrides,
  })

describe('resizeFromPointer', () => {
  it('grows a left region when the pointer moves right', () => {
    expect(pointer({ position: 140 })).toBe(340)
  })

  it('shrinks a left region when the pointer moves left', () => {
    expect(pointer({ position: 60 })).toBe(260)
  })

  it('shrinks a right region when the pointer moves right', () => {
    expect(pointer({ side: 'right', position: 140 })).toBe(260)
  })

  it('grows a right region when the pointer moves left', () => {
    expect(pointer({ side: 'right', position: 60 })).toBe(340)
  })

  it('shrinks a bottom region when the pointer moves down', () => {
    expect(pointer({ side: 'bottom', position: 140 })).toBe(260)
  })

  it('grows a bottom region when the pointer moves up', () => {
    expect(pointer({ side: 'bottom', position: 60 })).toBe(340)
  })

  it('clamps at the minimum', () => {
    expect(pointer({ position: -10_000 })).toBe(180)
  })

  it('clamps at the maximum', () => {
    expect(pointer({ position: 10_000 })).toBe(640)
  })
})

describe('resizeFromKey', () => {
  it('steps a left region by 10 with the arrow keys', () => {
    expect(key({ key: 'ArrowRight' })).toBe(310)
    expect(key({ key: 'ArrowLeft' })).toBe(290)
  })

  it('changes nothing when the step would leave the range', () => {
    expect(key({ key: 'ArrowLeft', size: 180 })).toBe(180)
    expect(key({ key: 'ArrowRight', size: 640 })).toBe(640)
  })

  it('reverses the horizontal arrows for a right region', () => {
    expect(key({ side: 'right', key: 'ArrowLeft' })).toBe(310)
    expect(key({ side: 'right', key: 'ArrowRight' })).toBe(290)
  })

  it('steps a bottom region with the up and down arrows', () => {
    expect(key({ side: 'bottom', orientation: 'horizontal', key: 'ArrowUp' })).toBe(310)
    expect(key({ side: 'bottom', orientation: 'horizontal', key: 'ArrowDown' })).toBe(290)
  })

  it('steps by 50 when Shift is held', () => {
    expect(key({ shift: true, key: 'ArrowRight' })).toBe(350)
    expect(key({ shift: true, key: 'ArrowLeft' })).toBe(250)
  })

  it('jumps to the bounds with Home and End', () => {
    expect(key({ key: 'Home' })).toBe(180)
    expect(key({ key: 'End' })).toBe(640)
  })

  it('returns null for keys it does not handle', () => {
    expect(key({ key: 'a' })).toBeNull()
    expect(key({ key: 'Tab' })).toBeNull()
    expect(key({ key: 'ArrowUp' })).toBeNull()
    expect(key({ side: 'bottom', orientation: 'horizontal', key: 'ArrowLeft' })).toBeNull()
  })
})
