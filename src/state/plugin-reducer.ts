/**
 * Prophet plugin Redux reducer.
 * Handles history and useitem state with localStorage persistence.
 */
import { combineReducers } from 'redux'
import { compareUpdate, pickExisting } from 'views/utils/tools'
import { loadCache, setCachePath, saveCache } from './storage'
import {
  ACTION_UPDATE_HISTORY,
  ACTION_UPDATE_PRACTICE,
  ACTION_LOAD_HISTORY,
  ACTION_CLEAR_HISTORY,
  type ProphetAction,
  type HistoryEntry,
} from './actions'
import { isSafeMode } from '../host/poi-globals'

// Load initial cache
const CACHE = loadCache(isSafeMode())

type HistoryState = Record<string, HistoryEntry>

type UseItemState = Record<
  number,
  { api_id: number; api_count: number; [key: string]: unknown }
>

function historyReducer(state: HistoryState = CACHE.history ?? {}, action: ProphetAction | { type: string; [key: string]: unknown }): HistoryState {
  switch (action.type) {
    case ACTION_UPDATE_HISTORY: {
      const a = action as ProphetAction & { type: typeof ACTION_UPDATE_HISTORY }
      return {
        ...state,
        [a.spot]: {
          fFormation: a.fFormation,
          title: a.title,
          smokeType: a.smokeType,
        },
      }
    }
    case ACTION_UPDATE_PRACTICE: {
      const a = action as ProphetAction & { type: typeof ACTION_UPDATE_PRACTICE }
      return {
        ...state,
        practice: {
          title: a.title,
        },
      }
    }
    case ACTION_LOAD_HISTORY: {
      const a = action as ProphetAction & { type: typeof ACTION_LOAD_HISTORY }
      return { ...state, ...a.history }
    }
    case ACTION_CLEAR_HISTORY:
      return {}
    default:
      return state
  }
}

function keyById<T extends { api_id: number }>(data: T[]): Record<number, T> {
  const result: Record<number, T> = {}
  for (const item of data) {
    result[item.api_id] = item
  }
  return result
}

function increment(state: UseItemState, key: number, value: number): UseItemState {
  return {
    ...state,
    [key]: {
      ...(state[key] ?? {}),
      api_count: (state[key]?.api_count ?? 0) + value,
    },
  }
}

function useitemReducer(state: UseItemState = CACHE.useitem ?? {}, action: { type: string; body?: Record<string, unknown> }): UseItemState {
  const body = action.body ?? {}
  switch (action.type) {
    case '@@Response/kcsapi/api_get_member/require_info': {
      const data = body['api_useitem']
      if (!Array.isArray(data)) return state
      const newState = keyById(data as Array<{ api_id: number; api_count: number }>)
      return compareUpdate(pickExisting(state, newState) as UseItemState, newState) as UseItemState
    }
    case '@@Response/kcsapi/api_get_member/useitem': {
      if (!Array.isArray(body)) return state
      const newState = keyById(body as unknown as Array<{ api_id: number; api_count: number }>)
      return compareUpdate(pickExisting(state, newState) as UseItemState, newState) as UseItemState
    }
    case '@@Response/kcsapi/api_req_kousyou/remodel_slotlist_detail': {
      const id1 = body['api_req_useitem_id'] as number | undefined
      const num1 = body['api_req_useitem_num'] as number | undefined
      const id2 = body['api_req_useitem_id2'] as number | undefined
      const num2 = body['api_req_useitem_num2'] as number | undefined
      let next = { ...state }
      if (id1) next = increment(next, id1, num1 ?? 0)
      if (id2) next = increment(next, id2, num2 ?? 0)
      return compareUpdate(state, next) as UseItemState
    }
    case '@@Response/kcsapi/api_req_mission/result': {
      const item1 = body['api_get_item1'] as { api_useitem_id?: number; api_useitem_count?: number } | undefined
      if ((item1?.api_useitem_id ?? 0) > 0) {
        return increment(state, item1!.api_useitem_id!, item1?.api_useitem_count ?? 0)
      }
      return state
    }
    case '@@Response/kcsapi/api_req_combined_battle/battleresult':
    case '@@Response/kcsapi/api_req_sortie/battleresult': {
      const getUseitem = body['api_get_useitem'] as { api_useitem_id?: number } | undefined
      const exmapId = body['api_get_exmap_useitem_id'] as number | undefined
      let next = { ...state }
      if ((getUseitem?.api_useitem_id ?? 0) > 0) {
        next = increment(next, getUseitem!.api_useitem_id!, 1)
      }
      if ((exmapId ?? 0) > 0) {
        next = increment(next, exmapId!, 1)
      }
      return compareUpdate(state, next) as UseItemState
    }
    default:
      return state
  }
}

export const reducer = combineReducers({
  history: historyReducer,
  useitem: useitemReducer,
})

export type ProphetState = ReturnType<typeof reducer>

// Wire up cache persistence
const originalHistoryReducer = historyReducer
const wrappedHistoryReducer = (state: HistoryState | undefined, action: ReturnType<typeof historyReducer> extends never ? never : Parameters<typeof historyReducer>[1]): HistoryState => {
  const next = originalHistoryReducer(state, action as Parameters<typeof originalHistoryReducer>[1])
  if (next !== state) {
    setCachePath('history', next)
    saveCache()
  }
  return next
}

const originalUseitemReducer = useitemReducer
const wrappedUseitemReducer = (state: UseItemState | undefined, action: Parameters<typeof useitemReducer>[1]): UseItemState => {
  const next = originalUseitemReducer(state, action)
  if (next !== state) {
    setCachePath('useitem', next)
    saveCache()
  }
  return next
}

export const persistedReducer = combineReducers({
  history: wrappedHistoryReducer,
  useitem: wrappedUseitemReducer,
})
