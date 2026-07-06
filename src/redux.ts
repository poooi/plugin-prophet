import { observer } from 'redux-observers'
import { isEqual, get, debounce, set } from 'lodash'
import { combineReducers } from 'redux'
import { createSelector } from 'reselect'
import { extensionSelectorFactory } from 'views/utils/selectors'

import { PLUGIN_KEY, SortieState } from './utils'
import type { BattleDisplayState } from './types'

export const LS_PATH = '_prophet'

const cacheItem = window.isSafeMode ? '{}' : localStorage.getItem(LS_PATH)
export const CACHE: Record<string, Record<string, unknown>> = JSON.parse(cacheItem || '{}')

// Action types
interface UpdateHistoryAction {
  type: '@@poi-plugin-prophet@updateHistory'
  spot: string
  fFormation: string
  title: string
  smokeType: number
}

interface UpdatePracticeAction {
  type: '@@poi-plugin-prophet@updatePractice'
  title: string
}

interface LoadHistoryAction {
  type: '@@poi-plugin-prophet@loadHistory'
  history: Record<string, unknown>
}

interface ClearHistoryAction {
  type: '@@poi-plugin-prophet@clearHistory'
}

type HistoryAction = UpdateHistoryAction | UpdatePracticeAction | LoadHistoryAction | ClearHistoryAction

export const onBattleResult = ({
  spot,
  fFormation,
  title,
  smokeType,
}: {
  spot: string
  fFormation: string
  title: string
  smokeType: number
}): UpdateHistoryAction => ({
  type: '@@poi-plugin-prophet@updateHistory',
  spot,
  fFormation,
  title,
  smokeType,
})

export const onGetPracticeInfo = ({ title }: { title: string }): UpdatePracticeAction => ({
  type: '@@poi-plugin-prophet@updatePractice',
  title,
})

export const onLoadHistory = ({ history }: { history: Record<string, unknown> }): LoadHistoryAction => ({
  type: '@@poi-plugin-prophet@loadHistory',
  history,
})

const HistoryReducer = (
  state: Record<string, unknown> = (CACHE.history as Record<string, unknown>) ?? {},
  action: HistoryAction | { type: string },
): Record<string, unknown> => {
  switch ((action as HistoryAction).type) {
    case '@@poi-plugin-prophet@updateHistory': {
      const a = action as UpdateHistoryAction
      return { ...state, [a.spot]: { fFormation: a.fFormation, title: a.title, smokeType: a.smokeType } }
    }
    case '@@poi-plugin-prophet@updatePractice':
      return { ...state, practice: { title: (action as UpdatePracticeAction).title } }
    case '@@poi-plugin-prophet@loadHistory':
      return { ...state, ...(action as LoadHistoryAction).history }
    case '@@poi-plugin-prophet@clearHistory':
      return {}
    default:
      return state
  }
}

export const initBattleState: BattleDisplayState = {
  mainFleet: [],
  escortFleet: [],
  enemyFleet: null,
  enemyEscort: null,
  landBase: [],
  airForce: [0, 0, 0, 0],
  airControl: '',
  isBaseDefense: false,
  isHeavyBomberDefense: false,
  sortieState: SortieState.InPort,
  mapAreaId: 0,
  eventId: 0,
  eventKind: 0,
  result: {},
  battleForm: '',
  smokeType: 0,
  eFormation: '',
  fFormation: '',
}

interface PatchBattleAction {
  type: '@@poi-plugin-prophet@patchBattle'
  payload: Partial<BattleDisplayState>
}

type BattleAction = PatchBattleAction | { type: string }

export const onPatchBattle = (payload: Partial<BattleDisplayState>): PatchBattleAction => ({
  type: '@@poi-plugin-prophet@patchBattle',
  payload,
})

const BattleReducer = (
  state: BattleDisplayState = initBattleState,
  action: BattleAction,
): BattleDisplayState => {
  if (action.type === '@@poi-plugin-prophet@patchBattle') {
    return { ...state, ...(action as PatchBattleAction).payload }
  }
  return state
}

export const battleStateSelector = (state: PoiRootState): BattleDisplayState => {
  const ext = extensionSelectorFactory(PLUGIN_KEY)(state)
  return (ext as { battle?: BattleDisplayState }).battle ?? initBattleState
}

export const reducer = combineReducers({
  history: HistoryReducer,
  battle: BattleReducer,
})

export const setLocalStorage = (): void =>
  process.nextTick(() => {
    localStorage.setItem(LS_PATH, JSON.stringify(CACHE))
  })

const setLocalStorageDebounced = debounce(setLocalStorage, 5000)

const createObserver = (path: string) => {
  const selector = createSelector(
    [extensionSelectorFactory(PLUGIN_KEY)],
    (ext) => get(ext, path, {}),
  )

  return observer(selector, (_dispatch: unknown, current: unknown = {}, previous: unknown) => {
    const cur = current as Record<string, unknown>
    if (!isEqual(cur, previous) && Object.keys(cur).length > 0) {
      set(CACHE, path, cur)
      setLocalStorageDebounced()
    }
  })
}

export const historyObserver = createObserver('history')
