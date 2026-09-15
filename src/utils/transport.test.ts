import { describe, expect, it } from 'vitest'
import type { APIGetMemberShip2Response } from 'kcsapi/api_get_member/ship2/response'
import type { APIGetMemberSlotItemResponse } from 'kcsapi/api_get_member/slot_item/response'
import type { APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'

import type { ProphetEquipEntry, ProphetFleetEntry } from '../types'
import {
  calculateTransport,
  parseTankTransportMaps,
} from './transport'

// Categories for the two recorded fleet fixtures below.
const landingCraft = new Set([68, 166, 193, 230, 355, 408, 409, 436, 449, 482, 494, 495, 514, 576])
const amphibious = new Set([167, 525, 526])
const tanks = new Set([496, 497, 498, 499])
const rations = new Set([145, 150, 241])

const category = (itemId: number): number => {
  if (landingCraft.has(itemId)) return 24
  if (amphibious.has(itemId)) return 46
  if (tanks.has(itemId)) return 52
  if (rations.has(itemId)) return 43
  return itemId === 75 ? 30 : 1
}

const memberShip = (api_id: number, api_ship_id: number, nowhp = 10, maxhp = 10) =>
  ({ api_id, api_ship_id, api_nowhp: nowhp, api_maxhp: maxhp }) as APIGetMemberShip2Response

const masterShip = (api_stype: number) => ({ api_stype }) as APIMstShip

const memberItem = (api_slotitem_id: number) =>
  ({ api_slotitem_id }) as APIGetMemberSlotItemResponse

const masterItem = (api_type: number) =>
  ({ api_type: [0, 0, api_type, 0, 0] }) as APIMstSlotitem

// The calculator consumes the Poi selector shape directly:
// [member, master] ships and [member, master, onslot] slots.
const slot = (itemId: number, itemType = category(itemId)): ProphetEquipEntry =>
  [memberItem(itemId), masterItem(itemType), undefined]

// Empty slots are undefined at runtime, which is the only place undefined appears.
type EquipSlots = (ProphetEquipEntry | undefined)[][][]

// [ship type, master ship ID, equipment master IDs, now HP?, max HP?]
type ShipFixture = [number, number, number[], number?, number?]
type FleetFixture = ShipFixture[]

const fleetsOf = (fixture: FleetFixture[]): {
  fleets: ProphetFleetEntry[][]
  equips: ProphetEquipEntry[][][]
} => ({
  fleets: fixture.map((fleet, fleetIndex) => fleet.map(
    ([api_stype, api_ship_id, , nowhp = 10, maxhp = 10], shipIndex) => [
      memberShip(fleetIndex * 6 + shipIndex + 1, api_ship_id, nowhp, maxhp),
      masterShip(api_stype),
    ] as ProphetFleetEntry,
  )),
  equips: fixture.map((fleet) => fleet.map(
    ([, , itemIds]) => itemIds.map((itemId) => slot(itemId)),
  )),
})

describe('calculateTransport', () => {
  it('scores all ships for planned TP and eligible ships for deliverable TP', () => {
    const allEligible = fleetsOf([[[2, 1, [75]], [3, 487, [999]]]])
    expect(calculateTransport(allEligible.fleets, allEligible.equips)).toEqual({
      planned: 20, deliverable: 20, hasTransportCargo: true,
    })
    const kinuIneligible = fleetsOf([[[2, 1, [75]], [3, 487, [999], 0]]])
    expect(calculateTransport(kinuIneligible.fleets, kinuIneligible.equips)).toEqual({
      planned: 20, deliverable: 10, hasTransportCargo: true,
    })
    const noneEligible = fleetsOf([[[2, 1, [75], 0], [3, 487, [999], 0]]])
    expect(calculateTransport(noneEligible.fleets, noneEligible.equips).deliverable).toBe(0)
  })

  it('keeps ship capacity even when there is no transport cargo', () => {
    const { fleets, equips } = fleetsOf([[[2, 1, []]]])
    expect(calculateTransport(fleets, equips)).toEqual({
      planned: 5, deliverable: 5, hasTransportCargo: false,
    })
    expect(calculateTransport([], [])).toEqual({
      planned: 0, deliverable: 0, hasTransportCargo: false,
    })
    expect(calculateTransport([[]], [[]], { mode: 'tank' })).toEqual({
      planned: 0, deliverable: 0, hasTransportCargo: false,
    })
  })

  it('ignores equipment left in a slot without a ship', () => {
    const fleets: ProphetFleetEntry[][] = [[[memberShip(1, 2), masterShip(2)], undefined]]
    const equips: ProphetEquipEntry[][][] = [[[], [slot(68, 24)]]]
    expect(calculateTransport(fleets, equips)).toEqual({
      planned: 5, deliverable: 5, hasTransportCargo: false,
    })
  })

  it.each([[5, false], [6, true]])(
    'uses the raw member HP threshold at %i / 20 HP',
    (nowhp, eligible) => {
      const { fleets, equips } = fleetsOf([[[2, 1, [], nowhp, 20]]])
      expect(calculateTransport(fleets, equips).deliverable).toBe(eligible ? 5 : 0)
    },
  )

  it('treats retreated member IDs as ineligible but not master ship IDs', () => {
    const fleets: ProphetFleetEntry[][] = [[[memberShip(101, 1), masterShip(2)]]]
    const equips: EquipSlots = [[[slot(68, 24)]]]
    expect(calculateTransport(fleets, equips, { escapedShipIds: [101] }).deliverable).toBe(0)
    expect(calculateTransport(fleets, equips, { escapedShipIds: [1] }).deliverable).toBe(13)
  })

  it('keeps ship and equipment positions aligned when a slot has no ship', () => {
    const fleets: ProphetFleetEntry[][] = [[
      undefined,
      [memberShip(2, 3), masterShip(2)] as ProphetFleetEntry,
    ]]
    const withPhantomCargo: EquipSlots = [[[slot(576, 24)], [slot(68, 24)]]]
    expect(calculateTransport(fleets, withPhantomCargo)).toEqual({
      planned: 13, deliverable: 13, hasTransportCargo: true,
    })
    const phantomOnly: EquipSlots = [[[slot(576, 24)], []]]
    expect(calculateTransport(fleets, phantomOnly)).toEqual({
      planned: 5, deliverable: 5, hasTransportCargo: false,
    })
  })

  it('reads member equipment against master categories and counts the expansion slot once', () => {
    const fleets: ProphetFleetEntry[][] = [[[memberShip(114, 1), masterShip(2)]]]
    const equips: EquipSlots = [[[
      slot(576, 24),
      undefined,
      slot(167, 46),
    ]]]
    expect(calculateTransport(fleets, equips)).toEqual({
      planned: 15, deliverable: 15, hasTransportCargo: true,
    })
    // Destroyer 3.75 + R35 24 + Ka-Mi 12.5 = 40.25.
    expect(calculateTransport(fleets, equips, { mode: 'tank' })).toEqual({
      planned: 40, deliverable: 40, hasTransportCargo: true,
    })
  })

  it('keeps counting equipment when the ship master is missing', () => {
    const fleets: ProphetFleetEntry[][] = [[
      [memberShip(1, 487), undefined] as unknown as ProphetFleetEntry,
    ]]
    const equips: EquipSlots = [[[slot(68, 24)]]]
    expect(calculateTransport(fleets, equips)).toEqual({
      planned: 16, deliverable: 16, hasTransportCargo: true,
    })
  })

  it.each([
    [2, 5], [3, 2], [21, 6], [6, 4], [10, 7], [16, 9],
    [14, 1], [17, 12], [15, 15], [22, 15], [20, 7], [4, 0], [999, 0],
  ])('scores ship type %i with base %i', (shipType, base) => {
    const { fleets, equips } = fleetsOf([[[shipType, 1, []]]])
    expect(calculateTransport(fleets, equips).planned).toBe(base)
    expect(calculateTransport(fleets, equips, { mode: 'tank' }).planned).toBe(Math.floor(base * 0.75))
  })

  it.each([
    [576, 24, 8, 24], [514, 24, 8, 23], [449, 24, 8, 21],
    [355, 24, 8, 20], [230, 24, 8, 19], [495, 24, 8, 19],
    [482, 24, 8, 19], [494, 24, 8, 17], [436, 24, 8, 16],
    [166, 24, 8, 14], [68, 24, 8, 6], [9999, 24, 8, 6],
    [526, 46, 2, 13.5], [167, 46, 2, 12.5], [525, 46, 2, 11.5],
    [499, 52, 0, 14], [498, 52, 0, 9], [497, 52, 0, 7], [496, 52, 0, 5],
    [75, 30, 5, 3.75], [145, 43, 1, 0.75], [9999, 1, 0, 0],
  ])('scores equipment %i in category %i', (itemId, itemCategory, normal, tank) => {
    // Four copies expose fractional values without per-item rounding.
    const items = Array.from({ length: 4 }, () => slot(itemId, itemCategory))
    const fleets: ProphetFleetEntry[][] = [[[memberShip(1, 1), masterShip(1)]]]
    const equips: ProphetEquipEntry[][][] = [[items]]
    expect(calculateTransport(fleets, equips)).toEqual({
      planned: normal * 4, deliverable: normal * 4, hasTransportCargo: normal > 0,
    })
    expect(calculateTransport(fleets, equips, { mode: 'tank' })).toEqual({
      planned: tank * 4, deliverable: tank * 4, hasTransportCargo: tank > 0,
    })
  })

  it('combines fractional ship and equipment contributions before rounding', () => {
    const { fleets, equips } = fleetsOf([[[2, 1, [75, 167]]]])
    expect(calculateTransport(fleets, equips).planned).toBe(12)
    // Destroyer 3.75 + drum 3.75 + Ka-Mi 12.5.
    expect(calculateTransport(fleets, equips, { mode: 'tank' }).planned).toBe(20)
  })

  it('floors main and escort fleets separately, including after eligibility filtering', () => {
    const { fleets, equips } = fleetsOf([
      [[2, 1, [68]], [6, 2, [], 0]],
      [[2, 3, []]],
    ])
    expect(calculateTransport(fleets, equips, { mode: 'tank' })).toEqual({
      planned: 15, deliverable: 12, hasTransportCargo: true,
    })
    expect(calculateTransport([fleets.flat()], [equips.flat()], { mode: 'tank' }).planned).toBe(16)
  })

  it('keeps the Kinu bonus unscaled', () => {
    const { fleets, equips } = fleetsOf([[[3, 487, [68]], [2, 1, [68]]]])
    expect(calculateTransport(fleets, equips).planned).toBe(31)
    expect(calculateTransport(fleets, equips, { mode: 'tank' }).planned).toBe(25)
  })

  it.each(['normal', 'tank'] as const)(
    'counts Kinu once across fleets and independently of eligibility/order (%s)',
    (mode) => {
      const expected = mode === 'normal'
        ? { planned: 12, deliverable: 10, hasTransportCargo: false }
        : { planned: 10, deliverable: 9, hasTransportCargo: false }
      const split = fleetsOf([[[3, 487, [], 0]], [[3, 487, []]]])
      const reversed = fleetsOf([[[3, 487, []]], [[3, 487, [], 0]]])
      expect(calculateTransport(split.fleets, split.equips, { mode })).toEqual(expected)
      expect(calculateTransport(reversed.fleets, reversed.equips, { mode })).toEqual(expected)

      const together = fleetsOf([[[3, 487, [], 0], [3, 487, []]]])
      const togetherReversed = fleetsOf([[[3, 487, []], [3, 487, [], 0]]])
      const sameFleet = mode === 'normal' ? 12 : 11
      expect(calculateTransport(together.fleets, together.equips, { mode }).planned).toBe(sameFleet)
      expect(calculateTransport(together.fleets, together.equips, { mode }).deliverable)
        .toBe(expected.deliverable)
      expect(calculateTransport(togetherReversed.fleets, togetherReversed.equips, { mode }).deliverable)
        .toBe(expected.deliverable)

      const noneEligible = fleetsOf([[[3, 487, [], 0], [3, 487, [], 0]]])
      expect(calculateTransport(noneEligible.fleets, noneEligible.equips, { mode }).deliverable).toBe(0)
    },
  )

  it.each(['normal', 'tank'] as const)(
    'counts Kinu once even when both fleets field a deployable one (%s)',
    (mode) => {
      const { fleets, equips } = fleetsOf([[[3, 487, []]], [[3, 487, []]]])
      // Both are eligible: the fleet-level bonus is still granted only once.
      const expected = mode === 'normal' ? 12 : 10
      expect(calculateTransport(fleets, equips, { mode })).toEqual({
        planned: expected, deliverable: expected, hasTransportCargo: false,
      })
    },
  )

  // In-game 艦隊戦力分析: normal 205, tank 446.
  it('matches the recorded 2026 summer E-5 fleet', () => {
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
    const { fleets, equips } = fleetsOf([fleet.slice(0, 6), fleet.slice(6)])
    expect(calculateTransport(fleets, equips)).toEqual({
      planned: 205, deliverable: 205, hasTransportCargo: true,
    })
    expect(calculateTransport(fleets, equips, { mode: 'tank' })).toEqual({
      planned: 446, deliverable: 446, hasTransportCargo: true,
    })
  })

  // api_landing_hp.api_sub_value = 468 at S rank, Kinu in the escort fleet.
  it('matches the recorded tank fleet with Kinu', () => {
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
    const { fleets, equips } = fleetsOf([fleet.slice(0, 6), fleet.slice(6)])
    expect(calculateTransport(fleets, equips, { mode: 'tank' })).toEqual({
      planned: 468, deliverable: 468, hasTransportCargo: true,
    })
  })
})

describe('parseTankTransportMaps', () => {
  it('reads tank transport maps off chart_additional_info', () => {
    expect(parseTankTransportMaps({
      api_deck_param: [
        { api_seiku_value: 139, api_tp_value: 205, api_atp_value: { 625: 446 } },
        { api_seiku_value: 0, api_tp_value: 0 },
        { api_seiku_value: 0, api_tp_value: 12, api_atp_value: { 624: 0, 625: 30 } },
      ],
    })).toEqual([625])
    expect(parseTankTransportMaps({})).toEqual([])
  })
})
