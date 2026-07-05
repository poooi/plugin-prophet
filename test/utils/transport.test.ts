import { describe, it, expect } from 'vitest'
import { getTPDazzyDing } from '../../src/utils/transport'

const makeShip = (
  stype: number,
  shipId: number,
  nowHP: number,
  maxHP: number,
  slotItems: number[] = [],
  id = 1,
) => ({
  raw: {
    api_stype: stype,
    api_ship_id: shipId,
    api_id: id,
    api_nowhp: nowHP,
    api_maxhp: maxHP,
    poi_slot: slotItems.map((slotitem_id) => ({ api_slotitem_id: slotitem_id })),
    poi_slot_ex: null,
  },
})

describe('getTPDazzyDing', () => {
  it('returns zero when no ships', () => {
    expect(getTPDazzyDing([])).toEqual({ total: 0, actual: 0 })
  })

  it('returns zero for null ships', () => {
    expect(getTPDazzyDing([null, undefined])).toEqual({ total: 0, actual: 0 })
  })

  it('returns zero total (but has actual) for DD with no equipment', () => {
    // DD has 5 ship TP, but total is 0 when equipTP is 0
    const ship = makeShip(2, 100, 30, 30)
    const result = getTPDazzyDing([ship])
    expect(result.total).toBe(0) // no equipment → total=0
    expect(result.actual).toBe(5) // actual still counts ship TP
  })

  it('calculates TP when ship has drum canisters (item 75 = 5 TP each)', () => {
    // DD(5) + drum(5) + drum(5) = 15 total
    const ship = makeShip(2, 100, 30, 30, [75, 75])
    const result = getTPDazzyDing([ship])
    expect(result.total).toBe(15)
    expect(result.actual).toBe(15)
  })

  it('calculates TP for transport ship (stype=15 = 15 TP)', () => {
    const ship = makeShip(15, 100, 50, 50, [75]) // 15 + 5 = 20
    const result = getTPDazzyDing([ship])
    expect(result.total).toBe(20)
    expect(result.actual).toBe(20)
  })

  it('excludes heavily damaged ships (nowHP * 4 <= maxHP) from actual TP', () => {
    // nowHP=5, maxHP=30 → 5*4=20 <= 30 → damaged → excluded from actual
    const ship = makeShip(2, 100, 5, 30, [75])
    const result = getTPDazzyDing([ship])
    expect(result.total).toBe(10) // 5 + 5
    expect(result.actual).toBe(0) // excluded
  })

  it('excludes escaped ships from actual TP', () => {
    const ship = makeShip(2, 100, 30, 30, [75], 42)
    const result = getTPDazzyDing([ship], [42])
    expect(result.total).toBe(10)
    expect(result.actual).toBe(0)
  })

  it('handles Kinu Kai Ni (ship 487, +8 TP)', () => {
    const ship = makeShip(3, 487, 30, 30, [75]) // 2 (CL) + 8 (Kinu) + 5 (drum) = 15
    const result = getTPDazzyDing([ship])
    expect(result.total).toBe(15)
    expect(result.actual).toBe(15)
  })

  it('handles Daihatsu (item 68 = 8 TP)', () => {
    const ship = makeShip(2, 100, 30, 30, [68]) // 5 + 8 = 13
    const result = getTPDazzyDing([ship])
    expect(result.total).toBe(13)
    expect(result.actual).toBe(13)
  })

  it('sums TP across multiple ships', () => {
    const dd1 = makeShip(2, 100, 30, 30, [75], 1)
    const dd2 = makeShip(2, 101, 30, 30, [75], 2)
    const result = getTPDazzyDing([dd1, dd2])
    expect(result.total).toBe(20) // 2 × (5+5)
    expect(result.actual).toBe(20)
  })
})
