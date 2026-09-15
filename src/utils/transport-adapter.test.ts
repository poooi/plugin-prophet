import { describe, expect, it } from 'vitest'
import type { Ship } from 'poi-lib-battle'
import type { APIGetMemberShip2Response } from 'kcsapi/api_get_member/ship2/response'
import type { APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'

import { transformToLibBattleClass } from './lib-battle-adapter'
import { calculateTransport } from './transport'
import { toTransportFleets } from './transport-adapter'

const memberShip = {
  api_id: 101,
  api_ship_id: 1,
  api_nowhp: 10,
  api_maxhp: 20,
  api_slot_ex: 201,
  api_kyouka: [0, 0, 0, 0],
  api_karyoku: [0],
  api_raisou: [0],
  api_taiku: [0],
  api_soukou: [0],
} as APIGetMemberShip2Response

const masterShip = { api_id: 1, api_stype: 2 } as APIMstShip

const memberItem = (instanceId: number, itemId: number) => ({
  api_id: instanceId,
  api_slotitem_id: itemId,
  api_level: 0,
  api_locked: 0,
})

const masterItem = (itemId: number, category: number) => ({
  api_id: itemId,
  api_name: String(itemId),
  api_type: [0, 0, category, 0, 0],
}) as APIMstSlotitem

describe('toTransportFleets', () => {
  it('preserves member/master equipment data and counts expansion-slot cargo once', () => {
    const fleets = transformToLibBattleClass(
      [[[memberShip, masterShip], null], []],
      [[[
        [memberItem(200, 576), masterItem(576, 24), undefined],
        [memberItem(201, 167), masterItem(167, 46), undefined],
        null,
      ]], []],
    )

    const normalized = toTransportFleets(fleets)
    expect(normalized).toEqual([[
      {
        shipId: 1,
        shipType: 2,
        eligible: true,
        items: [
          { itemId: 576, category: 24 },
          { itemId: 167, category: 46 },
        ],
      },
    ], []])
    expect(calculateTransport(normalized)).toEqual({
      planned: 15, deliverable: 15, hasTransportCargo: true,
    })
    // Destroyer 3.75 + R35 24 + Ka-Mi 12.5 = 40.25.
    expect(calculateTransport(normalized, 'tank')).toEqual({
      planned: 40, deliverable: 40, hasTransportCargo: true,
    })
    expect(toTransportFleets(fleets, [101])[0][0].eligible).toBe(false)
    // Retreat IDs are member IDs, not master ship IDs.
    expect(toTransportFleets(fleets, [1])[0][0].eligible).toBe(true)
  })

  it.each([[4, false], [5, false], [6, true]])(
    'preserves the HP eligibility threshold at %i / 20 HP',
    (api_nowhp, eligible) => {
      const fleets = transformToLibBattleClass(
        [[[{ ...memberShip, api_nowhp }, masterShip]]],
        [],
      )
      expect(toTransportFleets(fleets)[0][0].eligible).toBe(eligible)
    },
  )

  it('tolerates empty fleets, empty slots and incomplete raw data', () => {
    const ship = {
      raw: { api_stype: 2, poi_slot: [null, {}] },
    } as Ship
    expect(toTransportFleets([[null, undefined], [ship]])).toEqual([
      [],
      [{
        shipId: -1,
        shipType: 2,
        eligible: false,
        items: [{ itemId: -1, category: -1 }],
      }],
    ])
    expect(toTransportFleets([[{ raw: { api_stype: 2 } } as Ship]])[0][0].items)
      .toEqual([])
  })
})
