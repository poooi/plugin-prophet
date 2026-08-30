import { describe, expect, it } from 'vitest'
import type { Ship } from 'poi-lib-battle'

import { SortieState } from '../utils/constants'
import {
  battleSpotKey,
  enemyTitle,
  friendTitle,
  isTankTransportMap,
  transportPoints,
} from './battle-view-model'

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
    const ship = {
      raw: {
        api_id: 114,
        api_nowhp: 514,
        api_maxhp: 666,
        api_stype: 1,
        api_ship_id: 325,
        poi_slot: [{ api_slotitem_id: 576 }], 
      },
    } as Ship

    expect(
      transportPoints({
        inEvent: true,
        mainFleet: [ship],
        itemMasters: { 576: { api_type: [0, 0, 24, 0, 0] } }, // R35
      }),
    ).toEqual({
      normal: { total: 8, actual: 8 },
      tank: { total: 24, actual: 24 },
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
})
