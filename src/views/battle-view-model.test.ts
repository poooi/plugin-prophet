import { describe, expect, it } from 'vitest'

import { SortieState } from '../utils/constants'
import { battleSpotKey, enemyTitle, friendTitle, transportPoints } from './battle-view-model'

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
    expect(transportPoints({ inEvent: false })).toEqual({ total: 0, actual: 0 })
  })
})
