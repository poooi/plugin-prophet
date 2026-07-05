/**
 * Redux action creators for the prophet plugin.
 */

export const PLUGIN_KEY = 'poi-plugin-prophet'

export const ACTION_UPDATE_HISTORY = '@@poi-plugin-prophet@updateHistory'
export const ACTION_UPDATE_PRACTICE = '@@poi-plugin-prophet@updatePractice'
export const ACTION_LOAD_HISTORY = '@@poi-plugin-prophet@loadHistory'
export const ACTION_CLEAR_HISTORY = '@@poi-plugin-prophet@clearHistory'

export interface UpdateHistoryAction {
  type: typeof ACTION_UPDATE_HISTORY
  spot: string
  fFormation: string
  title: string
  smokeType: number
}

export interface UpdatePracticeAction {
  type: typeof ACTION_UPDATE_PRACTICE
  title: string
}

export interface LoadHistoryAction {
  type: typeof ACTION_LOAD_HISTORY
  history: Record<string, HistoryEntry>
}

export interface ClearHistoryAction {
  type: typeof ACTION_CLEAR_HISTORY
}

export interface HistoryEntry {
  fFormation?: string
  title?: string
  smokeType?: number
}

export type ProphetAction =
  | UpdateHistoryAction
  | UpdatePracticeAction
  | LoadHistoryAction
  | ClearHistoryAction

export function onBattleResult(opts: {
  spot: string
  fFormation: string
  title: string
  smokeType: number
}): UpdateHistoryAction {
  return {
    type: ACTION_UPDATE_HISTORY,
    ...opts,
  }
}

export function onGetPracticeInfo(opts: { title: string }): UpdatePracticeAction {
  return {
    type: ACTION_UPDATE_PRACTICE,
    title: opts.title,
  }
}

export function onLoadHistory(opts: { history: Record<string, HistoryEntry> }): LoadHistoryAction {
  return {
    type: ACTION_LOAD_HISTORY,
    history: opts.history,
  }
}

export function clearHistory(): ClearHistoryAction {
  return {
    type: ACTION_CLEAR_HISTORY,
  }
}
