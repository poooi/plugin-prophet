/**
 * Redux observers for persisting prophet plugin state to localStorage.
 */
import { observer } from 'redux-observers'
import isEqual from 'lodash/isEqual'
import get from 'lodash/get'
import { createSelector } from 'reselect'
import { extensionSelectorFactory } from 'views/utils/selectors'
import { PLUGIN_KEY } from './actions'
import { setCachePath, saveCache } from './storage'

const createObserver = (path: string) => {
  const selector = createSelector(
    [extensionSelectorFactory(PLUGIN_KEY)],
    (ext: Record<string, unknown> | undefined) => get(ext, path, {}),
  )

  return observer(selector, (_dispatch: unknown, current: unknown, previous: unknown) => {
    if (!isEqual(current, previous) && current !== null && typeof current === 'object' && Object.keys(current).length > 0) {
      setCachePath(path as 'history' | 'useitem', current as never)
      saveCache()
    }
  })
}

export const historyObserver = createObserver('history')
export const useitemObserver = createObserver('useitem')
