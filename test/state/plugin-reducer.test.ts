import { describe, it, expect, vi } from 'vitest'

// Storage uses localStorage which is mocked by jsdom, but we need to control
// isSafeMode – mock it before the module is imported.
vi.mock('../../src/host/poi-globals', () => ({
  isSafeMode: () => true,
}))

// Also mock storage side effects so we don't actually persist
vi.mock('../../src/state/storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/state/storage')>()
  return {
    ...actual,
    saveCache: vi.fn(),
    setCachePath: vi.fn(),
    loadCache: vi.fn(() => ({})),
  }
})

// Mock views/utils/tools (Poi host module)
vi.mock('views/utils/tools', () => ({
  compareUpdate: (prev: unknown, next: unknown) => (prev === next ? prev : next),
  pickExisting: (_template: unknown, source: unknown) => source,
}))

import { persistedReducer } from '../../src/state/plugin-reducer'
import {
  ACTION_UPDATE_HISTORY,
  ACTION_UPDATE_PRACTICE,
  ACTION_LOAD_HISTORY,
  ACTION_CLEAR_HISTORY,
} from '../../src/state/actions'

describe('persistedReducer', () => {
  const initialState = persistedReducer(undefined, { type: '@@INIT' })

  it('initializes with empty history and useitem', () => {
    expect(initialState.history).toEqual({})
    expect(initialState.useitem).toEqual({})
  })

  it('handles ACTION_UPDATE_HISTORY', () => {
    const state = persistedReducer(initialState, {
      type: ACTION_UPDATE_HISTORY,
      spot: '1-1-3',
      fFormation: 'Line Ahead',
      title: 'Test Battle',
      smokeType: 0,
    })
    expect(state.history['1-1-3']).toEqual({
      fFormation: 'Line Ahead',
      title: 'Test Battle',
      smokeType: 0,
    })
  })

  it('handles ACTION_UPDATE_PRACTICE', () => {
    const state = persistedReducer(initialState, {
      type: ACTION_UPDATE_PRACTICE,
      title: 'Practice Title',
    })
    expect(state.history['practice']).toEqual({ title: 'Practice Title' })
  })

  it('handles ACTION_LOAD_HISTORY', () => {
    const history = {
      '2-3-5': { fFormation: 'Diamond', title: 'Some Battle', smokeType: 1 },
    }
    const state = persistedReducer(initialState, {
      type: ACTION_LOAD_HISTORY,
      history,
    })
    expect(state.history).toEqual(history)
  })

  it('handles ACTION_CLEAR_HISTORY', () => {
    const withData = persistedReducer(initialState, {
      type: ACTION_UPDATE_HISTORY,
      spot: '1-1-3',
      fFormation: 'Line Ahead',
      title: 'Test',
      smokeType: 0,
    })
    expect(Object.keys(withData.history)).toHaveLength(1)
    const cleared = persistedReducer(withData, { type: ACTION_CLEAR_HISTORY })
    expect(cleared.history).toEqual({})
  })

  it('preserves history across unrelated actions', () => {
    const with1 = persistedReducer(initialState, {
      type: ACTION_UPDATE_HISTORY,
      spot: '1-1-3',
      fFormation: 'Line Ahead',
      title: 'First',
      smokeType: 0,
    })
    const with2 = persistedReducer(with1, {
      type: ACTION_UPDATE_HISTORY,
      spot: '2-3-5',
      fFormation: 'Diamond',
      title: 'Second',
      smokeType: 0,
    })
    expect(Object.keys(with2.history)).toHaveLength(2)
    expect(with2.history['1-1-3']?.fFormation).toBe('Line Ahead')
    expect(with2.history['2-3-5']?.fFormation).toBe('Diamond')
  })
})
