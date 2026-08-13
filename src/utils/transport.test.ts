import { describe, expect, it } from 'vitest'
import type { Ship } from 'poi-lib-battle'

import { getTPDazzyDing, getTransportPoint, parseTankTransportMaps } from './transport'

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

  // 2026 summer E-5 transport fleet, checked against the in-game 艦隊戦力分析 panel:
  // 205 on the normal transport map, 446 on the tank transport one (E-5-2)
  describe('2026 summer E-5 fleet', () => {
    const fleet: [number, number, number[]][] = [
      [22, 1008, [56, 56, 107]], // しまね丸改
      [17, 727, [499, 498, 497]], // 第百一号輸送艦
      [2, 548, [166, 230, 230]],
      [2, 418, [495, 449, 230]],
      [2, 435, [436, 495, 514]],
      [2, 434, [514, 449, 436]],
      [3, 693, [520, 520, 538, 126]],
      [5, 428, [50, 362, 279, 118, 483]],
      [2, 489, [576, 167, 355]],
      [2, 568, [167, 526, 526]],
      [2, 745, [366, 366, 449, 575]],
      [2, 959, [455, 294, 482]],
    ]
    const ships = fleet.map(([api_stype, api_ship_id], index) => ({
      api_id: index,
      api_nowhp: 10,
      api_maxhp: 10,
      api_stype,
      api_ship_id,
    }))
    const equips = fleet.map(([, , items]) => equipSlots(...items.map(slotItem)))

    it('matches the in-game normal transport value', () => {
      expect(getTransportPoint(ships, equips)).toEqual({ total: 205, actual: 205 })
    })

    it('matches the in-game tank transport value', () => {
      expect(getTransportPoint(ships, equips, [], 'tank')).toEqual({ total: 446, actual: 446 })
    })
  })

  it('reads tank transport maps off chart_additional_info', () => {
    expect(
      parseTankTransportMaps({
        api_deck_param: [
          { api_seiku_value: 139, api_tp_value: 205, api_atp_value: { 625: 446 } },
          { api_seiku_value: 0, api_tp_value: 0 },
          { api_seiku_value: 0, api_tp_value: 12, api_atp_value: { 624: 0, 625: 30 } },
        ],
      }),
    ).toEqual([625])
    expect(parseTankTransportMaps({})).toEqual([])
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
