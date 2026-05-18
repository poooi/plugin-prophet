import { observer } from 'redux-observers'
import { isEqual, get, keyBy, debounce, set } from 'lodash'
import { combineReducers } from 'redux'
import { createSelector } from 'reselect'
import { compareUpdate, pickExisting } from 'views/utils/tools'
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

interface UseItemEntry {
  api_id?: number
  api_count?: number
  [key: string]: unknown
}

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

const indexify = (data: UseItemEntry[]): Record<string, UseItemEntry> => keyBy(data, 'api_id')

const increment = (
  state: Record<string, UseItemEntry>,
  key: string | number,
  value: number,
): Record<string, UseItemEntry> => ({
  ...state,
  [key]: {
    ...(state[key] ?? {}),
    api_count: ((state[key]?.api_count as number | undefined) ?? 0) + value,
  },
})

interface GetMemberAction {
  type: '@@Response/kcsapi/api_get_member/require_info' | '@@Response/kcsapi/api_get_member/useitem'
  body: UseItemEntry[]
}

interface RemodelAction {
  type: '@@Response/kcsapi/api_req_kousyou/remodel_slotlist_detail'
  body: {
    api_req_useitem_id?: number
    api_req_useitem_num?: number
    api_req_useitem_id2?: number
    api_req_useitem_num2?: number
  }
}

interface MissionResultAction {
  type: '@@Response/kcsapi/api_req_mission/result'
  body: {
    api_get_item1?: { api_useitem_id?: number; api_useitem_count?: number }
  }
}

interface BattleResultAction {
  type:
    | '@@Response/kcsapi/api_req_combined_battle/battleresult'
    | '@@Response/kcsapi/api_req_sortie/battleresult'
  body: {
    api_get_useitem?: { api_useitem_id?: number }
    api_get_exmap_useitem_id?: number
  }
}

interface ItemUseAction {
  type:
    | '@@Request/kcsapi/api_req_member/itemuse'
    | '@@Response/kcsapi/api_req_member/itemuse'
}

type UseItemAction =
  | GetMemberAction
  | RemodelAction
  | MissionResultAction
  | BattleResultAction
  | ItemUseAction
  | { type: string }

const UseItemReducer = (
  state: Record<string, UseItemEntry> = (CACHE.useitem as Record<string, UseItemEntry>) ?? {},
  action: UseItemAction,
): Record<string, UseItemEntry> => {
  switch (action.type) {
    case '@@Response/kcsapi/api_get_member/require_info': {
      const a = action as GetMemberAction
      const newState = indexify(a.body)
      return compareUpdate(pickExisting(state, newState), newState) as Record<string, UseItemEntry>
    }
    case '@@Response/kcsapi/api_get_member/useitem': {
      const a = action as GetMemberAction
      const newState = indexify(a.body)
      return compareUpdate(pickExisting(state, newState), newState) as Record<string, UseItemEntry>
    }
    case '@@Response/kcsapi/api_req_kousyou/remodel_slotlist_detail': {
      const { body } = action as RemodelAction
      const {
        api_req_useitem_id,
        api_req_useitem_num,
        api_req_useitem_id2,
        api_req_useitem_num2,
      } = body
      let nextState = { ...state }
      if (api_req_useitem_id) {
        nextState = increment(nextState, api_req_useitem_id, api_req_useitem_num ?? 0)
      }
      if (api_req_useitem_id2) {
        nextState = increment(nextState, api_req_useitem_id2, api_req_useitem_num2 ?? 0)
      }
      return compareUpdate(state, nextState) as Record<string, UseItemEntry>
    }
    case '@@Response/kcsapi/api_req_mission/result': {
      const { body } = action as MissionResultAction
      const { api_get_item1 } = body
      if ((api_get_item1?.api_useitem_id ?? 0) > 0) {
        return increment(state, api_get_item1!.api_useitem_id!, api_get_item1!.api_useitem_count ?? 1)
      }
      break
    }
    case '@@Response/kcsapi/api_req_combined_battle/battleresult':
    case '@@Response/kcsapi/api_req_sortie/battleresult': {
      const { body } = action as BattleResultAction
      const { api_get_useitem, api_get_exmap_useitem_id } = body
      let nextState = { ...state }
      if ((api_get_useitem?.api_useitem_id ?? 0) > 0) {
        nextState = increment(nextState, api_get_useitem!.api_useitem_id!, 1)
      }
      if ((api_get_exmap_useitem_id ?? 0) > 0) {
        nextState = increment(nextState, api_get_exmap_useitem_id!, 1)
      }
      return compareUpdate(state, nextState) as Record<string, UseItemEntry>
    }
    case '@@Request/kcsapi/api_req_member/itemuse':
    case '@@Response/kcsapi/api_req_member/itemuse':
    default:
  }
  return state
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
  useitem: UseItemReducer,
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
export const useitemObserver = createObserver('useitem')
