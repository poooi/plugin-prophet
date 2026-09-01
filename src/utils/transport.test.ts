import { describe, expect, it } from 'vitest'
import type { Ship } from 'poi-lib-battle'

import {
  getTransportPoint,
  getTransportPointFromFleets,
  parseTankTransportMaps,
} from './transport'

// the TP tables key off the equipment category in api_type[2]
const landingCraft = new Set([68, 166, 193, 230, 355, 408, 409, 436, 449, 482, 494, 495, 514, 576])
const amphibious = new Set([167, 525, 526])
const tanks = new Set([496, 497, 498, 499])
const rations = new Set([145, 150, 241])

const category = (apiSlotitemId: number): number => {
  if (landingCraft.has(apiSlotitemId)) return 24
  if (amphibious.has(apiSlotitemId)) return 46
  if (tanks.has(apiSlotitemId)) return 52
  if (rations.has(apiSlotitemId)) return 43
  return apiSlotitemId === 75 ? 30 : 1
}

const slotItem = (apiSlotitemId: number, apiTypeId = category(apiSlotitemId)): ApiSlotItemLike => ({
  api_id: apiSlotitemId,
  api_level: 0,
  api_locked: 0,
  api_slotitem_id: apiSlotitemId,
  api_name: String(apiSlotitemId),
  api_type: [0, 0, apiTypeId, 0, 0],
})

const equipSlots = (...items: ApiSlotItemLike[]): [ApiSlotItemLike][] =>
  items.map((item) => [item])

// [api_stype, api_ship_id, equipment ids]
type FleetFixture = [number, number, number[]][]

const shipsOf = (fleet: FleetFixture) =>
  fleet.map(([api_stype, api_ship_id], index) => ({
    api_id: index,
    api_nowhp: 10,
    api_maxhp: 10,
    api_stype,
    api_ship_id,
  }))

const equipsOf = (fleet: FleetFixture) =>
  fleet.map(([, , items]) => equipSlots(...items.map((item) => slotItem(item))))

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

  it('scores equipment by category, so unknown landing craft still count', () => {
    const ships = [{ api_id: 1, api_nowhp: 10, api_maxhp: 10, api_stype: 2, api_ship_id: 1 }]
    const equips = [equipSlots(slotItem(9999, 24))]

    // 8 for the landing craft, 6 in tank mode, on top of the destroyer itself
    expect(getTransportPoint(ships, equips)).toEqual({ total: 13, actual: 13 })
    expect(getTransportPoint(ships, equips, [], 'tank')).toEqual({ total: 9, actual: 9 })
  })

  it('get the equipment category from the master', () => {
    const ships = [{ api_id: 114, api_nowhp: 514, api_maxhp: 666, api_stype: 1, api_ship_id: 325 }]
    const memberItem = { api_id: 1, api_level: 0, api_locked: 0, api_slotitem_id: 576 } // R35
    const masterItem = { api_type: [0, 0, 24, 0, 0] }
    const equip: [typeof memberItem, typeof masterItem] = [memberItem, masterItem]
    const equips = [[equip]]

    expect(getTransportPoint(ships, equips)).toEqual({ total: 8, actual: 8 })
    expect(getTransportPoint(ships, equips, [], 'tank')).toEqual({ total: 24, actual: 24 })
  })

  it('adds the 鬼怒改二 bonus once, and does not scale it in tank mode', () => {
    const kinu: FleetFixture = [
      [3, 487, [68]],
      [2, 1, [68]],
    ]
    const fleet = [shipsOf(kinu), equipsOf(kinu)] as const

    // 鬼怒改二 2 + 8 bonus + 8 daihatsu, destroyer 5 + 8
    expect(getTransportPoint(...fleet)).toEqual({ total: 31, actual: 31 })
    // tank: 1.5 + 8 (unscaled) + 6, 3.75 + 6 -> 25.25
    expect(getTransportPoint(...fleet, [], 'tank')).toEqual({ total: 25, actual: 25 })
  })

  // 2026 summer E-5 transport fleet, checked against the in-game 艦隊戦力分析 panel:
  // 205 on the normal transport map, 446 on the tank transport one (E-5-2)
  describe('2026 summer E-5 fleet', () => {
    const fleet: FleetFixture = [
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

    it('matches the in-game normal transport value', () => {
      expect(getTransportPoint(shipsOf(fleet), equipsOf(fleet))).toEqual({
        total: 205,
        actual: 205,
      })
    })

    it('matches the in-game tank transport value', () => {
      expect(getTransportPoint(shipsOf(fleet), equipsOf(fleet), [], 'tank')).toEqual({
        total: 446,
        actual: 446,
      })
    })
  })

  // second E-5-2 fleet, checked against `api_landing_hp.api_sub_value` = 468 at S rank.
  // 鬼怒改二 sits in the escort fleet: its bonus is what makes this 468 and not 466
  it('matches the tank transport value of a fleet with 鬼怒改二', () => {
    const fleet: FleetFixture = [
      [9, 918, [276, 276, 107, 515]], // Maryland改
      [10, 411, [290, 318, 526, 538, 483]], // 扶桑改二
      [10, 412, [290, 290, 526, 471, 483]], // 山城改二
      [7, 283, [100, 244, 422, 473, 274]], // 飛鷹改
      [16, 348, [576, 449, 495, 274]], // 瑞穂
      [2, 960, [576, 449, 495, 517]], // 清霜改二
      [3, 487, [166, 166, 436, 173]], // 鬼怒改二
      [2, 587, [514, 449, 230]],
      [2, 667, [514, 355, 230]],
      [2, 469, [436, 482, 230]],
      [2, 498, [166, 166, 494]],
      [4, 146, [309, 179, 179, 412]], // 木曾改二
    ]

    expect(getTransportPoint(shipsOf(fleet), equipsOf(fleet), [], 'tank')).toEqual({
      total: 468,
      actual: 468,
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
          poi_slot: [slotItem(75)],
          poi_slot_ex: slotItem(167),
        },
      },
      null,
    ] as (Ship | null)[]

    expect(getTransportPointFromFleets([ships])).toEqual({ total: 12, actual: 12 })
    expect(getTransportPointFromFleets([ships], { mode: 'tank' })).toEqual({ total: 20, actual: 20 })
    expect(getTransportPointFromFleets([ships], { escapedShipIds: [1] })).toEqual({ total: 12, actual: 0 })
  })
})
