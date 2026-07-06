import { describe, expect, it } from 'vitest'
import type { Ship } from 'poi-lib-battle'

import { getTPDazzyDing, getTransportPoint } from './transport'

const slotItem = (apiSlotitemId: number): ApiSlotItemLike => ({
  api_id: apiSlotitemId,
  api_level: 0,
  api_locked: 0,
  api_slotitem_id: apiSlotitemId,
  api_name: String(apiSlotitemId),
  api_type: [],
})

const equipSlots = (...items: ApiSlotItemLike[]): [ApiSlotItemLike, ...unknown[]][] =>
  items.map((item) => [item])

describe('transport point helpers', () => {
  it('calculates total and actual TP from ship and equipment data', () => {
    expect(
      getTransportPoint(
        [
          { api_id: 1, api_nowhp: 10, api_maxhp: 20, api_stype: 2, api_ship_id: 1 },
          { api_id: 2, api_nowhp: 4, api_maxhp: 20, api_stype: 3, api_ship_id: 487 },
        ],
        [
          equipSlots(slotItem(75)),
          equipSlots(slotItem(999)),
        ],
      ),
    ).toEqual({ total: 20, actual: 10 })
  })

  it('excludes escaped ships from actual TP', () => {
    expect(
      getTransportPoint(
        [{ api_id: 1, api_nowhp: 10, api_maxhp: 20, api_stype: 2, api_ship_id: 1 }],
        [equipSlots(slotItem(75))],
        [1],
      ),
    ).toEqual({ total: 10, actual: 0 })
  })

  it('returns zero total when no transport equipment exists', () => {
    expect(
      getTransportPoint(
        [{ api_id: 1, api_nowhp: 10, api_maxhp: 20, api_stype: 2, api_ship_id: 1 }],
        [[]],
      ),
    ).toEqual({ total: 0, actual: 5 })
  })

  it('calculates TP from lib-battle ship raw data', () => {
    const ships = [
      {
        raw: {
          api_id: 1,
          api_nowhp: 10,
          api_maxhp: 20,
          api_stype: 2,
          api_ship_id: 1,
          poi_slot: [{ api_slotitem_id: 75 }],
          poi_slot_ex: { api_slotitem_id: 167 },
        },
      },
      null,
    ] as (Ship | null)[]

    expect(getTPDazzyDing(ships)).toEqual({ total: 12, actual: 12 })
    expect(getTPDazzyDing(ships, [1])).toEqual({ total: 12, actual: 0 })
  })
})
