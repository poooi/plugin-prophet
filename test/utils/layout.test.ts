import { describe, it, expect } from 'vitest'
import { getAutoLayout, combinedFleetType } from '../../src/utils/layout'

describe('getAutoLayout', () => {
  it('returns horizontal when height < 300', () => {
    expect(getAutoLayout(800, 200)).toBe('horizontal')
    expect(getAutoLayout(400, 299)).toBe('horizontal')
  })

  it('returns horizontal when width/height ratio > 3/5', () => {
    // height * 5 < width * 3  →  width > height * 5/3
    // e.g. height=600, width * 3 > 600 * 5 = 3000, width > 1000
    expect(getAutoLayout(1001, 600)).toBe('horizontal')
    expect(getAutoLayout(1500, 600)).toBe('horizontal')
  })

  it('returns vertical for tall/narrow layouts', () => {
    expect(getAutoLayout(400, 600)).toBe('vertical')
    expect(getAutoLayout(500, 800)).toBe('vertical')
  })

  it('returns vertical when dimensions are equal (square)', () => {
    // 400*5 = 2000, 400*3 = 1200; 2000 > 1200 → not horizontal
    expect(getAutoLayout(400, 400)).toBe('vertical')
  })
})

describe('combinedFleetType', () => {
  it('maps 0 to Sortie Fleet', () => {
    expect(combinedFleetType[0]).toBe('Sortie Fleet')
  })

  it('maps 1 to Carrier Task Force', () => {
    expect(combinedFleetType[1]).toBe('Carrier Task Force')
  })

  it('maps 2 to Surface Task Force', () => {
    expect(combinedFleetType[2]).toBe('Surface Task Force')
  })

  it('maps 3 to Transport Escort', () => {
    expect(combinedFleetType[3]).toBe('Transport Escort')
  })
})
