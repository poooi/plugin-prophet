import { describe, expect, it } from 'vitest'
import type { APIGetMemberShip2Response } from 'kcsapi/api_get_member/ship2/response'
import type { APIGetMemberSlotItemResponse } from 'kcsapi/api_get_member/slot_item/response'
import type { APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'

import type { ProphetEquipEntry, ProphetFleetEntry } from '../types'
import { SortieState } from '../utils/constants'
import {
  battleSpotKey,
  enemyTitle,
  friendTitle,
  isTankTransportMap,
  transportPoints,
} from './battle-view-model'

const memberShip = (api_id: number, api_ship_id: number, nowhp = 10, maxhp = 10) =>
  ({ api_id, api_ship_id, api_nowhp: nowhp, api_maxhp: maxhp }) as APIGetMemberShip2Response

const masterShip = (api_stype: number) => ({ api_stype }) as APIMstShip

const memberItem = (api_slotitem_id: number) =>
  ({ api_slotitem_id }) as APIGetMemberSlotItemResponse

const masterItem = (api_type: number) =>
  ({ api_type: [0, 0, api_type, 0, 0] }) as APIMstSlotitem

const slot = (itemId: number, itemType: number): ProphetEquipEntry =>
  [memberItem(itemId), masterItem(itemType), undefined]

describe('battle view model helpers', () => {
  it('builds spot keys for practice and sortie nodes', () => {
    expect(battleSpotKey(SortieState.Practice, 11, 2)).toBe('practice')
    expect(battleSpotKey(SortieState.Navigation, 11, 2)).toBe('11-2')
  })

  it('builds enemy titles from settings and stored history', () => {
    expect(enemyTitle({ sortieState: SortieState.Practice, showEnemyTitle: true })).toBe('PvP')
    expect(enemyTitle({ sortieState: SortieState.Battle, showEnemyTitle: true })).toBe('Enemy Vessel')
    expect(enemyTitle({
      sortieState: SortieState.Battle,
      showEnemyTitle: true,
      storedEnemyTitle: 'Abyssal Fleet',
    })).toBe('Abyssal Fleet')
    expect(enemyTitle({
      sortieState: SortieState.Battle,
      showEnemyTitle: false,
      storedEnemyTitle: 'Abyssal Fleet',
    })).toBe('Enemy Vessel')
  })

  it('builds friendly titles from base defense, combined fleet, and fleet name', () => {
    expect(friendTitle({ showEnemyTitle: true, isBaseDefense: true })).toBe('Land Base')
    expect(friendTitle({ showEnemyTitle: false, combinedFlag: 1, fleetName: 'Fleet 1' })).toBe('Sortie Fleet')
    expect(friendTitle({ showEnemyTitle: true, combinedFlag: 1, fleetName: 'Fleet 1' })).toBe('Carrier Task Force')
    expect(friendTitle({ showEnemyTitle: true, combinedFlag: 0, fleetName: 'Fleet 1' })).toBe('Fleet 1')
  })

  it('hides transport points outside event maps', () => {
    expect(transportPoints({ inEvent: false })).toEqual({
      normal: { total: 0, actual: 0 },
      tank: { total: 0, actual: 0 },
    })
  })

  it('uses master data of equipments for transport calculations', () => {
    const fleets: ProphetFleetEntry[][] = [[
      [memberShip(114, 325, 514, 666), masterShip(1)],
    ]]
    const equips: ProphetEquipEntry[][][] = [[[slot(576, 24)]]]

    expect(transportPoints({ inEvent: true, fleets, equips })).toEqual({
      normal: { total: 8, actual: 8 },
      tank: { total: 24, actual: 24 },
    })
  })

  it('floors main and escort fleet transport points separately', () => {
    const fleets: ProphetFleetEntry[][] = [
      [
        [memberShip(1, 2), masterShip(2)],
        [memberShip(3, 6), masterShip(6)],
      ],
      [[memberShip(2, 2), masterShip(2)]],
    ]
    const equips: ProphetEquipEntry[][][] = [
      [[slot(68, 24)], []],
      [[]],
    ]

    expect(
      transportPoints({ inEvent: true, fleets, equips, escapedShipIds: [3] }),
    ).toEqual({
      normal: { total: 22, actual: 18 },
      tank: { total: 15, actual: 12 },
    })
  })

  it('knows which maps use tank transport', () => {
    expect(isTankTransportMap(625, [625])).toBe(true)
    expect(isTankTransportMap(624, [625])).toBe(false)
    expect(isTankTransportMap(625, [])).toBe(false)
    expect(isTankTransportMap(undefined, [625])).toBe(false)
    expect(isTankTransportMap(Number(undefined), [625])).toBe(false)
    expect(isTankTransportMap(Number('625'), [625])).toBe(true)
  })

  it('preserves cargo-only display while retaining actual ship capacity', () => {
    const fleets: ProphetFleetEntry[][] = [[[memberShip(1, 1), masterShip(2)]]]
    const equips: ProphetEquipEntry[][][] = [[[]]]
    expect(transportPoints({ inEvent: true, fleets, equips })).toEqual({
      normal: { total: 0, actual: 5 },
      tank: { total: 0, actual: 3 },
    })
  })

  it('retains Kinu bonus when the first Kinu has retreated', () => {
    const kinu = (api_id: number): ProphetFleetEntry => [memberShip(api_id, 487), masterShip(3)]
    const fleets: ProphetFleetEntry[][] = [[kinu(1)], [kinu(2)]]
    const equips: ProphetEquipEntry[][][] = [[[slot(68, 24)]], [[slot(68, 24)]]]
    expect(transportPoints({
      inEvent: true,
      fleets,
      equips,
      escapedShipIds: [1],
    })).toEqual({
      normal: { total: 28, actual: 18 },
      tank: { total: 22, actual: 15 },
    })
  })
})
