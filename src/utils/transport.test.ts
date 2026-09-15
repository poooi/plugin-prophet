import { describe, expect, it } from 'vitest'

import {
  calculateTransport,
  parseTankTransportMaps,
  type TransportShip,
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

// [ship type, master ship ID, equipment master IDs]
type FleetFixture = [number, number, number[]][]

const shipsOf = (fleet: FleetFixture): TransportShip[] =>
  fleet.map(([shipType, shipId, items]) => ({
    shipType,
    shipId,
    eligible: true,
    items: items.map((itemId) => ({ itemId, category: category(itemId) })),
  }))

describe('calculateTransport', () => {
  it('scores all ships for planned TP and eligible ships for deliverable TP', () => {
    const ships = shipsOf([[2, 1, [75]], [3, 487, [999]]])
    ships[1].eligible = false
    expect(calculateTransport([ships])).toEqual({
      planned: 20, deliverable: 10, hasTransportCargo: true,
    })
    ships[0].eligible = false
    expect(calculateTransport([ships]).deliverable).toBe(0)
  })

  it('keeps ship capacity even when there is no transport cargo', () => {
    expect(calculateTransport([shipsOf([[2, 1, []]])])).toEqual({
      planned: 5, deliverable: 5, hasTransportCargo: false,
    })
    expect(calculateTransport([])).toEqual({
      planned: 0, deliverable: 0, hasTransportCargo: false,
    })
    expect(calculateTransport([[]], 'tank')).toEqual({
      planned: 0, deliverable: 0, hasTransportCargo: false,
    })
  })

  it.each([
    [2, 5], [3, 2], [21, 6], [6, 4], [10, 7], [16, 9],
    [14, 1], [17, 12], [15, 15], [22, 15], [20, 7], [4, 0], [999, 0],
  ])('scores ship type %i with base %i', (shipType, base) => {
    const fleets = [shipsOf([[shipType, 1, []]])]
    expect(calculateTransport(fleets).planned).toBe(base)
    expect(calculateTransport(fleets, 'tank').planned).toBe(Math.floor(base * 0.75))
  })

  it.each([
    [576, 24, 8, 24], [514, 24, 8, 23], [449, 24, 8, 21],
    [355, 24, 8, 20], [230, 24, 8, 19], [495, 24, 8, 19],
    [482, 24, 8, 19], [494, 24, 8, 17], [436, 24, 8, 16],
    [166, 24, 8, 14], [68, 24, 8, 6], [9999, 24, 8, 6],
    [526, 46, 2, 13.5], [167, 46, 2, 12.5], [525, 46, 2, 11.5],
    [499, 52, 0, 14], [498, 52, 0, 9], [497, 52, 0, 7], [496, 52, 0, 5],
    [75, 30, 5, 3.75], [145, 43, 1, 0.75], [9999, 1, 0, 0],
  ])('scores equipment %i in category %i', (itemId, category, normal, tank) => {
    // Four copies expose fractional values without per-item rounding.
    const ships: TransportShip[] = [{
      shipType: 1, shipId: 1, eligible: true,
      items: Array.from({ length: 4 }, () => ({ itemId, category })),
    }]
    expect(calculateTransport([ships])).toEqual({
      planned: normal * 4, deliverable: normal * 4, hasTransportCargo: normal > 0,
    })
    expect(calculateTransport([ships], 'tank')).toEqual({
      planned: tank * 4, deliverable: tank * 4, hasTransportCargo: tank > 0,
    })
  })

  it('combines fractional ship and equipment contributions before rounding', () => {
    const fleets = [shipsOf([[2, 1, [75, 167]]])]
    expect(calculateTransport(fleets).planned).toBe(12)
    // Destroyer 3.75 + drum 3.75 + Ka-Mi 12.5.
    expect(calculateTransport(fleets, 'tank').planned).toBe(20)
  })

  it('floors main and escort fleets separately, including after eligibility filtering', () => {
    const main = shipsOf([[2, 1, [68]], [6, 2, []]])
    main[1].eligible = false
    const fleets = [main, shipsOf([[2, 3, []]])]
    expect(calculateTransport(fleets, 'tank')).toEqual({
      planned: 15, deliverable: 12, hasTransportCargo: true,
    })
    expect(calculateTransport([fleets.flat()], 'tank').planned).toBe(16)
  })

  it('keeps the Kinu bonus unscaled', () => {
    const ships = shipsOf([[3, 487, [68]], [2, 1, [68]]])
    expect(calculateTransport([ships]).planned).toBe(31)
    expect(calculateTransport([ships], 'tank').planned).toBe(25)
  })

  it.each(['normal', 'tank'] as const)(
    'counts Kinu once across fleets and independently of eligibility/order (%s)',
    (mode) => {
      const [ineligible, eligible] = shipsOf([[3, 487, []], [3, 487, []]])
      ineligible.eligible = false
      const expected = mode === 'normal'
        ? { planned: 12, deliverable: 10, hasTransportCargo: false }
        : { planned: 10, deliverable: 9, hasTransportCargo: false }
      expect(calculateTransport([[ineligible], [eligible]], mode)).toEqual(expected)
      expect(calculateTransport([[eligible], [ineligible]], mode)).toEqual(expected)
      const sameFleet = mode === 'normal' ? 12 : 11
      expect(calculateTransport([[ineligible, eligible]], mode).planned).toBe(sameFleet)
      expect(calculateTransport([[ineligible, eligible]], mode).deliverable)
        .toBe(expected.deliverable)
      expect(calculateTransport([[eligible, ineligible]], mode).deliverable)
        .toBe(expected.deliverable)
      eligible.eligible = false
      expect(calculateTransport([[ineligible], [eligible]], mode).deliverable).toBe(0)
    },
  )

  it.each(['normal', 'tank'] as const)(
    'counts Kinu once even when both fleets field a deployable one (%s)',
    (mode) => {
      const main = shipsOf([[3, 487, []]])
      const escort = shipsOf([[3, 487, []]])
      // Both are eligible: the fleet-level bonus is still granted only once.
      const expected = mode === 'normal' ? 12 : 10
      expect(calculateTransport([main, escort], mode)).toEqual({
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
    const ships = shipsOf(fleet)
    const fleets = [ships.slice(0, 6), ships.slice(6)]
    expect(calculateTransport(fleets)).toEqual({
      planned: 205, deliverable: 205, hasTransportCargo: true,
    })
    expect(calculateTransport(fleets, 'tank')).toEqual({
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
    const ships = shipsOf(fleet)
    expect(calculateTransport([ships.slice(0, 6), ships.slice(6)], 'tank')).toEqual({
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
