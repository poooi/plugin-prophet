import { describe, it, expect } from 'vitest'
import {
  ACTION_UPDATE_HISTORY,
  ACTION_UPDATE_PRACTICE,
  ACTION_LOAD_HISTORY,
  ACTION_CLEAR_HISTORY,
  onBattleResult,
  onGetPracticeInfo,
  onLoadHistory,
  clearHistory,
} from '../../src/state/actions'

describe('action creators', () => {
  it('onBattleResult creates UPDATE_HISTORY action', () => {
    const result = onBattleResult({
      spot: '1-1-3',
      fFormation: 'Double Line',
      title: 'VS Enemy Destroyer',
      smokeType: 0,
    })
    expect(result).toEqual({
      type: ACTION_UPDATE_HISTORY,
      spot: '1-1-3',
      fFormation: 'Double Line',
      title: 'VS Enemy Destroyer',
      smokeType: 0,
    })
  })

  it('onGetPracticeInfo creates UPDATE_PRACTICE action', () => {
    const result = onGetPracticeInfo({ title: 'Practice Battle' })
    expect(result).toEqual({
      type: ACTION_UPDATE_PRACTICE,
      title: 'Practice Battle',
    })
  })

  it('onLoadHistory creates LOAD_HISTORY action with history', () => {
    const history = { '1-1-3': { fFormation: 'Line Ahead', title: 'Test' } }
    const result = onLoadHistory({ history })
    expect(result).toEqual({
      type: ACTION_LOAD_HISTORY,
      history,
    })
  })

  it('clearHistory creates CLEAR_HISTORY action', () => {
    const result = clearHistory()
    expect(result).toEqual({ type: ACTION_CLEAR_HISTORY })
  })
})
