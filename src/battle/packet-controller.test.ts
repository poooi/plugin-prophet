import { Battle, type BattleOptions } from 'poi-lib-battle'
import { beforeEach, describe, expect, it } from 'vitest'

import fixture from '../../test/fixtures/poi-lib-battle/battle-detail/air-base-attack/1615132578245.json'
import { SortieState } from '../utils/constants'
import { simulateBattleDisplayState } from './packet-controller'

describe('simulateBattleDisplayState', () => {
  beforeEach(() => {
    window.getStore = <T,>(_path?: string, defaultValue?: T): T => defaultValue as T
  })

  it('replays the curated lib-battle air-base oracle fixture into stable Prophet display state', () => {
    const battle = new Battle(fixture as unknown as BattleOptions)
    const state = simulateBattleDisplayState(battle)

    expect(state.sortieState).toBe(SortieState.Battle)
    expect(state.result?.rank).toBe('S')
    expect(state.result?.mvp).toEqual([0, -1])
    expect(state.battleForm).toBe('Parallel Engagement')
    expect(state.eFormation).toBe('Line Ahead')
    expect(state.fFormation).toBe('Line Ahead')
    expect(state.airControl).toBe('Air Superiority')
    expect(state.airForce).toEqual([6, 1, 12, 12])
    expect(state.mainFleet?.map((ship) => ship?.nowHP)).toEqual([93, 8, 1, 22, 9, 2])
    expect(state.enemyFleet?.map((ship) => ship?.nowHP)).toEqual([0, 0, 0, 0, 0, 0])
  })
})
