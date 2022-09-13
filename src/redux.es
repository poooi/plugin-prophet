import { observer } from 'redux-observers'
import { isEqual, get, keyBy, debounce, set } from 'lodash'
import { combineReducers } from 'redux'
import { createSelector } from 'reselect'
import { compareUpdate, pickExisting } from 'views/utils/tools'

import { extensionSelectorFactory } from 'views/utils/selectors'

import { PLUGIN_KEY } from './utils'

export const LS_PATH = '_prophet'
export const CACHE = do {
  const item = window.isSafeMode ? '{}' : localStorage.getItem(LS_PATH)
  JSON.parse(item || '{}')
}

export const onBattleResult = ({ spot, fFormation, title }) => ({
  type: '@@poi-plugin-prophet@updateHistory',
  spot,
  fFormation,
  title,
})

export const onGetPracticeInfo = ({ title }) => ({
  type: '@@poi-plugin-prophet@updatePractice',
  title,
})

export const onLoadHistory = ({ history }) => ({
  type: '@@poi-plugin-prophet@loadHistory',
  history,
})

const HistoryReducer = (state = CACHE.history || {}, action) => {
  const { type, spot, fFormation, title, history } = action
  switch (type) {
    case '@@poi-plugin-prophet@updateHistory':
      return {
        ...state,
        [spot]: {
          fFormation,
          title,
        },
      }
    case '@@poi-plugin-prophet@updatePractice':
      return {
        ...state,
        practice: {
          title,
        },
      }
    case '@@poi-plugin-prophet@loadHistory':
      return {
        ...state,
        ...history,
      }
    case '@@poi-plugin-prophet@clearHistory':
      return {}
    default:
  }
  return state
}

const indexify = (data) => keyBy(data, 'api_id')

const increment = (state, key, value) => ({
  ...state,
  [key]: {
    ...(state[key] || {}),
    api_count: (state[key]?.api_count || 0) + value,
  },
})

const UseItemReducer = (state = CACHE.useitem || {}, action) => {
  const { type, body = {} } = action
  switch (type) {
    case '@@Response/kcsapi/api_get_member/require_info': {
      const newState = indexify(body.api_useitem)
      return compareUpdate(pickExisting(state, newState), newState)
    }
    case '@@Response/kcsapi/api_get_member/useitem': {
      const newState = indexify(body)
      return compareUpdate(pickExisting(state, newState), newState)
    }
    case '@@Response/kcsapi/api_req_kousyou/remodel_slotlist_detail': {
      const {
        api_req_useitem_id,
        api_req_useitem_num,
        api_req_useitem_id2,
        api_req_useitem_num2,
      } = body
      let nextState = { ...state }

      // assume there's enough items
      if (api_req_useitem_id) {
        nextState = increment(
          nextState,
          api_req_useitem_id,
          api_req_useitem_num,
        )
      }
      if (api_req_useitem_id2) {
        nextState = increment(
          nextState,
          api_req_useitem_id2,
          api_req_useitem_num2,
        )
      }
      return compareUpdate(state, nextState)
    }
    case '@@Response/kcsapi/api_req_mission/result': {
      const { api_get_item1 } = body
      if (api_get_item1?.api_useitem_id > 0) {
        return increment(
          state,
          api_get_item1.api_useitem_id,
          api_get_item1.api_useitem_count,
        )
      }
      break
    }
    case '@@Response/kcsapi/api_req_combined_battle/battleresult':
    case '@@Response/kcsapi/api_req_sortie/battleresult': {
      const { api_get_useitem, api_get_exmap_useitem_id } = body
      let nextState = { ...state }
      if (api_get_useitem?.api_useitem_id > 0) {
        nextState = increment(nextState, api_get_useitem.api_useitem_id, 1)
      }
      if (api_get_exmap_useitem_id > 0) {
        nextState = increment(nextState, api_get_exmap_useitem_id, 1)
      }
      return compareUpdate(state, nextState)
    }
    // item consommation for api_exchange_type is not self complete, not going to support
    case '@@Request/kcsapi/api_req_member/itemuse':
    case '@@Response/kcsapi/api_req_member/itemuse':
    default:
  }
  return state
}

export const reducer = combineReducers({
  history: HistoryReducer,
  useitem: UseItemReducer,
})

export const setLocalStorage = () =>
  process.nextTick(() => {
    localStorage.setItem(LS_PATH, JSON.stringify(CACHE))
  })

const setLocalStorageDebounced = debounce(setLocalStorage, 5000)

const createObserver = (path) => {
  const selector = createSelector(
    [extensionSelectorFactory(PLUGIN_KEY)],
    (ext) => get(ext, path, {}),
  )

  return observer(selector, (dispatch, current = {}, previous) => {
    if (!isEqual(current, previous) && Object.keys(current).length > 0) {
      set(CACHE, path, current)
      setLocalStorageDebounced()
    }
  })
}

export const historyObserver = createObserver('history')
export const useitemObserver = createObserver('useitem')
