import { observer } from 'redux-observers'
import { isEqual } from 'lodash'

import { extensionSelectorFactory } from 'views/utils/selectors'

import { PLUGIN_KEY, HISTORY_PATH } from './utils'
import FileWriter from './file-writer'

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

export function reducer(state = {}, action) {
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
    default:
  }
  return state
}

const fileWriter = new FileWriter()

export const prophetObserver = observer(
  extensionSelectorFactory(PLUGIN_KEY),
  (dispatch, current = {}, previous) => {
    // avoid initial state overwrites file
    if (!isEqual(current, previous) && Object.keys(current).length > 0) {
      fileWriter.write(HISTORY_PATH, current)
    }
  },
)
